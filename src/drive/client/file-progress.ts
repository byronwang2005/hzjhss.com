import type { FileListResponse, KnowledgeFile, KnowledgeRole } from "../shared/contracts";
import { PROCESSING_STALE_AFTER_MS } from "../shared/runtime";

export type FileTaskStage =
  | "validating"
  | "authorizing"
  | "uploading"
  | "registering"
  | "queued"
  | "processing"
  | "indexing"
  | "archived"
  | "ready"
  | "failed";

export type FileTaskState = "active" | "complete" | "failed";

export interface FileTaskItem {
  id: string;
  name: string;
  relativePath: string;
  knowledgeRole: KnowledgeRole;
  stage: FileTaskStage;
  state: FileTaskState;
  bytesUploaded: number;
  bytesTotal: number;
  sourceEtag?: string;
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  failedStage?: Exclude<FileTaskStage, "failed">;
  error?: string;
  retryable?: boolean;
}

export interface UploadBatchState {
  id: string;
  topicId: string;
  prefix: string;
  knowledgeRole: KnowledgeRole;
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  expanded: boolean;
  items: FileTaskItem[];
}

export interface FileTaskStep {
  stage: FileTaskStage;
  label: string;
}

const STAGE_ORDER: Record<FileTaskStage, number> = {
  validating: 0,
  authorizing: 1,
  uploading: 2,
  registering: 3,
  queued: 4,
  processing: 5,
  indexing: 6,
  archived: 7,
  ready: 7,
  failed: 8,
};

const SAFE_TASK_ERROR = "处理未完成，请检查文件后重试。";

export function createUploadBatch(
  topicId: string,
  prefix: string,
  knowledgeRole: KnowledgeRole,
  entries: Array<{ name: string; relativePath: string; size: number }>,
  now = Date.now(),
): UploadBatchState {
  return {
    id: `${topicId}:${now}`,
    topicId,
    prefix,
    knowledgeRole,
    startedAt: now,
    updatedAt: now,
    expanded: true,
    items: entries.map((entry, index) => ({
      id: `${topicId}:${now}:${index}`,
      name: entry.name,
      relativePath: entry.relativePath,
      knowledgeRole,
      stage: "validating",
      state: "active",
      bytesUploaded: 0,
      bytesTotal: entry.size,
      startedAt: now,
      updatedAt: now,
    })),
  };
}

export function advanceFileTask(
  batch: UploadBatchState,
  relativePath: string,
  stage: FileTaskStage,
  patch: Partial<Pick<FileTaskItem, "bytesUploaded" | "bytesTotal" | "sourceEtag" | "error" | "retryable">> = {},
  now = Date.now(),
): boolean {
  const item = batch.items.find((entry) => entry.relativePath === relativePath);
  if (!item) return false;
  const isRecovery = item.stage === "failed" && ["queued", "processing", "indexing", "archived", "ready"].includes(stage);
  if (!isRecovery && stage !== "failed" && STAGE_ORDER[stage] < STAGE_ORDER[item.stage]) return false;
  if (stage === "failed" && item.stage !== "failed") item.failedStage = item.stage;
  if (stage !== "failed") delete item.failedStage;
  item.stage = stage;
  item.state = stage === "failed" ? "failed" : stage === "ready" || stage === "archived" ? "complete" : "active";
  item.updatedAt = now;
  item.bytesUploaded = patch.bytesUploaded ?? item.bytesUploaded;
  item.bytesTotal = patch.bytesTotal ?? item.bytesTotal;
  item.sourceEtag = patch.sourceEtag ?? item.sourceEtag;
  item.error = stage === "failed" ? patch.error || SAFE_TASK_ERROR : patch.error;
  item.retryable = stage === "failed" ? patch.retryable ?? true : patch.retryable;
  if (item.state === "complete") item.completedAt = now;
  else delete item.completedAt;
  updateBatchCompletion(batch, now);
  return true;
}

export function reconcileUploadBatch(
  batch: UploadBatchState | null,
  topicId: string,
  listing: FileListResponse,
  now = Date.now(),
): void {
  if (!batch || batch.topicId !== topicId) return;
  for (const item of batch.items) {
    const file = listing.files.find((entry) => entry.path === item.relativePath);
    if (!file || STAGE_ORDER[item.stage] < STAGE_ORDER.registering) continue;
    if (item.sourceEtag && file.etag !== item.sourceEtag) continue;
    advanceFileTask(batch, item.relativePath, taskStageForFile(file, now), {}, now);
  }
  updateBatchCompletion(batch, now);
}

export function taskStageForFile(file: KnowledgeFile, now = Date.now()): FileTaskStage {
  if (file.knowledgeRole === "reference") return "archived";
  const processing = file.processing;
  if (!processing) return "failed";
  const updatedAt = Date.parse(processing.updatedAt);
  const staleAfter = PROCESSING_STALE_AFTER_MS[processing.state];
  const stale = Boolean(staleAfter && (!Number.isFinite(updatedAt) || now - updatedAt > staleAfter));
  if (stale || processing.state === "failed") return "failed";
  return processing.state;
}

export function taskSteps(role: KnowledgeRole): FileTaskStep[] {
  const common: FileTaskStep[] = [
    { stage: "validating", label: "校验" },
    { stage: "uploading", label: "上传" },
    { stage: "registering", label: "登记" },
  ];
  if (role === "reference") return [...common, { stage: "archived", label: "归档" }];
  return [
    ...common,
    { stage: "processing", label: role === "methodology" ? "解析方法论" : "解析内容" },
    { stage: "indexing", label: "更新索引" },
    { stage: "ready", label: "可问答" },
  ];
}

export function fileTaskStageLabel(stage: FileTaskStage, role: KnowledgeRole): string {
  const labels: Record<FileTaskStage, string> = {
    validating: "正在校验文件",
    authorizing: "正在获取上传凭证",
    uploading: "正在上传云端",
    registering: "正在登记资料",
    queued: "等待云处理",
    processing: role === "methodology" ? "正在解析方法论" : "正在解析内容",
    indexing: "正在更新索引",
    archived: "已归档",
    ready: "可问答",
    failed: "处理未完成",
  };
  return labels[stage];
}

export function fileTaskPercent(item: FileTaskItem): number {
  if (item.stage !== "uploading" || !item.bytesTotal) return 0;
  return Math.min(100, Math.max(0, Math.round(item.bytesUploaded / item.bytesTotal * 100)));
}

export function batchCounts(batch: UploadBatchState): { complete: number; failed: number; active: number } {
  const complete = batch.items.filter((item) => item.state === "complete").length;
  const failed = batch.items.filter((item) => item.state === "failed").length;
  return { complete, failed, active: batch.items.length - complete - failed };
}

export function elapsedLabel(startedAt: number, endedAt: number | undefined, now = Date.now()): string {
  const elapsedMs = Math.max(0, (endedAt || now) - startedAt);
  if (elapsedMs < 3_000) return "";
  const seconds = elapsedMs / 1_000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} 秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes} 分 ${remainingSeconds} 秒`;
}

export function stepState(
  currentStage: FileTaskStage,
  stepStage: FileTaskStage,
  failedStage: Exclude<FileTaskStage, "failed"> = "processing",
): "pending" | "active" | "complete" | "failed" {
  if (currentStage === "failed") {
    const failedOrder = STAGE_ORDER[failedStage];
    const stepOrder = STAGE_ORDER[stepStage];
    if (stepOrder < failedOrder) return "complete";
    if (
      stepOrder === failedOrder
      || (failedStage === "authorizing" && stepStage === "uploading")
      || (failedStage === "queued" && stepStage === "processing")
    ) return "failed";
    return "pending";
  }
  const currentOrder = STAGE_ORDER[currentStage];
  const stepOrder = STAGE_ORDER[stepStage];
  if (stepOrder < currentOrder) return "complete";
  if (stepOrder === currentOrder || (currentStage === "authorizing" && stepStage === "uploading")) return "active";
  return "pending";
}

function updateBatchCompletion(batch: UploadBatchState, now: number): void {
  batch.updatedAt = now;
  const terminal = batch.items.every((item) => item.state === "complete" || item.state === "failed");
  if (!terminal) {
    delete batch.completedAt;
    return;
  }
  batch.completedAt ||= now;
  if (batch.items.every((item) => item.state === "complete")) batch.expanded = false;
}
