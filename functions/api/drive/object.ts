import { getDriveConfig, type DriveEnv } from "../../../src/drive/server/config";
import { errorResponse, jsonResponse, readDriveAdminSession, readJsonBody } from "../../../src/drive/server/http";
import { deleteKnowledgeFile, patchKnowledgeFile } from "../../../src/drive/server/knowledge";
import { notifyIndexer } from "../../../src/drive/server/webhooks";

export const onRequestDelete: PagesFunction<DriveEnv> = async ({ request, env, waitUntil }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    const result = await deleteKnowledgeFile(getDriveConfig(env), body.topicId, body.path);
    if (result.indexChanged) waitUntil(notifyIndexer(env, { topicId: String(body.topicId) }));
    return jsonResponse({ ok: true });
  } catch (error) { return errorResponse(error); }
};

export const onRequestPatch: PagesFunction<DriveEnv> = async ({ request, env, waitUntil }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    const result = await patchKnowledgeFile(getDriveConfig(env), {
      topicId: body.topicId,
      relativePath: body.path,
      incorporated: body.incorporated,
      reportDate: body.reportDate,
      updatedBy: session.displayName,
    });
    if (result.indexChanged) waitUntil(notifyIndexer(env, { topicId: String(body.topicId) }));
    return jsonResponse({ ok: true, file: result.metadata });
  } catch (error) { return errorResponse(error); }
};
