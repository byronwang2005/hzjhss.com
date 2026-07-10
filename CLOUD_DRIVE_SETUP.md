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
- `DRIVE_SIGN_EXPIRES_SECONDS`: 默认 `900`
- `DRIVE_SESSION_MAX_AGE_SECONDS`: 默认 `28800`，即 8 小时

本地调试可在 `.dev.vars` 中放同名变量。该文件已被 `.gitignore` 忽略，不要提交真实密钥。

## 专题目录约定

根目录下的每个文件夹视为一个专题。创建专题会自动写入：

- `outputs/`
- `._topic.json`

每个目录还会维护 `._drive-meta.json`，用于记录文件上传者、上传时间、类型和 content type。系统隐藏文件不会在资料列表中展示，也不能通过页面删除。

Agent 流程分为两步：

1. “复制第一阶段提示词”会在专题下生成 `._agent-manifests/` 临时 manifest JSON。Agent 按短时链接读取资料，并以 `._topic.json` 中的分析关键词为依据完成分析。
2. 用户在同一会话中校正判断并确认最终口径后，“复制第二阶段提示词”会签发 1 小时有效、仅允许写入本次 Markdown/PDF 两个指定路径的 Bearer 令牌。Agent 通过专用的 `agent-output-upload-*` 接口回传，不使用浏览器 Cookie。

每个 v2 专题带有不可复用的 `instanceId`。Agent 成果路径绑定该实例，专题删除后签发过的旧 URL 不会被新建的同名专题聚合。没有 `._topic.json` 的残留对象前缀不会出现在专题概览。

旧专题中的 `成果生成与回传.prompt.md` 会继续隐藏并原样保留，但系统不再读取、创建或修改该文件。旧版 `description` 字段会在读取时映射为 `analysisKeywords`，下次保存后写成 v2 专题元数据。此次升级为 Cookie 和 Agent 令牌增加了用途隔离，部署时已有登录会话需要重新登录一次。

## 腾讯云 COS 配置

Bucket 保持私有读写。CORS 至少允许：

- Origin: Cloudflare Pages 正式域名、本地调试域名
- Methods: `GET`, `PUT`, `HEAD`
- Allowed Headers: `*` 或至少 `Content-Type`
- Expose Headers: `ETag`

CAM 子账号建议按最小权限授权，只允许目标 Bucket 的 `DRIVE_ROOT_PREFIX` 下执行：

- `cos:GetObject`
- `cos:PutObject`
- `cos:DeleteObject`
- `cos:GetBucket`

## 本地命令

```bash
npm install
npm run dev
npm test
npm run typecheck
```
