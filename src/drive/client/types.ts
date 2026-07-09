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
  version: 1;
  name: string;
  prefix: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface TopicDetail {
  topic: TopicMetadata;
  generatePrompt: string;
  outputs: DriveFile[];
}

export interface DriveOverviewOutput {
  name: string;
  path: string;
  uploadedAt?: string;
  lastModified: string;
  contentType?: string;
  size: number;
}

export interface DriveOverviewTopic {
  prefix: string;
  name: string;
  description: string;
  createdBy: string;
  updatedAt: string;
  outputCount: number;
  latestOutput?: DriveOverviewOutput;
}

export interface DriveOverview {
  topics: DriveOverviewTopic[];
}

export interface UploadCompleteResponse {
  ok: true;
  file: DriveFile;
}

export type ViewMode = "login" | "overview" | "topic" | "create";
export type TopicTab = "outputs" | "materials" | "agent" | "settings";
export type PreviewKind = "html" | "pdf" | "markdown" | "text" | "none";
