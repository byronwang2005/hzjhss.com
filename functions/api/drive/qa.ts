import type { DriveEnv } from "../../../src/drive/server/config";
import { getAiConfig, getDriveConfig } from "../../../src/drive/server/config";
import { jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/server/http";
import { buildQaRequestMessages, createQaClient, createQaCompletionParams, createQaStreamState, finishQaStreamEvents, normalizeQaMessages, qaModelStartError, qaProviderDeltaEvents, retryOnceOnContextLength, upstreamAiDiagnostic, upstreamAiErrorMessage, upstreamAiHttpStatus } from "../../../src/drive/server/qa";
import { KnowledgeScopeError, retrieveKnowledge } from "../../../src/drive/server/retrieval";
import { encodeSse } from "../../../src/drive/server/sse";
import type {
  QaErrorEventData,
  QaJsonErrorResponse,
  QaProgressStage,
  QaRetrievalSummary,
  QaSseEvent,
} from "../../../src/drive/shared/contracts";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  const requestId = crypto.randomUUID();
  const session = await readDriveSession({ request, env });
  if (session instanceof Response) return session;
  let aiConfig;
  try {
    aiConfig = getAiConfig(env);
  } catch (error) {
    const message = upstreamAiErrorMessage(error);
    console.error("QA configuration failed", {
      requestId,
      error: upstreamAiDiagnostic(error),
    });
    return jsonResponse({
      error: message,
      message,
      requestId,
      stage: "reasoning",
      code: "MODEL_CONFIGURATION_ERROR",
      retryable: false,
    } satisfies QaJsonErrorResponse, upstreamAiHttpStatus(error));
  }
  // This is an infrastructure guard derived from the configured physical model
  // window, not a product-level question, history, or round limit.
  const maxRequestBytes = Math.max(64 * 1024, aiConfig.contextWindowTokens * 12);
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    const message = `请求体超过当前模型窗口对应的基础设施容量（${maxRequestBytes} bytes）`;
    return jsonResponse({
      error: message,
      message,
      requestId,
      stage: "parsing",
      code: "MODEL_CAPACITY_EXCEEDED",
      retryable: false,
    } satisfies QaJsonErrorResponse, 413);
  }
  const body = await readJsonBody(request);
  const qaMessages = normalizeQaMessages(body.messages);
  const question = qaMessages.at(-1)?.content || "";
  const scope = body.scope === "global" ? "global" : "topic";
  try {
    // Reject an impossible latest question before feeding it to MiniSearch.
    buildQaRequestMessages(aiConfig, [{ role: "user", content: question }], { evidence: [], methodology: [] }, scope === "global");
  } catch (error) {
    const message = upstreamAiErrorMessage(error);
    const status = upstreamAiHttpStatus(error);
    return jsonResponse({
      error: message,
      message,
      requestId,
      stage: "parsing",
      code: status === 413 ? "MODEL_CAPACITY_EXCEEDED" : "MODEL_REQUEST_INVALID",
      retryable: false,
    } satisfies QaJsonErrorResponse, status);
  }
  return new Response(new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now();
      const streamState = createQaStreamState();
      let activeStage: QaProgressStage = "parsing";
      let retrievalSummaryForLog: QaRetrievalSummary | undefined;
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
          console.error("QA retrieval failed", {
            requestId,
            scope,
            stage: activeStage,
            error: safeErrorDiagnostic(error),
          });
          emitQaError(controller, qaRetrievalError(error, requestId));
          return;
        }
        phase("retrieving", "complete");
        const retrievalSummary: QaRetrievalSummary = {
          scope,
          ...retrieved.stats,
          elapsedMs: Date.now() - retrievalStartedAt,
        };
        retrievalSummaryForLog = retrievalSummary;
        console.log("QA retrieval complete", { requestId, ...retrievalSummary });
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
          console.error("QA model start failed", {
            requestId,
            scope,
            stage: activeStage,
            provider: aiConfig.provider,
            model: aiConfig.model,
            retrieval: retrievalSummaryForLog,
            error: upstreamAiDiagnostic(error),
          });
          emitQaError(controller, qaModelStartError(error, requestId));
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
        console.log("QA request complete", {
          requestId,
          scope,
          retrieval: retrievalSummaryForLog,
          totalMs: Date.now() - startedAt,
        });
      } catch (error) {
        if (request.signal.aborted) return;
        console.error("QA model stream failed", {
          requestId,
          scope,
          stage: activeStage,
          provider: aiConfig.provider,
          model: aiConfig.model,
          retrieval: retrievalSummaryForLog,
          error: upstreamAiDiagnostic(error),
        });
        for (const event of finishQaStreamEvents(streamState)) {
          emitQaEvent(controller, event);
        }
        emitQaError(controller, {
          stage: activeStage,
          requestId,
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

function qaRetrievalError(error: unknown, requestId: string): QaErrorEventData {
  if (error instanceof KnowledgeScopeError && error.kind === "invalid") {
    return {
      stage: "retrieving",
      requestId,
      code: "RETRIEVAL_SCOPE_INVALID",
      retryable: false,
      message: "当前检索范围无效，请刷新页面后重新选择专题。",
    };
  }
  if (error instanceof KnowledgeScopeError && error.kind === "unavailable") {
    return {
      stage: "retrieving",
      requestId,
      code: "RETRIEVAL_SCOPE_UNAVAILABLE",
      retryable: false,
      message: "当前专题已不存在或暂不可用，请返回专题列表重新选择。",
    };
  }
  return {
    stage: "retrieving",
    requestId,
    code: "RETRIEVAL_FAILED",
    retryable: true,
    message: "资料检索暂时不可用，请稍后重试。",
  };
}

function safeErrorDiagnostic(error: unknown): { name: string } {
  return { name: error instanceof Error ? error.name : "UnknownError" };
}
