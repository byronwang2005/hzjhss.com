import { getDriveConfig, type DriveEnv } from "../../../src/drive/server/config";
import { errorResponse, jsonResponse, readDriveSession } from "../../../src/drive/server/http";
import { listKnowledgeFiles } from "../../../src/drive/server/knowledge";
import { isDriveAdmin } from "../../../src/drive/server/session";
import { encodeSse } from "../../../src/drive/server/sse";
import type {
  FileListErrorEvent,
  FileListProgressStage,
  FileListResponse,
  FileListSseEvent,
} from "../../../src/drive/shared/contracts";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  const session = await readDriveSession({ request, env });
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const topicId = url.searchParams.get("topicId");
  const role = url.searchParams.get("role");
  const prefix = url.searchParams.get("prefix") || "";
  const cursor = url.searchParams.get("cursor");
  const includeMethodology = isDriveAdmin(session.displayName);
  if (!role) return errorResponse(new Error("请指定资料类型"));
  if (request.headers.get("accept")?.includes("text/event-stream")) {
    return streamFileList(request, env, { topicId, role, prefix, cursor, includeMethodology });
  }
  try {
    const response = await listKnowledgeFiles(
      getDriveConfig(env),
      topicId,
      role,
      prefix,
      cursor,
      { includeMethodology },
    ) satisfies FileListResponse;
    return jsonResponse(response);
  } catch (error) { return errorResponse(error); }
};

function streamFileList(
  request: Request,
  env: DriveEnv,
  input: {
    topicId: string | null;
    role: string | null;
    prefix: string;
    cursor: string | null;
    includeMethodology: boolean;
  },
): Response {
  return new Response(new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now();
      let activeStage: FileListProgressStage = "topic";
      const emit = (event: FileListSseEvent): void => {
        if (!request.signal.aborted) controller.enqueue(encodeSse(event.event, event.data));
      };
      try {
        const result = await listKnowledgeFiles(
          getDriveConfig(env),
          input.topicId,
          input.role,
          input.prefix,
          input.cursor,
          {
            includeMethodology: input.includeMethodology,
            onProgress(update) {
              activeStage = update.stage;
              emit({
                event: "phase",
                data: { ...update, elapsedMs: Date.now() - startedAt },
              });
            },
          },
        );
        emit({ event: "result", data: result });
        emit({ event: "done", data: { ok: true, totalMs: Date.now() - startedAt } });
      } catch {
        if (!request.signal.aborted) {
          const error: FileListErrorEvent = {
            stage: activeStage,
            code: "FILE_LIST_FAILED",
            retryable: true,
            message: fileListErrorMessage(activeStage),
          };
          emit({ event: "error", data: error });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // The browser may have cancelled a stale directory request.
        }
      }
    },
  }), {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

function fileListErrorMessage(stage: FileListProgressStage): string {
  if (stage === "topic") return "暂时无法确认专题，请返回专题列表后重试。";
  if (stage === "objects") return "暂时无法读取 COS 目录，请稍后重试。";
  if (stage === "metadata") return "文件状态同步未完成，请重新加载。";
  return "资料列表整理未完成，请重新加载。";
}
