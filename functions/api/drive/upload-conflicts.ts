import { getDriveConfig, type DriveEnv } from "../../../src/drive/server/config";
import { errorResponse, jsonResponse, readDriveAdminSession, readJsonBody } from "../../../src/drive/server/http";
import { findUploadConflicts } from "../../../src/drive/server/knowledge";
import type { UploadConflictsResponse } from "../../../src/drive/shared/contracts";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    const conflicts = await findUploadConflicts(getDriveConfig(env), {
      topicId: body.topicId,
      knowledgeRole: body.knowledgeRole,
      relativePaths: body.relativePaths,
    });
    return jsonResponse({ conflicts } satisfies UploadConflictsResponse);
  } catch (error) {
    return errorResponse(error);
  }
};
