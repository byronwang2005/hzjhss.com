export interface DriveFile {
  name: string;
  path: string;
  size: number;
  lastModified: string;
  etag?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  contentType?: string;
  kind?: string;
}

export interface DriveFolder {
  name: string;
  path: string;
}

export interface DriveListResult {
  prefix: string;
  folders: DriveFolder[];
  files: DriveFile[];
  nextCursor: string | null;
}

export interface TopicMetadata {
  version: 5;
  instanceId: string;
  name: string;
  prefix: string;
  analysisKeywords: string;
  owner: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  featuredOutputPath: string | null;
  contextOutputPath: string | null;
}

export interface TopicDetail {
  topic: TopicMetadata;
  outputs: DriveFile[];
  canEditAnalysisScope: boolean;
  canDeleteTopic: boolean;
  canManageFeaturedOutput: boolean;
  canTransferTopicOwner: boolean;
  canGenerateContext: boolean;
  hasCurrentContext: boolean;
}

export interface DriveOverviewOutput {
  name: string;
  path: string;
  uploadedAt?: string;
  lastModified: string;
  contentType?: string;
  size: number;
  uploadedBy?: string;
}

export interface DriveOverviewTopic {
  prefix: string;
  name: string;
  analysisKeywords: string;
  owner: string;
  createdBy: string;
  updatedAt: string;
  outputCount: number;
  hasCurrentContext: boolean;
  featuredOutput?: DriveOverviewOutput;
}

export interface DriveOverview {
  topics: DriveOverviewTopic[];
}

export interface UploadCompleteResponse {
  ok: true;
  file: DriveFile;
}

export interface OwnerCandidatesResponse {
  candidates: string[];
  canManage: boolean;
}

export type ViewMode = "login" | "overview" | "topic" | "create";
export type TopicTab = "qa" | "outputs" | "materials" | "agent" | "settings";
export type PreviewKind = "html" | "pdf" | "markdown" | "text" | "none";
