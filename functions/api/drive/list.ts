import { getDriveConfig, type DriveEnv } from "../../../src/drive/server/config";
import { errorResponse, jsonResponse, readDriveSession } from "../../../src/drive/server/http";
import { listKnowledgeFiles } from "../../../src/drive/server/knowledge";
import { isDriveAdmin } from "../../../src/drive/server/session";
import type { FileListResponse } from "../../../src/drive/shared/contracts";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) return session;
    const url = new URL(request.url);
    const response = await listKnowledgeFiles(
      getDriveConfig(env),
      url.searchParams.get("topicId"),
      url.searchParams.get("prefix") || "",
      url.searchParams.get("cursor"),
      { includeMethodology: isDriveAdmin(session.displayName) },
    ) satisfies FileListResponse;
    return jsonResponse(response);
  } catch (error) { return errorResponse(error); }
};
