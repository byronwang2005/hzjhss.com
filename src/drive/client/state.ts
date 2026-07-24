import type { FileListResponse, KnowledgeRole, TopicSummary, UserRole } from "../shared/contracts";

export type Mode = "login" | "overview" | "topic" | "create";
export type TopicView = "qa" | "files";
export type UploadPhase = "preparing" | "uploading" | "registering";
export type ThemeName = "light" | "dark";

export interface DeleteConfirmation {
  kind: "topic" | "file";
  topicId: string;
  path?: string;
  targetName: string;
  input: string;
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
  upload: {
    active: boolean;
    phase: UploadPhase;
    name: string;
    percent: number;
    overallPercent: number;
    total: number;
  };
}

export const state: DriveClientState = {
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
  upload: { active: false, phase: "preparing", name: "", percent: 0, overallPercent: 0, total: 0 },
};
