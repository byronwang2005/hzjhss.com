import { getDriveConfig, type DriveEnv } from "../../../src/drive/server/config";
import { errorResponse, jsonResponse, readDriveAdminSession, readJsonBody } from "../../../src/drive/server/http";
import { completeUpload } from "../../../src/drive/server/knowledge";
import { normalizeRelativeFilePath } from "../../../src/drive/server/paths";
import type { KnowledgeRole, UploadCompleteResponse, UploadRegistrationFailure } from "../../../src/drive/shared/contracts";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    if (!Array.isArray(body.files) || !body.files.length || body.files.length > 1000) throw new Error("请提供 1 到 1000 个已上传文件");
    const files = [];
    const failures: UploadRegistrationFailure[] = [];
    const requestId = crypto.randomUUID();
    for (const [itemIndex, entry] of body.files.entries()) {
      let relativePath = "";
      try {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("文件登记项无效");
        const file = entry as Record<string, unknown>;
        relativePath = normalizeRelativeFilePath(file.relativePath);
        const completed = await completeUpload(getDriveConfig(env), {
          topicId: body.topicId,
          uploadId: file.uploadId,
          relativePath,
          size: file.size,
          contentType: file.contentType,
          pdfPages: file.pdfPages,
          knowledgeRole: file.knowledgeRole,
          uploadedBy: session.displayName,
        });
        const knowledgeRole: KnowledgeRole = completed.knowledgeRole === "reference" || completed.knowledgeRole === "methodology"
          ? completed.knowledgeRole
          : "evidence";
        files.push({
          name: completed.name,
          path: completed.path,
          relativePath: completed.path,
          size: completed.size,
          lastModified: completed.uploadedAt,
          etag: completed.etag,
          contentType: completed.contentType,
          uploadedBy: completed.uploadedBy,
          uploadedAt: completed.uploadedAt,
          knowledgeRole,
          reportDate: completed.reportDate,
          reportDateSource: completed.reportDateSource,
        });
      } catch {
        console.error("File registration failed", {
          code: "FILE_REGISTRATION_FAILED",
          requestId,
          itemIndex,
        });
        failures.push({
          relativePath,
          code: "FILE_REGISTRATION_FAILED",
          retryable: true,
          message: "文件登记失败，请重新上传该文件。",
        });
      }
    }
    return jsonResponse({
      ok: failures.length === 0,
      files,
      failures,
    } satisfies UploadCompleteResponse);
  } catch (error) { return errorResponse(error); }
};
