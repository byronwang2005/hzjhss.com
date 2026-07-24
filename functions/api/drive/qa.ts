import type { DriveEnv } from "../../../src/drive/server/config";
import { getAiConfig, getDriveConfig } from "../../../src/drive/server/config";
import { jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/server/http";
import { buildQaRequestMessages, createQaClient, encodeSse, normalizeQaMessages, retryOnceOnContextLength, upstreamAiErrorMessage, upstreamAiHttpStatus } from "../../../src/drive/server/qa";
import { retrieveKnowledge } from "../../../src/drive/server/retrieval";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  const session = await readDriveSession({ request, env });
  if (session instanceof Response) return session;
  let aiConfig;
  try {
    aiConfig = getAiConfig(env);
  } catch (error) {
    return jsonResponse({ error: upstreamAiErrorMessage(error) }, upstreamAiHttpStatus(error));
  }
  // This is an infrastructure guard derived from the configured physical model
  // window, not a product-level question, history, or round limit.
  const maxRequestBytes = Math.max(64 * 1024, aiConfig.contextWindowTokens * 12);
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    return jsonResponse({ error: `请求体超过当前模型窗口对应的基础设施容量（${maxRequestBytes} bytes）` }, 413);
  }
  const body = await readJsonBody(request);
  const qaMessages = normalizeQaMessages(body.messages);
  const question = qaMessages.at(-1)?.content || "";
  const scope = body.scope === "global" ? "global" : "topic";
  try {
    // Reject an impossible latest question before feeding it to MiniSearch.
    buildQaRequestMessages(aiConfig, [{ role: "user", content: question }], { evidence: [], methodology: [] }, scope === "global");
  } catch (error) {
    return jsonResponse({ error: upstreamAiErrorMessage(error) }, upstreamAiHttpStatus(error));
  }
  let retrieved;
  try {
    retrieved = await retrieveKnowledge(getDriveConfig(env), { scope, topicId: body.topicId, query: question });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "资料检索失败" }, 400);
  }
  if (!retrieved.evidence.length && !retrieved.methodology.length) {
    return new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encodeSse("delta", { content: "当前检索资料不足，未找到与问题相关的已处理文件。" }));
        controller.enqueue(encodeSse("done", { ok: true }));
        controller.close();
      },
    }), { headers: sseHeaders() });
  }
  let stream;
  try {
    const client = createQaClient(aiConfig);
    const createStream = (budgetScale = 1) => {
      const built = buildQaRequestMessages(aiConfig, qaMessages, retrieved, scope === "global", { budgetScale });
      return client.chat.completions.create({
        model: aiConfig.model,
        messages: built.messages,
        stream: true,
        max_tokens: aiConfig.maxOutputTokens,
      }, { signal: request.signal });
    };
    stream = await retryOnceOnContextLength(createStream);
  } catch (error) {
    return jsonResponse({ error: upstreamAiErrorMessage(error) }, upstreamAiHttpStatus(error));
  }
  return new Response(new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          for (const choice of chunk.choices) {
            if (choice.delta.content) controller.enqueue(encodeSse("delta", { content: choice.delta.content }));
          }
        }
        controller.enqueue(encodeSse("done", { ok: true }));
      } catch (error) {
        controller.enqueue(encodeSse("error", { error: upstreamAiErrorMessage(error) }));
      } finally {
        controller.close();
      }
    },
  }), { headers: sseHeaders() });
};

function sseHeaders(): HeadersInit {
  return { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive" };
}
