import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { errorResponse, jsonResponse, requireDriveSession } from "../../../src/drive/http";
import { normalizePrefix } from "../../../src/drive/paths";
import { listDirectoryWithMetadata } from "../../../src/drive/topic";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const unauthorized = await requireDriveSession({ request, env });
    if (unauthorized) {
      return unauthorized;
    }

    const url = new URL(request.url);
    const prefix = normalizePrefix(url.searchParams.get("prefix") ?? "");
    const cursor = url.searchParams.get("cursor");
    const result = await listDirectoryWithMetadata(getDriveConfig(env), prefix, cursor);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
};
