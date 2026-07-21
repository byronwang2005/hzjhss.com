import { getDriveConfig, type DriveEnv } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveAdminSession, readJsonBody } from "../../../src/drive/http";
import { completeUpload } from "../../../src/drive/knowledge";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    if (!Array.isArray(body.files) || !body.files.length || body.files.length > 1000) throw new Error("请提供 1 到 1000 个已上传文件");
    const files = [];
    for (const entry of body.files) {
      const file = entry as Record<string, unknown>;
      const completed = await completeUpload(getDriveConfig(env), {
        topicId: body.topicId,
        uploadId: file.uploadId,
        relativePath: file.relativePath,
        size: file.size,
        contentType: file.contentType,
        pdfPages: file.pdfPages,
        uploadedBy: session.displayName,
      });
      files.push(completed);
    }
    return jsonResponse({ ok: true, files });
  } catch (error) { return errorResponse(error); }
};
