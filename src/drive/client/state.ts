import type { FileListProgressStage, FileListResponse, KnowledgeRole, TopicSummary, UploadConflict, UserRole } from "../shared/contracts";
import type { UploadBatchState } from "./file-progress";
import { createFilePagination, type FilePaginationState } from "./file-pagination";

export type Mode = "login" | "overview" | "topic";
export type TopicView = "qa" | "files";
export type ThemeName = "light" | "dark";
export type EntryState =
  | "checking-session"
  | "signed-out"
  | "authenticating"
  | "preparing-workspace"
  | "auth-error"
  | "ready";

export interface DeleteConfirmation {
  kind: "topic" | "file";
  topicId: string;
  path?: string;
  knowledgeRole?: KnowledgeRole;
  targetName: string;
  input: string;
  pending: boolean;
  error: string;
}

export interface FileListLoadState {
  requestId: number;
  active: boolean;
  mode: "initial" | "navigation" | "refresh" | "background";
  stage: FileListProgressStage;
  completedStages: FileListProgressStage[];
  completed: number;
  total: number;
  startedAt: number;
  elapsedMs: number;
  slow: boolean;
  error: string;
}

export interface FolderManagementState {
  path: string;
  name: string;
  phase: "loading" | "ready" | "updating" | "error";
  scannedCount: number;
  referenceCount: number;
  incorporatedCount: number;
  changedCount: number;
  skippedCount: number;
  failedCount: number;
  error: string;
}

export interface UploadConflictConfirmation {
  conflicts: UploadConflict[];
}

declare global {
  interface Window {
    jhssTheme: {
      getPreference(): ThemeName | null;
      getResolvedTheme(): ThemeName;
      setTheme(theme: ThemeName): void;
      subscribe(listener: (theme: ThemeName) => void): () => void;
      toggleTheme(): void;
    };
  }
}

export interface DriveClientState {
  entryState: EntryState;
  entrySlow: boolean;
  entryError: string;
  mode: Mode;
  role: UserRole;
  displayName: string;
  topics: TopicSummary[];
  topic: TopicSummary | null;
  topicView: TopicView;
  fileRoleView: KnowledgeRole;
  fileRolePrefixes: Record<KnowledgeRole, string>;
  fileRoleListings: Record<KnowledgeRole, FileListResponse | null>;
  filePagination: FilePaginationState;
  prefix: string;
  listing: FileListResponse | null;
  loading: boolean;
  status: string;
  statusTone: "neutral" | "success" | "danger";
  loginName: string;
  accessCode: string;
  topicName: string;
  theme: ThemeName;
  deleteConfirmation: DeleteConfirmation | null;
  createTopicOpen: boolean;
  fileLoad: FileListLoadState | null;
  uploadBatch: UploadBatchState | null;
  expandedFilePath: string | null;
  folderManagement: FolderManagementState | null;
  uploadConflictConfirmation: UploadConflictConfirmation | null;
}

export const state: DriveClientState = {
  entryState: "checking-session",
  entrySlow: false,
  entryError: "",
  mode: "login",
  role: "viewer",
  displayName: "",
  topics: [],
  topic: null,
  topicView: "qa",
  fileRoleView: "evidence",
  fileRolePrefixes: { reference: "", methodology: "", evidence: "" },
  fileRoleListings: { reference: null, methodology: null, evidence: null },
  filePagination: createFilePagination(),
  prefix: "",
  listing: null,
  loading: true,
  status: "",
  statusTone: "neutral",
  loginName: "",
  accessCode: "",
  topicName: "",
  theme: window.jhssTheme.getResolvedTheme(),
  deleteConfirmation: null,
  createTopicOpen: false,
  fileLoad: null,
  uploadBatch: null,
  expandedFilePath: null,
  folderManagement: null,
  uploadConflictConfirmation: null,
};
