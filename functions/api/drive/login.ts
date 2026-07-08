import type { DriveEnv } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readJsonBody } from "../../../src/drive/http";
import { createSessionCookie, verifyAccessCode } from "../../../src/drive/session";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const body = await readJsonBody(request);
    const ok = await verifyAccessCode(env, body.accessCode);
    if (!ok) {
      return jsonResponse({ error: "访问码不正确" }, 401);
    }

    const cookie = await createSessionCookie(env, request.url);
    return jsonResponse({ ok: true }, 200, { "set-cookie": cookie });
  } catch (error) {
    return errorResponse(error);
  }
};
