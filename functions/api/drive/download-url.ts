import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { presignObjectUrl } from "../../../src/drive/cos";
import { errorResponse, jsonResponse, readJsonBody, requireDriveSession } from "../../../src/drive/http";
import { normalizeObjectPath } from "../../../src/drive/paths";
import { hasSystemPathSegment } from "../../../src/drive/topic";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const unauthorized = await requireDriveSession({ request, env });
    if (unauthorized) {
      return unauthorized;
    }

    const body = await readJsonBody(request);
    const path = normalizeObjectPath(body.path);
    if (hasSystemPathSegment(path)) {
      return jsonResponse({ error: "不能下载系统文件" }, 400);
    }
    const url = await presignObjectUrl(getDriveConfig(env), "GET", path);
    return jsonResponse({ url, path });
  } catch (error) {
    return errorResponse(error);
  }
};
