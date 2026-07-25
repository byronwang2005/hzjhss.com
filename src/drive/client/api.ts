import { DRIVE_API_ROOT } from "../shared/runtime";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const response = await fetch(`${DRIVE_API_ROOT}${path}`, {
    method: options.method || "GET",
    credentials: "same-origin",
    headers: options.body === undefined ? undefined : { "content-type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: unknown };
    throw new ApiError(
      typeof data.error === "string" ? data.error : `请求失败（${response.status}）`,
      response.status,
    );
  }
  return response.json() as Promise<T>;
}
