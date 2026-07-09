import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { presignObjectUrl } from "../../../src/drive/cos";
import { errorResponse, jsonResponse, readJsonBody, requireDriveSession } from "../../../src/drive/http";
import { normalizeFileName, normalizePrefix } from "../../../src/drive/paths";
import { isSystemFileName } from "../../../src/drive/topic";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const unauthorized = await requireDriveSession({ request, env });
    if (unauthorized) {
      return unauthorized;
    }

    const body = await readJsonBody(request);
    const config = getDriveConfig(env);
    const prefix = normalizePrefix(body.prefix ?? "");
    const filename = normalizeFileName(body.filename);
    if (isSystemFileName(filename)) {
      return jsonResponse({ error: "不能上传系统文件名" }, 400);
    }
    const size = typeof body.size === "number" ? body.size : Number(body.size ?? 0);
    if (!Number.isFinite(size) || size <= 0) {
      return jsonResponse({ error: "文件大小无效" }, 400);
    }
    if (size > config.maxFileBytes) {
      return jsonResponse({ error: "文件超过上传大小限制" }, 413);
    }

    const contentType = typeof body.contentType === "string" && body.contentType ? body.contentType : "application/octet-stream";
    const path = `${prefix}${filename}`;
    const url = await presignObjectUrl(config, "PUT", path, { "content-type": contentType });
    return jsonResponse({
      url,
      path,
      contentType,
      expiresIn: config.signExpiresSeconds,
      maxFileBytes: config.maxFileBytes,
    });
  } catch (error) {
    return errorResponse(error);
  }
};
