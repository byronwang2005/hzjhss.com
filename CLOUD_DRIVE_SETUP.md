# 嘉合杉升云盘部署说明

云盘页面是 `drive.html`，API 使用 Cloudflare Pages Functions，文件存储在腾讯云 COS 私有 Bucket。

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

本地调试可在 `.dev.vars` 中放同名变量。该文件已被 `.gitignore` 忽略，不要提交真实密钥。

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
