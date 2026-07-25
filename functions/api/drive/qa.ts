import type { DriveEnv } from "../../../src/drive/server/config";
import { getAiConfig, getDriveConfig } from "../../../src/drive/server/config";
import { jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/server/http";
import { buildQaRequestMessages, createQaClient, createQaCompletionParams, createQaStreamState, finishQaStreamEvents, normalizeQaMessages, qaProviderDeltaEvents, retryOnceOnContextLength, upstreamAiErrorMessage, upstreamAiHttpStatus } from "../../../src/drive/server/qa";
import { KnowledgeScopeError, retrieveKnowledge } from "../../../src/drive/server/retrieval";
import { encodeSse } from "../../../src/drive/server/sse";
import type {
  QaErrorEventData,
  QaProgressStage,
  QaRetrievalSummary,
  QaSseEvent,
} from "../../../src/drive/shared/contracts";

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
  return new Response(new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now();
      const streamState = createQaStreamState();
      let activeStage: QaProgressStage = "parsing";
      const phase = (stage: QaProgressStage, state: "active" | "complete"): void => {
        activeStage = stage;
        emitQaEvent(controller, {
          event: "phase",
          data: { stage, state, elapsedMs: Date.now() - startedAt },
        });
      };
      try {
        phase("parsing", "active");
        phase("parsing", "complete");
        phase("retrieving", "active");
        const retrievalStartedAt = Date.now();
        let retrieved;
        try {
          retrieved = await retrieveKnowledge(getDriveConfig(env), {
            scope,
            topicId: body.topicId,
            query: question,
          });
        } catch (error) {
          emitQaError(controller, qaRetrievalError(error));
          return;
        }
        phase("retrieving", "complete");
        const retrievalSummary: QaRetrievalSummary = {
          scope,
          ...retrieved.stats,
          elapsedMs: Date.now() - retrievalStartedAt,
        };
        emitQaEvent(controller, { event: "retrieval_summary", data: retrievalSummary });
        if (!retrieved.evidence.length && !retrieved.methodology.length) {
          emitQaEvent(controller, {
            event: "no_results",
            data: {
              ...retrievalSummary,
              hint: "可尝试补充时间、对象、指标或资料名称后重新提问。",
            },
          });
          emitQaEvent(controller, { event: "done", data: { ok: true, totalMs: Date.now() - startedAt } });
          return;
        }

        phase("reasoning", "active");
        let stream;
        try {
          const client = createQaClient(aiConfig);
          const createStream = (budgetScale = 1) => {
            const built = buildQaRequestMessages(aiConfig, qaMessages, retrieved, scope === "global", { budgetScale });
            return client.chat.completions.create(
              createQaCompletionParams(aiConfig, built.messages),
              { signal: request.signal },
            );
          };
          stream = await retryOnceOnContextLength(createStream);
        } catch (error) {
          emitQaError(controller, qaModelStartError(error));
          return;
        }

        let composingAnnounced = false;
        for await (const chunk of stream) {
          for (const choice of chunk.choices) {
            for (const event of qaProviderDeltaEvents(aiConfig.provider, choice.delta, streamState)) {
              if (event.event === "delta" && !composingAnnounced) {
                phase("reasoning", "complete");
                phase("composing", "active");
                composingAnnounced = true;
              }
              emitQaEvent(controller, event);
            }
          }
        }
        for (const event of finishQaStreamEvents(streamState)) {
          emitQaEvent(controller, event);
        }
        if (composingAnnounced) {
          phase("composing", "complete");
        } else {
          phase("reasoning", "complete");
        }
        emitQaEvent(controller, { event: "done", data: { ok: true, totalMs: Date.now() - startedAt } });
      } catch {
        if (request.signal.aborted) return;
        for (const event of finishQaStreamEvents(streamState)) {
          emitQaEvent(controller, event);
        }
        emitQaError(controller, {
          stage: activeStage,
          code: "MODEL_STREAM_FAILED",
          retryable: true,
          message: "模型流式输出中断，请重试。",
        });
      } finally {
        try {
          controller.close();
        } catch {
          // The browser may have cancelled the response after stopping generation.
        }
      }
    },
  }), { headers: sseHeaders() });
};

function sseHeaders(): HeadersInit {
  return { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive" };
}

function emitQaEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: QaSseEvent,
): void {
  controller.enqueue(encodeSse(event.event, event.data));
}

function emitQaError(
  controller: ReadableStreamDefaultController<Uint8Array>,
  data: QaErrorEventData,
): void {
  emitQaEvent(controller, { event: "error", data });
}

function qaRetrievalError(error: unknown): QaErrorEventData {
  if (error instanceof KnowledgeScopeError && error.kind === "invalid") {
    return {
      stage: "retrieving",
      code: "RETRIEVAL_SCOPE_INVALID",
      retryable: false,
      message: "当前检索范围无效，请刷新页面后重新选择专题。",
    };
  }
  if (error instanceof KnowledgeScopeError && error.kind === "unavailable") {
    return {
      stage: "retrieving",
      code: "RETRIEVAL_SCOPE_UNAVAILABLE",
      retryable: false,
      message: "当前专题已不存在或暂不可用，请返回专题列表重新选择。",
    };
  }
  return {
    stage: "retrieving",
    code: "RETRIEVAL_FAILED",
    retryable: true,
    message: "资料检索暂时不可用，请稍后重试。",
  };
}

function qaModelStartError(error: unknown): QaErrorEventData {
  const status = error && typeof error === "object" && "status" in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
  if (upstreamAiHttpStatus(error) === 413) {
    return {
      stage: "reasoning",
      code: "MODEL_CAPACITY_EXCEEDED",
      retryable: false,
      message: "当前问题和资料超过模型可处理容量，请缩小问题范围。",
    };
  }
  if (status === 401 || status === 403) {
    return {
      stage: "reasoning",
      code: "MODEL_CONFIGURATION_ERROR",
      retryable: false,
      message: "模型服务配置异常，请联系管理员。",
    };
  }
  if (status === 429) {
    return {
      stage: "reasoning",
      code: "MODEL_BUSY",
      retryable: true,
      message: "模型服务当前繁忙，请稍后重试。",
    };
  }
  return {
    stage: "reasoning",
    code: "MODEL_START_FAILED",
    retryable: true,
    message: "模型服务暂时无法开始分析，请稍后重试。",
  };
}
