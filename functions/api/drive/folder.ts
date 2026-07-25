import { getDriveConfig, type DriveEnv } from "../../../src/drive/server/config";
import { errorResponse, jsonResponse, readDriveAdminSession, readJsonBody } from "../../../src/drive/server/http";
import { patchKnowledgeFolderIncorporation } from "../../../src/drive/server/knowledge";

export const onRequestPatch: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    const result = await patchKnowledgeFolderIncorporation(getDriveConfig(env), {
      topicId: body.topicId,
      prefix: body.prefix,
      incorporated: body.incorporated,
      updatedBy: session.displayName,
    });
    return jsonResponse({ ok: true, ...result });
  } catch (error) { return errorResponse(error); }
};
