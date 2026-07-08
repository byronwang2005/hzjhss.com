import type { DriveEnv } from "./config";
import { verifySessionCookie } from "./session";

export interface AuthedContext {
  request: Request;
  env: DriveEnv;
}

export function jsonResponse(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function requireDriveSession(context: AuthedContext): Promise<Response | null> {
  const ok = await verifySessionCookie(context.env, context.request.headers.get("cookie"));
  return ok ? null : jsonResponse({ error: "请先输入访问码" }, 401);
}

export function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "请求处理失败";
  const status = message.includes("Missing required environment variable") ? 500 : 400;
  return jsonResponse({ error: message }, status);
}
