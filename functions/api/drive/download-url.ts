import { getDriveConfig, type DriveEnv } from "../../../src/drive/server/config";
import { errorResponse, jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/server/http";
import { createDownloadUrl } from "../../../src/drive/server/knowledge";
import { isDriveAdmin } from "../../../src/drive/server/session";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    return jsonResponse(await createDownloadUrl(getDriveConfig(env), body.topicId, body.path, {
      includeMethodology: isDriveAdmin(session.displayName),
    }));
  } catch (error) { return errorResponse(error); }
};
