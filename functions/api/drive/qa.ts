import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { DriveEnv } from "../../../src/drive/config";
import { getAiConfig, getDriveConfig } from "../../../src/drive/config";
import { jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/http";
import { createQaClient, createRetrievedQaSystemMessage, encodeSse, normalizeQaMessages, upstreamAiErrorMessage, upstreamAiHttpStatus } from "../../../src/drive/qa";
import { retrieveKnowledge } from "../../../src/drive/retrieval";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  const session = await readDriveSession({ request, env });
  if (session instanceof Response) return session;
  const body = await readJsonBody(request);
  const qaMessages = normalizeQaMessages(body.messages);
  const question = qaMessages.at(-1)?.content || "";
  const scope = body.scope === "global" ? "global" : "topic";
  let chunks;
  try {
    chunks = await retrieveKnowledge(getDriveConfig(env), { scope, topicId: body.topicId, query: question });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "资料检索失败" }, 400);
  }
  if (!chunks.length) {
    return new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encodeSse("delta", { content: "当前检索资料不足，未找到与问题相关的已处理文件。" }));
        controller.enqueue(encodeSse("done", { ok: true }));
        controller.close();
      },
    }), { headers: sseHeaders() });
  }
  const systemMessage = createRetrievedQaSystemMessage(chunks, scope === "global");
  const messages: ChatCompletionMessageParam[] = [{ role: "system", content: systemMessage }, ...qaMessages];
  let stream;
  try {
    const aiConfig = getAiConfig(env);
    stream = await createQaClient(aiConfig).chat.completions.create({
      model: aiConfig.model,
      messages,
      stream: true,
      max_tokens: aiConfig.maxOutputTokens,
    }, { signal: request.signal });
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
