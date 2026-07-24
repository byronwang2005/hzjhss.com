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
- `AI_MODEL`：Chat Completions 模型名
- `AI_MAX_OUTPUT_TOKENS`：默认 `2500`
- `PROCESSOR_WEBHOOK_URL`：文件处理 SCF 的 HTTPS Web 函数地址
- `INDEXER_WEBHOOK_URL`：索引构建 SCF 的 HTTPS Web 函数地址

旧 `cloud-drive/` 前缀不会被读取、迁移或删除。新系统首次上线时 `ai-knowledge-base/` 为空。

## COS 目录

```text
ai-knowledge-base/
├── system/
│   ├── users.json
│   └── temp/{jobId}/...
└── topics/{topicId}/
    ├── topic.json
    ├── files/{relativePath}/{filename}
    ├── file-meta/{relativePath}/{filename}.json
    ├── processed/{relativePath}/{filename}.__file__/
    │   ├── status.json
    │   ├── result.md
    │   ├── result.json
    │   └── chunks.json
    └── index/
        ├── search-index.json
        └── manifest.json
```

Bucket 配置：

- 私有读写并开启阻止公共访问。
- 开启 SSE-COS 服务端加密。
- 开启版本控制，非当前版本生命周期设置为 30 天。
- `ai-knowledge-base/system/temp/` 生命周期设置为 1 天。
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

COS `ObjectCreated` 事件触发文件处理函数，前缀设置为 `ai-knowledge-base/topics/`。函数内部只接受 `topics/{topicId}/files/` 对象，其他对象会被忽略，避免处理结果递归触发。

浏览器预签上传只写入 `ai-knowledge-base/system/temp/{jobId}/source`。`upload-complete` 完成 COS HEAD 校验后，使用 COS 服务端复制把对象转存到正式 `files/` 路径并删除临时对象；没有完成登记的对象由 1 天生命周期自动清理。

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

- PNG/JPG/JPEG/BMP、XLS/XLSX、MD、TXT、WPS：最大 10 MB
- PDF、DOC/DOCX、PPT/PPTX：最大 100 MB
- PDF：最多 300 页
- CSV 和未列出的格式不允许上传

上传完成后服务端使用 COS HEAD 复核大小、Content-Type 和 ETag。PDF 在 SCF 内使用 `pdfjs-dist` 再校验真实页数，超过 300 页不会调用腾讯解析。图片使用精简 OCR；其余文档使用多模态解析。处理结果切块后由 MiniSearch 建立每专题关键词索引。

## 问答

- 专题问答只检索当前专题索引。
- 全局问答并行检索所有就绪专题索引。
- 每次最多向模型发送 8 个命中片段，总长度最多 18000 个 UTF-16 字符。
- 回答必须引用文件名以及页码、工作表、幻灯片或章节。
- 未命中时不调用模型，直接返回资料不足。

## 本地验证

```bash
npm install
npm run typecheck
npm test
npm run build:pages
npm run build:scf -- ./build/scf
```
