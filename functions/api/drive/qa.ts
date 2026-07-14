import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { DriveEnv } from "../../../src/drive/config";
import { getAiConfig, getDriveConfig } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/http";
import { createQaClient, createQaSystemMessage, encodeSse, normalizeQaMessages, upstreamAiErrorMessage, upstreamAiHttpStatus } from "../../../src/drive/qa";
import { readCurrentContext, readTopic } from "../../../src/drive/topic";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }
    const body = await readJsonBody(request);
    const origin = new URL(request.url).origin;
    const driveConfig = getDriveConfig(env);
    const detail = await readTopic(driveConfig, body.prefix, { displayName: session.displayName, origin });
    const context = await readCurrentContext(driveConfig, detail.topic);
    if (!detail.topic.contextOutputPath || context === null) {
      return jsonResponse({ error: "该专题尚未准备可用的 Markdown Context" }, 409);
    }
    if (!context.trim()) {
      return jsonResponse({ error: "当前 Markdown Context 为空，问答已禁用" }, 409);
    }

    const qaMessages = normalizeQaMessages(body.messages);
    const aiConfig = getAiConfig(env);
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: createQaSystemMessage(context) },
      ...qaMessages,
    ];

    let stream;
    try {
      stream = await createQaClient(aiConfig).chat.completions.create({
        model: aiConfig.model,
        messages,
        stream: true,
        max_tokens: aiConfig.maxOutputTokens,
      }, { signal: request.signal });
    } catch (error) {
      return jsonResponse({ error: upstreamAiErrorMessage(error) }, upstreamAiHttpStatus(error));
    }

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let receivedContent = false;
        try {
          for await (const chunk of stream) {
            for (const choice of chunk.choices) {
              const content = choice.delta.content;
              if (content) {
                receivedContent = true;
                if (!safeEnqueue(controller, encodeSse("delta", { content }))) {
                  return;
                }
              }
            }
          }
          if (!receivedContent) {
            safeEnqueue(controller, encodeSse("error", { error: "模型没有返回可显示的流式内容" }));
          } else {
            safeEnqueue(controller, encodeSse("done", { ok: true }));
          }
        } catch (error) {
          safeEnqueue(controller, encodeSse("error", { error: upstreamAiErrorMessage(error) }));
        } finally {
          safeClose(controller);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-store",
        "x-accel-buffering": "no",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
};

function safeEnqueue(controller: ReadableStreamDefaultController<Uint8Array>, chunk: Uint8Array): boolean {
  try {
    controller.enqueue(chunk);
    return true;
  } catch {
    return false;
  }
}

function safeClose(controller: ReadableStreamDefaultController<Uint8Array>): void {
  try {
    controller.close();
  } catch {
    // The browser may have stopped generation and canceled the response stream.
  }
}
