import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { createFolder } from "../../../src/drive/cos";
import { errorResponse, jsonResponse, readJsonBody, requireDriveSession } from "../../../src/drive/http";
import { normalizeFolderName, normalizePrefix } from "../../../src/drive/paths";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const unauthorized = await requireDriveSession({ request, env });
    if (unauthorized) {
      return unauthorized;
    }

    const body = await readJsonBody(request);
    const prefix = normalizePrefix(body.prefix ?? "");
    const name = normalizeFolderName(body.name);
    const path = `${prefix}${name}/`;
    await createFolder(getDriveConfig(env), path);
    return jsonResponse({ ok: true, path });
  } catch (error) {
    return errorResponse(error);
  }
};
