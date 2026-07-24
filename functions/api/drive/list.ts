import { getDriveConfig, type DriveEnv } from "../../../src/drive/server/config";
import { errorResponse, jsonResponse, readDriveAdminSession } from "../../../src/drive/server/http";
import { listKnowledgeFiles } from "../../../src/drive/server/knowledge";
import type { FileListResponse } from "../../../src/drive/shared/contracts";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const url = new URL(request.url);
    const response = await listKnowledgeFiles(
      getDriveConfig(env),
      url.searchParams.get("topicId"),
      url.searchParams.get("prefix") || "",
      url.searchParams.get("cursor"),
    ) satisfies FileListResponse;
    return jsonResponse(response);
  } catch (error) { return errorResponse(error); }
};
