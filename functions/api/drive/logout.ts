import type { DriveEnv } from "../../../src/drive/server/config";
import { jsonResponse } from "../../../src/drive/server/http";
import { clearSessionCookie } from "../../../src/drive/server/session";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request }) => {
  return jsonResponse({ ok: true }, 200, { "set-cookie": clearSessionCookie(request.url) });
};
