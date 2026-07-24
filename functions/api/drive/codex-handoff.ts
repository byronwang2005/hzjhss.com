import type { DriveEnv } from "../../../src/drive/server/config";
import { getAiConfig, getDriveConfig } from "../../../src/drive/server/config";
import {
  buildCodexHandoffMarkdown,
  CODEX_HANDOFF_TTL_SECONDS,
  codexHandoffObjectPath,
  codexHandoffQuery,
  createCodexContinuationPrompt,
  createCodexHandoffAccess,
  normalizeCodexHandoffMessages,
  verifyCodexHandoffAccess,
} from "../../../src/drive/server/codex-handoff";
import { deleteObject, getObjectText, putObjectText } from "../../../src/drive/server/cos";
import { jsonResponse, readDriveSession } from "../../../src/drive/server/http";
import { readKnowledgeTopic } from "../../../src/drive/server/knowledge";
import { retrieveKnowledge } from "../../../src/drive/server/retrieval";
import { encodeSse } from "../../../src/drive/server/sse";
import type {
  CodexHandoffServerStage,
  CodexHandoffSseEvent,
} from "../../../src/drive/shared/contracts";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  const session = await readDriveSession({ request, env });
  if (session instanceof Response) return session;
  let aiConfig;
  try {
    aiConfig = getAiConfig(env);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Codex 交接配置无效" }, 500);
  }
  const maxRequestBytes = Math.max(64 * 1024, aiConfig.contextWindowTokens * 12);
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    return jsonResponse({ error: `交接请求超过基础设施容量（${maxRequestBytes} bytes）` }, 413);
  }
  let body: Record<string, unknown>;
  try {
    body = await readBoundedJsonBody(request, maxRequestBytes);
  } catch (error) {
    const tooLarge = error instanceof CodexHandoffBodyTooLargeError;
    return jsonResponse({
      error: tooLarge
        ? `交接请求超过基础设施容量（${maxRequestBytes} bytes）`
        : "交接请求 JSON 格式无效",
    }, tooLarge ? 413 : 400);
  }
  let messages;
  try {
    messages = normalizeCodexHandoffMessages(body.messages);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "交接对话格式无效" }, 400);
  }
  if (body.scope !== "global" && body.scope !== "topic") {
    return jsonResponse({ error: "交接资料范围无效" }, 400);
  }
  const scope = body.scope;

  return new Response(new ReadableStream<Uint8Array>({
    async start(controller) {
      let stage: CodexHandoffServerStage = "retrieving";
      try {
        emitHandoffEvent(controller, { event: "stage", data: { stage } });
        const driveConfig = getDriveConfig(env);
        const [retrieved, topic] = await Promise.all([
          retrieveKnowledge(driveConfig, {
            scope,
            topicId: body.topicId,
            query: codexHandoffQuery(messages),
          }),
          scope === "topic" ? readKnowledgeTopic(driveConfig, body.topicId) : Promise.resolve(null),
        ]);

        stage = "packing";
        emitHandoffEvent(controller, { event: "stage", data: { stage } });
        const createdAt = new Date();
        const expiresAt = new Date(createdAt.getTime() + CODEX_HANDOFF_TTL_SECONDS * 1000);
        const id = crypto.randomUUID();
        const markdown = buildCodexHandoffMarkdown(aiConfig, {
          messages,
          retrieved,
          scopeLabel: topic ? `专题：${topic.name}` : "全部专题",
          createdAt,
          expiresAt,
        });

        stage = "sealing";
        emitHandoffEvent(controller, { event: "stage", data: { stage } });
        await putObjectText(
          driveConfig,
          codexHandoffObjectPath(id),
          markdown,
          "text/markdown; charset=utf-8",
        );
        const access = await createCodexHandoffAccess(env, request.url, id, expiresAt);
        const continuation = createCodexContinuationPrompt(access.contextUrl);
        emitHandoffEvent(controller, {
          event: "ready",
          data: {
            ...continuation,
            contextUrl: access.contextUrl,
            expiresAt: access.expiresAt,
          },
        });
      } catch (error) {
        emitHandoffEvent(controller, {
          event: "error",
          data: {
            stage,
            message: error instanceof Error ? error.message : "Codex 交接失败",
          },
        });
      } finally {
        controller.close();
      }
    },
  }), { headers: sseHeaders() });
};

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env, waitUntil }) => {
  const verified = await verifyCodexHandoffAccess(env, request.url);
  if (verified.status === "invalid") {
    return jsonResponse({ error: "交接链接无效" }, 404, privateHeaders());
  }
  const driveConfig = getDriveConfig(env);
  const path = codexHandoffObjectPath(verified.id);
  if (verified.status === "expired") {
    waitUntil(deleteObject(driveConfig, path));
    return jsonResponse({ error: "交接链接已过期，请返回知识库重新生成" }, 410, privateHeaders());
  }
  const markdown = await getObjectText(driveConfig, path);
  if (markdown === null) {
    return jsonResponse({ error: "交接上下文不存在" }, 404, privateHeaders());
  }
  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      ...privateHeaders(),
    },
  });
};

function emitHandoffEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: CodexHandoffSseEvent,
): void {
  controller.enqueue(encodeSse(event.event, event.data));
}

function sseHeaders(): HeadersInit {
  return {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "private, no-store, no-transform",
    connection: "keep-alive",
    "x-robots-tag": "noindex, nofollow, noarchive",
    "referrer-policy": "no-referrer",
  };
}

function privateHeaders(): HeadersInit {
  return {
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow, noarchive",
    "referrer-policy": "no-referrer",
  };
}

class CodexHandoffBodyTooLargeError extends Error {}

async function readBoundedJsonBody(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
  if (!request.body) return {};
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new CodexHandoffBodyTooLargeError();
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};
}
