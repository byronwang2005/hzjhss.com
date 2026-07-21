import { getDriveConfig, type DriveEnv } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveAdminSession, readJsonBody } from "../../../src/drive/http";
import { deleteKnowledgeFile } from "../../../src/drive/knowledge";
import { notifyIndexer } from "../../../src/drive/webhooks";

export const onRequestDelete: PagesFunction<DriveEnv> = async ({ request, env, waitUntil }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    await deleteKnowledgeFile(getDriveConfig(env), body.topicId, body.path);
    waitUntil(notifyIndexer(env, { topicId: String(body.topicId) }));
    return jsonResponse({ ok: true });
  } catch (error) { return errorResponse(error); }
};
