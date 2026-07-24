import { getDriveConfig, type DriveEnv } from "../../../src/drive/server/config";
import { errorResponse, jsonResponse, readDriveSession } from "../../../src/drive/server/http";
import { listKnowledgeTopics } from "../../../src/drive/server/knowledge";
import { isDriveAdmin } from "../../../src/drive/server/session";
import type { OverviewResponse } from "../../../src/drive/shared/contracts";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) return session;
    const response = {
      role: isDriveAdmin(session.displayName) ? "admin" : "viewer",
      displayName: session.displayName,
      topics: await listKnowledgeTopics(getDriveConfig(env)),
    } satisfies OverviewResponse;
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error);
  }
};
