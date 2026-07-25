import type { FileListProgressStage, FileListResponse, KnowledgeRole, TopicSummary, UserRole } from "../shared/contracts";
import type { UploadBatchState } from "./file-progress";

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

export interface EditReportDateState {
  path: string;
  fileName: string;
  value: string;
  pending: boolean;
  error: string;
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
  editReportDate: EditReportDateState | null;
  fileLoad: FileListLoadState | null;
  uploadBatch: UploadBatchState | null;
  expandedFilePath: string | null;
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
  editReportDate: null,
  fileLoad: null,
  uploadBatch: null,
  expandedFilePath: null,
};
