export type UserRole = "admin" | "viewer";
export type ProcessingState = "queued" | "processing" | "indexing" | "ready" | "failed";
export type KnowledgeRole = "reference" | "methodology" | "evidence";
export type ReportDateSource = "filename" | "content" | "upload" | "manual";
export type CodexHandoffServerStage = "retrieving" | "packing" | "sealing";
export type CodexHandoffStage =
  | "preparing"
  | CodexHandoffServerStage
  | "launching"
  | "complete"
  | "error";
export type QaProgressStage = "parsing" | "retrieving" | "reasoning" | "composing";
export type QaProgressState = "active" | "complete";

export interface QaPhaseEventData {
  stage: QaProgressStage;
  state: QaProgressState;
  elapsedMs: number;
}

export interface QaRetrievalSummary {
  scope: "global" | "topic";
  topicCount: number;
  candidateCount: number;
  evidenceCount: number;
  methodologyCount: number;
  evidenceSourceCount: number;
  methodologySourceCount: number;
  elapsedMs: number;
}

export interface QaNoResultsEventData extends QaRetrievalSummary {
  hint: string;
}

export interface QaErrorEventData {
  stage: QaProgressStage;
  code:
    | "RETRIEVAL_SCOPE_INVALID"
    | "RETRIEVAL_SCOPE_UNAVAILABLE"
    | "RETRIEVAL_FAILED"
    | "MODEL_CAPACITY_EXCEEDED"
    | "MODEL_CONFIGURATION_ERROR"
    | "MODEL_BUSY"
    | "MODEL_START_FAILED"
    | "MODEL_STREAM_FAILED";
  retryable: boolean;
  message: string;
}

export type QaSseEvent =
  | { event: "phase"; data: QaPhaseEventData }
  | { event: "retrieval_summary"; data: QaRetrievalSummary }
  | { event: "no_results"; data: QaNoResultsEventData }
  | { event: "thinking"; data: { active: boolean } }
  | { event: "delta"; data: { content: string } }
  | { event: "done"; data: { ok: true; totalMs: number } }
  | { event: "error"; data: QaErrorEventData };

export interface CodexHandoffRequest {
  scope: "global" | "topic";
  topicId?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface CodexHandoffReady {
  deepLink: string;
  contextUrl: string;
  fallbackPrompt: string;
  expiresAt: string;
}

export type CodexHandoffSseEvent =
  | { event: "stage"; data: { stage: CodexHandoffServerStage } }
  | { event: "ready"; data: CodexHandoffReady }
  | { event: "error"; data: { stage: CodexHandoffServerStage; message: string } };

export interface TopicSummary {
  version: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  indexVersion: number;
  methodologyPath?: string;
  ready: boolean;
}

export interface OverviewResponse {
  role: UserRole;
  displayName: string;
  topics: TopicSummary[];
}

export interface ProcessingStatus {
  state: ProcessingState;
  sourceEtag: string;
  updatedAt: string;
  error?: string;
}

export interface KnowledgeFile {
  name: string;
  path: string;
  relativePath: string;
  size: number;
  lastModified: string;
  etag: string;
  contentType?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  knowledgeRole: KnowledgeRole;
  reportDate?: string;
  reportDateSource?: ReportDateSource;
  incorporatedAt?: string;
  incorporatedBy?: string;
  processing?: ProcessingStatus;
}

export interface KnowledgeFolder {
  name: string;
  path: string;
}

export interface FileListResponse {
  prefix: string;
  folders: KnowledgeFolder[];
  files: KnowledgeFile[];
  nextCursor: string | null;
}
