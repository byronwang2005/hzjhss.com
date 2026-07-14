# 嘉合杉升专题资料库部署说明

专题资料库页面是 `drive.html`，API 使用 Cloudflare Pages Functions，专题资料和成果元数据存储在腾讯云 COS 私有 Bucket。

## Cloudflare 配置

在 Pages 项目的 Settings > Environment variables 中配置：

Secrets:

- `COS_SECRET_ID`
- `COS_SECRET_KEY`
- `DRIVE_ACCESS_CODE`
- `DRIVE_SESSION_SECRET`
- `AI_API_KEY`: OpenAI-compatible 模型服务密钥，仅在服务端使用

Variables:

- `COS_BUCKET`: Bucket 全名，例如 `example-1250000000`
- `COS_REGION`: COS 地域，例如 `ap-guangzhou`
- `COS_ENDPOINT`: 可选，例如 `https://example-1250000000.cos.ap-guangzhou.myqcloud.com`
- `DRIVE_ROOT_PREFIX`: 默认 `cloud-drive/`
- `DRIVE_MAX_FILE_MB`: 默认 `512`
- `DRIVE_SESSION_MAX_AGE_SECONDS`: 默认 `28800`，即 8 小时
- `AI_BASE_URL`: 兼容服务的 API 根地址，例如 `https://provider.example.com/v1`
- `AI_MODEL`: Chat Completions 模型名
- `AI_MAX_OUTPUT_TOKENS`: 单次回答输出 token 上限，默认 `2500`

所有 COS 上传和下载预签名短链固定有效 30 分钟（1800 秒）。旧的 `DRIVE_SIGN_EXPIRES_SECONDS` 变量会被忽略，避免不同环境产生不一致的过期时间。

本地调试可在 `.dev.vars` 中放同名变量。该文件已被 `.gitignore` 忽略，不要提交真实密钥。

## 专题目录约定

根目录下的每个文件夹视为一个专题。创建专题会自动写入：

- `outputs/`
- `资料/`
- `周报/`
- `._topic.json`

每个目录还会维护 `._drive-meta.json`，用于记录文件上传者、上传时间、类型和 content type。系统隐藏文件不会在资料列表中展示，也不能通过页面删除。

根目录的 `._drive-users.json` 会自动记录成功登录过的姓名，作为专题负责人候选名单。专题元数据分别保留最初创建人 `createdBy` 和当前负责人 `owner`：成果创建者取成果文件的 `uploadedBy`，专题管理权限则跟随 `owner`；当前负责人或管理员可以在设置页转交负责人，管理员可以清理未负责任何专题的候选姓名。

新上传只能进入 `资料/` 或 `周报/`。旧专题根目录中除 `周报/`、`outputs/` 和系统隐藏内容之外的历史文件继续按稳定资料兼容读取，不进行搬迁。`周报/` 首版只用于维护，不进入网页 AI 问答。

只有姓名严格等于专题 `owner` 的当前负责人能看到 Agent 标签页并调用 `POST /api/drive/agent-context-task`；管理员身份不会自动获得这项权限。单一任务会在专题下生成 `._agent-manifests/` 临时 manifest，只包含 `资料/**` 与兼容历史资料，并签发仅允许写入指定 `outputs/<专题>-context-<时间戳>.md` 的 1 小时 Bearer 令牌。Agent 一次完成资料分析、完整方法论 Markdown 生成、验证和回传，不等待中间确认。

回传仍使用无 Cookie 的 `agent-output-upload-*` 接口，且只接受本次授权路径与 `text/markdown; charset=utf-8`。成功登记后会保留历史成果，把 `contextOutputPath` 指向最新版并设为精选成果；删除当前 Context 会清空该指针，不自动回退到历史版本。旧 PDF 成果继续保留、预览和下载。

网页“问答”对所有已登录用户开放。`POST /api/drive/qa` 每次从 COS 完整读取 `contextOutputPath`，携带最近最多 6 轮浏览器内对话，通过官方 `openai` Node SDK 调用自定义 `AI_BASE_URL` 的 `/chat/completions`，并把模型 `choices[].delta.content` 转为 SSE。服务端不会截断 Context、做关键词切片、调用 Files/File Search/Vector Store、Embedding 或向量数据库。上游上下文窗口不足时会直接显示明确错误。

每个 v5 专题带有不可复用的 `instanceId`。Agent 回传授权绑定该实例和签发时的负责人；专题删除重建或负责人变更后，旧授权失效。没有 `._topic.json` 的残留对象前缀不会出现在专题概览。

旧专题中的 `成果生成与回传.prompt.md` 会继续隐藏并原样保留，但系统不再读取、创建或修改该文件。旧版 `description` 字段会在读取时映射为 `analysisKeywords`，下次保存后写成 v5 专题元数据。

## 腾讯云 COS 配置

Bucket 保持私有读写。CORS 至少允许：

- Origin: Cloudflare Pages 正式域名、本地调试域名
- Methods: `GET`, `PUT`, `HEAD`
- Allowed Headers: `*` 或至少 `Content-Type`, `Range`
- Expose Headers: `ETag`, `Accept-Ranges`, `Content-Length`, `Content-Range`

PDF 页内预览使用 Range 请求。部署后需确认 COS 对带 `Range` 的 GET 返回 `206 Partial Content`，并返回正确的 `Content-Range`。如果站点额外配置 CSP，至少允许同源 worker、COS `connect-src` 和 PDF.js WASM 执行。

CAM 子账号建议按最小权限授权，只允许目标 Bucket 的 `DRIVE_ROOT_PREFIX` 下执行：

- `cos:GetObject`
- `cos:PutObject`
- `cos:DeleteObject`
- `cos:GetBucket`

## 本地命令

```bash
npm install
npm run build:drive
npm run dev
npm test
npm run typecheck
```
