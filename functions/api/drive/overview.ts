import { getDriveConfig, type DriveEnv } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveSession } from "../../../src/drive/http";
import { listKnowledgeTopics } from "../../../src/drive/knowledge";
import { isDriveAdmin } from "../../../src/drive/session";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) return session;
    return jsonResponse({
      role: isDriveAdmin(session.displayName) ? "admin" : "viewer",
      displayName: session.displayName,
      topics: await listKnowledgeTopics(getDriveConfig(env)),
    });
  } catch (error) {
    return errorResponse(error);
  }
};
