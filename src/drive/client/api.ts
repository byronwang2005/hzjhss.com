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

export async function apiStream(
  path: string,
  options: { signal?: AbortSignal } = {},
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${DRIVE_API_ROOT}${path}`, {
    credentials: "same-origin",
    headers: { accept: "text/event-stream" },
    signal: options.signal,
  });
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({})) as { error?: unknown };
    throw new ApiError(
      typeof data.error === "string" ? data.error : `请求失败（${response.status}）`,
      response.status,
    );
  }
  return response.body;
}

export async function consumeSse(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: string, data: Record<string, unknown>) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = /^event:\s*(.+)$/m.exec(block)?.[1]?.trim();
      const dataText = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (event) {
        const data = dataText ? JSON.parse(dataText) as Record<string, unknown> : {};
        onEvent(event, data);
      }
      boundary = buffer.indexOf("\n\n");
    }
    if (done) break;
  }
}
