import { getDriveConfig, type DriveEnv } from "../../../src/drive/config";
import { getObjectText, headObject, putObjectText } from "../../../src/drive/cos";
import { errorResponse, jsonResponse, readDriveAdminSession, readJsonBody } from "../../../src/drive/http";
import { fileMetaPath, processingStatusPath, sourcePath, type FileMetadata, type ProcessingStatus } from "../../../src/drive/knowledge";
import { notifyProcessor } from "../../../src/drive/webhooks";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env, waitUntil }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    const config = getDriveConfig(env);
    if (!env.PROCESSOR_WEBHOOK_URL || !env.PROCESSOR_WEBHOOK_SECRET) throw new Error("文件处理 webhook 未配置");
    const topicId = String(body.topicId || "");
    const path = String(body.path || "");
    const metaText = await getObjectText(config, fileMetaPath(topicId, path));
    if (!metaText) throw new Error("文件元数据不存在");
    const metadata = JSON.parse(metaText) as FileMetadata;
    const current = await headObject(config, sourcePath(topicId, path));
    if (!current || current.etag !== metadata.etag) throw new Error("源文件已变化，请刷新后重试");
    const status: ProcessingStatus = { version: 1, topicId, path, sourceEtag: metadata.etag, state: "queued", processingKind: metadata.processingKind, updatedAt: new Date().toISOString() };
    await putObjectText(config, processingStatusPath(topicId, path), JSON.stringify(status, null, 2), "application/json; charset=utf-8");
    waitUntil(notifyProcessor(env, { topicId, path }));
    return jsonResponse({ ok: true });
  } catch (error) { return errorResponse(error); }
};
