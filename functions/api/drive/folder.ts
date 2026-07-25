import { getDriveConfig, type DriveEnv } from "../../../src/drive/server/config";
import { jsonResponse, readDriveAdminSession, readJsonBody } from "../../../src/drive/server/http";
import { patchKnowledgeFolderIncorporation, readKnowledgeFolderSummaryPage } from "../../../src/drive/server/knowledge";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  const session = await readDriveAdminSession({ request, env });
  if (session instanceof Response) return session;
  const requestId = crypto.randomUUID();
  try {
    const url = new URL(request.url);
    return jsonResponse(await readKnowledgeFolderSummaryPage(getDriveConfig(env), {
      topicId: url.searchParams.get("topicId"),
      prefix: url.searchParams.get("prefix"),
      cursor: url.searchParams.get("cursor"),
    }));
  } catch (error) {
    return folderErrorResponse(error, requestId);
  }
};

export const onRequestPatch: PagesFunction<DriveEnv> = async ({ request, env }) => {
  const session = await readDriveAdminSession({ request, env });
  if (session instanceof Response) return session;
  const requestId = crypto.randomUUID();
  try {
    const body = await readJsonBody(request);
    const result = await patchKnowledgeFolderIncorporation(getDriveConfig(env), {
      topicId: body.topicId,
      prefix: body.prefix,
      incorporated: body.incorporated,
      cursor: typeof body.cursor === "string" ? body.cursor : null,
      updatedBy: session.displayName,
      requestId,
    });
    return jsonResponse({ ok: true, ...result });
  } catch (error) { return folderErrorResponse(error, requestId); }
};

function folderErrorResponse(error: unknown, requestId: string): Response {
  console.error("Folder operation failed", {
    code: "FOLDER_OPERATION_FAILED",
    requestId,
    error: error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { name: "UnknownError", message: String(error) },
  });
  return jsonResponse({
    error: "文件夹资料操作失败，请重试。",
    code: "FOLDER_OPERATION_FAILED",
    requestId,
    retryable: true,
  }, 500);
}
