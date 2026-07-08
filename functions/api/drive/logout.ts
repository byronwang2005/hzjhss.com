import type { DriveEnv } from "../../../src/drive/config";
import { jsonResponse } from "../../../src/drive/http";
import { clearSessionCookie } from "../../../src/drive/session";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request }) => {
  return jsonResponse({ ok: true }, 200, { "set-cookie": clearSessionCookie(request.url) });
};
