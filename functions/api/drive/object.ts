import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { deleteObject } from "../../../src/drive/cos";
import { errorResponse, jsonResponse, readJsonBody, requireDriveSession } from "../../../src/drive/http";
import { normalizeObjectPath } from "../../../src/drive/paths";

export const onRequestDelete: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const unauthorized = await requireDriveSession({ request, env });
    if (unauthorized) {
      return unauthorized;
    }

    const body = await readJsonBody(request);
    const path = normalizeObjectPath(body.path, { allowTrailingSlash: true });
    await deleteObject(getDriveConfig(env), path);
    return jsonResponse({ ok: true, path });
  } catch (error) {
    return errorResponse(error);
  }
};
