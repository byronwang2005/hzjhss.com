import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/http";
import { isDriveAdmin } from "../../../src/drive/session";
import { readDriveOverview } from "../../../src/drive/topic";
import { listDriveUserCandidates, removeDriveUserCandidate } from "../../../src/drive/users";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) return session;
    return jsonResponse({ candidates: await listDriveUserCandidates(getDriveConfig(env)), canManage: isDriveAdmin(session.displayName) });
  } catch (error) {
    return errorResponse(error);
  }
};

export const onRequestDelete: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) return session;
    if (!isDriveAdmin(session.displayName)) {
      const error = new Error("只有管理员可以管理负责人候选名单");
      error.name = "DriveForbiddenError";
      throw error;
    }
    const body = await readJsonBody(request);
    const config = getDriveConfig(env);
    const overview = await readDriveOverview(config, { displayName: session.displayName, origin: new URL(request.url).origin });
    await removeDriveUserCandidate(config, body.displayName, new Set(overview.topics.map((topic) => topic.owner)));
    return jsonResponse({ ok: true, candidates: await listDriveUserCandidates(config) });
  } catch (error) {
    return errorResponse(error);
  }
};
