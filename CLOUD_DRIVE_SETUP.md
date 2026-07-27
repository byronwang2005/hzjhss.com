# 嘉合杉升 AI 知识库部署说明

网站首页 `/` 是 AI 知识库，API 使用 Cloudflare Pages Functions。原文件、腾讯云处理结果和 MiniSearch 索引全部存储在腾讯云 COS 私有 Bucket。

## 项目结构

```text
src/
├── shared/styles/      # 站点与云盘共用的设计令牌
├── site/               # 静态页面、共享模板与站点脚本
├── drive/
│   ├── client/         # Lit 客户端、上传与界面组件
│   ├── server/         # Cloudflare 服务端业务模块
│   └── shared/         # API 契约、文件策略和运行参数
└── scf/                # 腾讯云文件处理与索引构建源码
functions/api/drive/    # Cloudflare Pages 薄路由
public/assets/          # 人工维护的图片与下载资源
dist/                   # 构建生成，不提交 Git
```

`drive.js`、`drive.css`、图标 sprite、PDF.js 运行资源和 SCF 部署内容均由构建脚本生成，不应复制回源码目录或提交 Git。

## 权限模型

- 管理员固定为姓名精确等于 `汪旭`，可创建专题、上传、下载和删除文件。
- 其他登录用户只能使用全局问答和专题问答。
- 所有用户继续共用 `DRIVE_ACCESS_CODE`。知道访问码的人可以输入“汪旭”取得管理员权限，这是当前明确接受的风险。

## Cloudflare Pages

`wrangler.toml` 是 Pages Functions 运行配置的版本化真源，当前将每次请求的 CPU 上限设置为 30000 ms，以容纳“全部资料”首次加载多个专题索引时的冷启动开销；项目因此需要启用 Workers Paid。非 Secret 变量由顶层 `[vars]` 共享给本地、预览和生产环境，Secret 继续按环境在 Cloudflare Dashboard、`.dev.vars` 或 `wrangler pages secret` 中维护，不得写入配置文件。需要同步 Dashboard 中的非 Secret 配置时，先在临时目录运行 `wrangler pages download config hzjhss-com`，人工核对后再更新仓库版本。

构建设置：

- Build command：`npm run build:pages`
- Build output directory：`dist`
- Root directory：仓库根目录

Secrets：

- `COS_SECRET_ID`
- `COS_SECRET_KEY`
- `DRIVE_ACCESS_CODE`
- `DRIVE_SESSION_SECRET`
- `AI_API_KEY`
- `PROCESSOR_WEBHOOK_SECRET`
- `INDEXER_WEBHOOK_SECRET`

Variables：

- `COS_BUCKET`：完整 Bucket 名，例如 `example-1250000000`
- `COS_REGION`：例如 `ap-guangzhou`
- `COS_ENDPOINT`：可选自定义 COS Endpoint
- `DRIVE_ROOT_PREFIX`：固定为 `ai-knowledge-base/`
- `DRIVE_SESSION_MAX_AGE_SECONDS`：默认 `28800`
- `AI_BASE_URL`：OpenAI-compatible API 根地址
- `AI_MODEL`：Chat Completions 模型名；DeepSeek 应使用当前支持的 `deepseek-v4-pro` 或 `deepseek-v4-flash`
- `AI_MAX_OUTPUT_TOKENS`：默认 `2500`
- `AI_CONTEXT_WINDOW_TOKENS`：必填，当前模型公开的完整上下文窗口 token 数；系统会扣除输出预算和 5% 安全余量后动态装填资料
- `AI_PROVIDER`：可选，支持 `deepseek` 或 `openai-compatible`；模型名以 `deepseek-` 开头时默认使用 `deepseek`，其他模型默认使用标准兼容模式
- `AI_REASONING_EFFORT`：可选，DeepSeek 思考强度，仅支持 `high` 或 `max`，默认 `high`
- `AI_REQUEST_TIMEOUT_MS`：可选，模型流式请求超时毫秒数，默认 `300000`（300 秒）
- `PROCESSOR_WEBHOOK_URL`：文件处理 SCF 的 HTTPS Web 函数地址
- `INDEXER_WEBHOOK_URL`：索引构建 SCF 的 HTTPS Web 函数地址

旧 `cloud-drive/` 前缀不会被读取、迁移或删除。新系统首次上线时 `ai-knowledge-base/` 为空。

## COS 目录

```text
ai-knowledge-base/
├── system/
│   ├── users.json
│   ├── codex-handoffs/{handoffId}.md
│   └── temp/{jobId}/...
└── topics/{topicId}/
    ├── topic.json
    ├── files/{role}/{relativePath}/{filename}
    ├── file-meta/{role}/{relativePath}/{filename}.json
    ├── processed/{role}/{relativePath}/{filename}.__file__/
    │   ├── status.json
    │   ├── result.md
    │   ├── result.json
    │   └── chunks.json
    └── index/
        ├── search-index.json
        └── manifest.json
```

每个文件通过元数据区分知识角色：

- `reference`：研报原件，只存储和下载，不调用 OCR、不进入索引。
- `methodology`：每专题唯一，升级后新建专题使用 `嘉合杉升{专题名称}方法论.md`，历史专题继续使用 `__methodology__.md`；文件直接读取 Markdown 并进入方法论检索池，不执行历史路径迁移。
- `evidence`：周报等时效资料，按现有文档解析流程处理并进入时效检索池。

缺少角色字段的旧文件按 `evidence` 处理。
新专题元数据会持久化 `methodologyPath`，后续替换始终覆盖该路径；后端修改专题名称不会同步修改已经确定的方法论路径。专题名称不能包含 `/` 或 `\`。

Bucket 配置：

- 私有读写并开启阻止公共访问。
- 开启 SSE-COS 服务端加密。
- 开启版本控制。
- 当前不配置任何 COS 生命周期或定时删除规则，包括非当前版本、`ai-knowledge-base/system/temp/` 和 `ai-knowledge-base/system/codex-handoffs/`；现有空间冗余度足够，所有底层对象长期保留。
- Codex 交接读取签名固定在 2 小时后失效，但这只终止外部读取权限，不会删除 `ai-knowledge-base/system/codex-handoffs/` 中的 Markdown 对象。
- COS、SCF 和数据万象使用同一地域。

CORS：

- Origin：正式站点域名和本地调试域名
- Methods：`GET`, `PUT`, `HEAD`
- Allowed Headers：`Content-Type`, `Range`
- Expose Headers：`ETag`, `Content-Length`, `Content-Range`

## 腾讯云服务

需要开通：

- 数据万象图片 OCR，并确认当前账号可使用 `type=efficient`
- OCR 多模态解析 `MultimodalDocParse`
- 云函数 SCF
- COS 事件通知

COS `ObjectCreated` 事件触发文件处理函数，前缀设置为 `ai-knowledge-base/topics/`。函数内部只接受 `topics/{topicId}/files/{role}/` 对象；`reference` 对象会在读取元数据前直接跳过，其他对象会按角色读取独立的元数据和处理目录。

浏览器预签上传只写入 `ai-knowledge-base/system/temp/{jobId}/source`。浏览器先把登记凭据写入 `localStorage`，再逐文件调用 `upload-complete`；服务端完成 COS HEAD 校验后，使用 COS 服务端复制把对象转存到正式 `files/{role}/` 路径并删除临时对象。登记响应丢失时可凭 `uploadId` 幂等重试；没有完成登记的临时对象不会自动清理，需要时由管理员手动处理。

时效资料上传前会按专题、资料类型和完整相对路径批量检查同名文件。管理员可以替换全部冲突项、跳过同名项或取消批次；替换确认绑定原文件 ETag，确认后原文件若再次变化会返回 `409 UPLOAD_CONFLICT`。替换过程中会临时备份旧原件及索引元数据，登记失败时恢复旧版本；成功后显式通知文件处理函数重新解析并重建索引。

资料列表按当前目录和资料角色读取，Cloudflare 每次最多从 COS 返回 10 项（文件夹和文件合计）。客户端只展示当前页，由管理员使用“上一页/下一页”手动翻页，不扫描总数或计算总页数；刷新和后台状态轮询保持当前页，切换专题、资料角色或目录及文件变更后回到第一页。普通列表不会递归读取文件夹内的元数据，也不会同步计算研报文件夹的“已纳入/总数”。

研报文件夹的纳入统计仅在管理员打开“批量管理”时执行。`GET /api/drive/folder` 和 `PATCH /api/drive/folder` 均每页处理最多 10 项，由客户端在后台自动顺序翻完所有分页并持续显示进度；统计完成后，管理员可明确选择“全部纳入”或“全部取消”。单项失败不会中断该页或后续分页，分页请求会进行 3 次指数退避尝试，重复执行对已完成项保持幂等。

### 文件处理函数

源码入口：`src/scf/file-processor/index.mjs` 的 `handler`

环境变量：

- `TENCENT_SECRET_ID`
- `TENCENT_SECRET_KEY`
- `COS_BUCKET`
- `COS_REGION`
- `INDEXER_FUNCTION_NAME`
- `WEBHOOK_SECRET`：与 Cloudflare 的 `PROCESSOR_WEBHOOK_SECRET` 一致

配置：

- Node.js 22
- 超时时间至少 900 秒
- 函数实例并发上限设置为 1，由函数内 `p-limit` 对单批事件限制图片 10、文档 5，确保账号侧总并发不突破该上限
- 图片 OCR 业务并发上限 10
- 文档解析业务并发上限 5
- 开启异步调用重试

### 索引构建函数

源码入口：`src/scf/index-builder/index.mjs` 的 `handler`

环境变量：

- `TENCENT_SECRET_ID`
- `TENCENT_SECRET_KEY`
- `COS_BUCKET`
- `COS_REGION`
- `WEBHOOK_SECRET`：与 Cloudflare 的 `INDEXER_WEBHOOK_SECRET` 一致

将函数并发限制为 1，避免同一时间发布多个专题索引。文件处理函数通过 SCF 异步调用它；文件删除时 Cloudflare 也会通过 Web 函数通知它重建索引。

运行 `npm run build:scf -- <输出目录>` 时，脚本会从 `src/scf/` 打包共享源码、按锁文件安装函数依赖，并生成两个可直接上传的 ZIP。

## CAM 最小权限

Cloudflare 使用的子账号只允许 `ai-knowledge-base/` 下：

- `cos:GetObject`
- `cos:HeadObject`
- `cos:PutObject`
- `cos:DeleteObject`
- `cos:GetBucket`

SCF 角色额外需要：

- 数据万象 OCR 和 OCR 多模态解析调用权限
- 文件处理函数调用索引构建函数的 `scf:InvokeFunction`
- `ai-knowledge-base/topics/` 下的读写权限

不得授予 Bucket 其他前缀权限。

## 文件限制

- 研报原件：不限文件类型，每个文件最大 100 MB，不进行 AI 处理
- 方法论和时效资料：PNG/JPG/JPEG/BMP、XLS/XLSX、MD、TXT、WPS 最大 10 MB；PDF、DOC/DOCX、PPT/PPTX 最大 100 MB
- 需要 AI 处理的 PDF：最多 300 页；仅存档下载的研报原件不校验页数
- 方法论和时效资料不允许上传 CSV 及未列出的格式

上传完成后服务端使用 COS HEAD 复核大小、Content-Type 和 ETag。需要 AI 处理的 PDF 在 SCF 内再次校验真实页数，超过 300 页不会调用腾讯解析。图片使用精简 OCR，方法论 Markdown 直接读取，其余时效文档使用多模态解析。处理结果切块后由 MiniSearch 建立每专题关键词索引。

## 问答

- 专题问答只检索当前专题索引。
- 全局问答并行检索所有就绪专题索引。
- 方法论和时效资料分别检索，不设置固定召回片段数或字符数；系统按模型窗口动态装填检索资料和对话历史，并将单次问答输入限制在 128K tokens 以内，降低供应商分词偏差和超长请求风险。
- 输入预算取“模型窗口减去最大输出 token 和 5% 安全余量”与 128K tokens 中的较小值；超过预算时先移除最旧完整问答，再停止加入低排名资料。
- DeepSeek 问答显式开启思考模式并保持流式响应；界面只显示“正在深度思考”状态，服务端不会向浏览器转发、展示或保存原始 `reasoning_content`。
- `AI_MAX_OUTPUT_TOKENS` 同时覆盖思考过程与最终回答的 completion token；生产当前设置为 16K，输入与输出总和仍不得超过模型上下文窗口。
- 每次请求注入 `Asia/Shanghai` 当前日期；系统自动识别资料日期。包含“最新、本周、近期、截至”等时间意图时按资料日期增加近期权重，所有当前文件仍按内容相关性参与召回。
- 同一路径替换会更新该文件的当前版本，索引仅接受与当前源文件 ETag 一致的内容；需要保留历期周报时，请使用不同文件名或路径上传。
- 回答必须引用文件名以及页码、工作表、幻灯片或章节。
- 方法论只作为分析框架，对成员显示为“专题方法论”，不暴露内部文件名和位置。
- 未命中时不调用模型，直接返回资料不足。

## 本地验证

```bash
npm install
npm run typecheck
npm test
npm run build:pages
npm run build:scf -- ./build/scf
```
