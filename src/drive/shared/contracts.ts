export type UserRole = "admin" | "viewer";
export type ProcessingState = "queued" | "processing" | "indexing" | "ready" | "failed";
export type KnowledgeRole = "reference" | "methodology" | "evidence";
export type ReportDateSource = "filename" | "content" | "upload" | "manual";

export interface TopicSummary {
  version: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  indexVersion: number;
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
