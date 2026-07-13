# 嘉合杉升专题资料库部署说明

专题资料库页面是 `drive.html`，API 使用 Cloudflare Pages Functions，专题资料和成果元数据存储在腾讯云 COS 私有 Bucket。

## Cloudflare 配置

在 Pages 项目的 Settings > Environment variables 中配置：

Secrets:

- `COS_SECRET_ID`
- `COS_SECRET_KEY`
- `DRIVE_ACCESS_CODE`
- `DRIVE_SESSION_SECRET`

Variables:

- `COS_BUCKET`: Bucket 全名，例如 `example-1250000000`
- `COS_REGION`: COS 地域，例如 `ap-guangzhou`
- `COS_ENDPOINT`: 可选，例如 `https://example-1250000000.cos.ap-guangzhou.myqcloud.com`
- `DRIVE_ROOT_PREFIX`: 默认 `cloud-drive/`
- `DRIVE_MAX_FILE_MB`: 默认 `512`
- `DRIVE_SESSION_MAX_AGE_SECONDS`: 默认 `28800`，即 8 小时

所有 COS 上传和下载预签名短链固定有效 30 分钟（1800 秒）。旧的 `DRIVE_SIGN_EXPIRES_SECONDS` 变量会被忽略，避免不同环境产生不一致的过期时间。

本地调试可在 `.dev.vars` 中放同名变量。该文件已被 `.gitignore` 忽略，不要提交真实密钥。

## 专题目录约定

根目录下的每个文件夹视为一个专题。创建专题会自动写入：

- `outputs/`
- `._topic.json`

每个目录还会维护 `._drive-meta.json`，用于记录文件上传者、上传时间、类型和 content type。系统隐藏文件不会在资料列表中展示，也不能通过页面删除。

根目录的 `._drive-users.json` 会自动记录成功登录过的姓名，作为专题负责人候选名单。专题元数据分别保留最初创建人 `createdBy` 和当前负责人 `owner`：成果创建者取成果文件的 `uploadedBy`，专题管理权限则跟随 `owner`；当前负责人或管理员可以在设置页转交负责人，管理员可以清理未负责任何专题的候选姓名。

Agent 流程分为两步：

1. “复制第一阶段提示词”会在专题下生成 `._agent-manifests/` 临时 manifest JSON。Agent 按短时链接读取资料，并以 `._topic.json` 中的全局分析口径为依据完成分析。用户可在复制前填写一次性的“本次关注问题”，该输入只注入本次提示词，不写入专题元数据，也不会覆盖全局分析口径；留空时 Agent 会按全局口径推荐并分析最有价值的重点。
2. 用户在同一会话中校正判断并确认最终口径后，“复制第二阶段提示词”会签发 1 小时有效、仅允许写入本次 PDF 指定路径的 Bearer 令牌。Agent 通过专用的 `agent-output-upload-*` 接口回传，不使用浏览器 Cookie。

两阶段提示词都要求 Agent 使用终端 `curl` 访问 manifest、签名资料、回传 API 和 COS PUT，不使用 `web_fetch` 或浏览器抓取工具，避免非浏览器客户端被 Cloudflare 识别为 Error 1010。

每个 v2 专题带有不可复用的 `instanceId`。Agent 成果路径绑定该实例，专题删除后签发过的旧 URL 不会被新建的同名专题聚合。没有 `._topic.json` 的残留对象前缀不会出现在专题概览。

旧专题中的 `成果生成与回传.prompt.md` 会继续隐藏并原样保留，但系统不再读取、创建或修改该文件。旧版 `description` 字段会在读取时映射为 `analysisKeywords`，下次保存后写成 v2 专题元数据。此次升级为 Cookie 和 Agent 令牌增加了用途隔离，部署时已有登录会话需要重新登录一次。

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
