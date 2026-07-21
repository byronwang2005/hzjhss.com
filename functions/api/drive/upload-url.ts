import { getDriveConfig, type DriveEnv } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveAdminSession, readJsonBody } from "../../../src/drive/http";
import { createUpload } from "../../../src/drive/knowledge";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    return jsonResponse(await createUpload(getDriveConfig(env), {
      topicId: body.topicId,
      relativePath: body.relativePath,
      size: body.size,
      contentType: body.contentType,
      pdfPages: body.pdfPages,
    }));
  } catch (error) { return errorResponse(error); }
};
