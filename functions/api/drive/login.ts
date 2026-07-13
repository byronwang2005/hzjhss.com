import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readJsonBody } from "../../../src/drive/http";
import { createSessionCookie, normalizeDisplayName, verifyAccessCode } from "../../../src/drive/session";
import { registerDriveUser } from "../../../src/drive/users";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const body = await readJsonBody(request);
    const ok = await verifyAccessCode(env, body.accessCode);
    if (!ok) {
      return jsonResponse({ error: "访问码不正确" }, 401);
    }

    const displayName = normalizeDisplayName(body.displayName);
    await registerDriveUser(getDriveConfig(env), displayName);
    const cookie = await createSessionCookie(env, request.url, displayName);
    return jsonResponse({ ok: true, displayName }, 200, { "set-cookie": cookie });
  } catch (error) {
    return errorResponse(error);
  }
};
