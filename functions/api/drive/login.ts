import type { DriveEnv } from "../../../src/drive/server/config";
import { getDriveConfig } from "../../../src/drive/server/config";
import { errorResponse, jsonResponse, readJsonBody } from "../../../src/drive/server/http";
import { createSessionCookie, isDriveAdmin, normalizeDisplayName, verifyAccessCode } from "../../../src/drive/server/session";
import { registerDriveUser } from "../../../src/drive/server/users";

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
    return jsonResponse({ ok: true, displayName, role: isDriveAdmin(displayName) ? "admin" : "viewer" }, 200, { "set-cookie": cookie });
  } catch (error) {
    return errorResponse(error);
  }
};
