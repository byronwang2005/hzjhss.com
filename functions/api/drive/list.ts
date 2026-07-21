import { getDriveConfig, type DriveEnv } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveAdminSession } from "../../../src/drive/http";
import { listKnowledgeFiles } from "../../../src/drive/knowledge";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const url = new URL(request.url);
    return jsonResponse(await listKnowledgeFiles(getDriveConfig(env), url.searchParams.get("topicId"), url.searchParams.get("prefix") || "", url.searchParams.get("cursor")));
  } catch (error) { return errorResponse(error); }
};
