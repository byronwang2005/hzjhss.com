import type { DriveEnv } from "./config";
import { getDriveSession, isDriveAdmin, type DriveSession } from "./session";

export interface AuthedContext {
  request: Request;
  env: DriveEnv;
}

export function jsonResponse(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  const responseHeaders = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  new Headers(headers).forEach((value, name) => responseHeaders.set(name, value));
  return new Response(JSON.stringify(data), {
    status,
    headers: responseHeaders,
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
  const ok = await getDriveSession(context.env, context.request.headers.get("cookie"));
  return ok ? null : jsonResponse({ error: "请先输入姓名和访问码" }, 401);
}

export async function readDriveSession(context: AuthedContext): Promise<DriveSession | Response> {
  const session = await getDriveSession(context.env, context.request.headers.get("cookie"));
  return session ?? jsonResponse({ error: "请先输入姓名和访问码" }, 401);
}

export async function readDriveAdminSession(context: AuthedContext): Promise<DriveSession | Response> {
  const session = await getDriveSession(context.env, context.request.headers.get("cookie"));
  if (!session) {
    return jsonResponse({ error: "请先输入姓名和访问码" }, 401);
  }
  if (!isDriveAdmin(session.displayName)) {
    return jsonResponse({ error: "只有管理员汪旭可以执行此操作" }, 403);
  }
  return session;
}

export function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "请求处理失败";
  const status =
    error instanceof Error && error.name === "DriveForbiddenError"
      ? 403
      : message.includes("Missing required environment variable")
        ? 500
        : 400;
  return jsonResponse({ error: message }, status);
}
