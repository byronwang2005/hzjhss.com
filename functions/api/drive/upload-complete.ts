import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/http";
import { recordUploadComplete } from "../../../src/drive/topic";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }

    const body = await readJsonBody(request);
    const file = await recordUploadComplete(getDriveConfig(env), {
      path: body.path,
      size: body.size,
      contentType: body.contentType,
      kind: body.kind,
      displayName: session.displayName,
    });
    return jsonResponse({ ok: true, file });
  } catch (error) {
    return errorResponse(error);
  }
};
