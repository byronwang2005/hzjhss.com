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
