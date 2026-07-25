import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
import "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js";
import "./drive.css";

import Uppy from "@uppy/core";
import type { UppyFile } from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import { html, nothing, render, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { renderIcon } from "./icons";
import { transitionEntryState } from "./entry-flow";
import "./qa-chat";
import type {
  FileListErrorEvent,
  FileListPhaseEvent,
  FileListProgressStage,
  FileListResponse,
  FolderIncorporationResult,
  KnowledgeFile,
  KnowledgeFolder,
  KnowledgeRole,
  OverviewResponse,
  UploadCompleteResponse,
} from "../shared/contracts";
import { CLIENT_TIMING } from "../shared/runtime";
import { directoryPrefix, FILE_ROLE_PRESENTATION, fileIconName, fileNameFromPath, filesForKnowledgeRole, formatBytes, formatDate, methodologyDisplayName, normalizeClientRelativePath, processingDisplay, visibleFileRole, visibleFileRoles } from "./utils";
import { api, apiStream, ApiError, consumeSse } from "./api";
import { state, type TopicView } from "./state";
import { createTransientStatusController } from "./transient-status";
import { pdfPageCount, validateFileSizeAndType } from "./upload-policy";
import { runWorkspaceTransition } from "./workspace-transition";
import {
  advanceFileTask,
  batchCounts,
  createUploadBatch,
  elapsedLabel,
  fileTaskPercent,
  fileTaskStageLabel,
  reconcileUploadBatch,
  stepState,
  taskSteps,
  type FileTaskItem,
  type FileTaskStage,
  type UploadBatchState,
} from "./file-progress";

type UppyMeta = { relativePath?: string; pdfPages?: number; knowledgeRole?: KnowledgeRole };
type UppyBody = Record<string, unknown>;
type DriveUppyFile = UppyFile<UppyMeta, UppyBody>;

interface UploadSignature {
  url: string;
  uploadId: string;
  path: string;
  contentType: string;
  knowledgeRole: KnowledgeRole;
  requiredHeaders: Record<string, string>;
}

const rootElement = document.querySelector<HTMLElement>("[data-drive-root]");
if (!rootElement) throw new Error("Missing [data-drive-root] mount element");
const root = rootElement;

const statusController = createTransientStatusController<"neutral" | "success" | "danger">(
  CLIENT_TIMING.statusVisibleMs,
  "neutral",
  ({ message, tone }) => {
    state.status = message;
    state.statusTone = tone;
    renderApp();
  },
);

let fileRefreshTimer: number | undefined;
let fileProgressClockTimer: number | undefined;
let fileLoadClockTimer: number | undefined;
let fileLoadAbortController: AbortController | null = null;
let fileLoadRequestId = 0;
let uploadOperationActive = false;
let observedScopeList: HTMLElement | null = null;
const scopeListResizeObserver = typeof ResizeObserver === "function"
  ? new ResizeObserver(() => syncScopeIndicator(false))
  : null;

root.addEventListener("click", (event) => void handleClick(event));
root.addEventListener("submit", (event) => void handleSubmit(event));
root.addEventListener("input", handleInput);
root.addEventListener("change", (event) => void handleChange(event));
root.addEventListener("keydown", handleTabKeydown);
window.addEventListener("resize", () => syncScopeIndicator(false), { passive: true });
window.jhssTheme.subscribe((theme) => {
  if (state.theme !== theme) {
    state.theme = theme;
    renderApp();
  }
});

void boot();

async function boot(): Promise<void> {
  state.entryState = "checking-session";
  state.entrySlow = false;
  state.entryError = "";
  renderApp();
  try {
    const overview = await requestEntryOverview();
    applyOverview(overview);
    state.entryState = transitionEntryState(state.entryState, "session-valid");
    renderApp();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await new Promise((resolve) => window.setTimeout(resolve, CLIENT_TIMING.initialUnauthorizedRetryMs));
      try {
        const overview = await requestEntryOverview();
        applyOverview(overview);
        state.entryState = transitionEntryState(state.entryState, "session-valid");
        renderApp();
        return;
      } catch (retryError) {
        if (!(retryError instanceof ApiError && retryError.status === 401)) {
          showEntryError(retryError);
          return;
        }
        state.entryState = transitionEntryState(state.entryState, "session-unauthorized");
        state.mode = "login";
        state.loading = false;
        state.entryError = "";
        renderApp();
        return;
      }
    }
    showEntryError(error);
  }
}

async function loadOverview(): Promise<void> {
  state.loading = true;
  renderApp();
  const overview = await api<OverviewResponse>("/overview");
  applyOverview(overview);
  renderApp();
}

function applyOverview(overview: OverviewResponse): void {
  cancelFileLoad();
  state.role = overview.role;
  state.displayName = overview.displayName;
  state.topics = overview.topics;
  state.mode = "overview";
  state.loading = false;
}

async function requestEntryOverview(): Promise<OverviewResponse> {
  return runEntryRequest(
    (signal) => api<OverviewResponse>("/overview", { signal }),
    "连接知识库超时，请检查网络后重试。",
  );
}

async function loadEntryOverview(): Promise<void> {
  state.entrySlow = false;
  state.entryError = "";
  renderApp();
  try {
    const overview = await requestEntryOverview();
    applyOverview(overview);
    state.entryState = transitionEntryState(state.entryState, "workspace-ready");
    renderApp();
  } catch (error) {
    showEntryError(error);
  }
}

async function runEntryRequest<T>(
  request: (signal: AbortSignal) => Promise<T>,
  timeoutMessage: string,
): Promise<T> {
  const controller = new AbortController();
  let settled = false;
  const slowTimer = window.setTimeout(() => {
    if (settled) return;
    state.entrySlow = true;
    renderApp();
  }, CLIENT_TIMING.entrySlowMs);
  const timeoutTimer = window.setTimeout(() => controller.abort(), CLIENT_TIMING.entryTimeoutMs);
  try {
    return await request(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw new Error(timeoutMessage);
    throw error;
  } finally {
    settled = true;
    window.clearTimeout(slowTimer);
    window.clearTimeout(timeoutTimer);
  }
}

async function openTopic(topicId: string, view: TopicView = "qa"): Promise<void> {
  const topic = state.topics.find((entry) => entry.id === topicId);
  if (!topic) return;
  cancelFileLoad();
  await runWorkspaceTransition("scope-forward", () => {
    state.topic = topic;
    state.topicView = view;
    state.fileRoleView = "evidence";
    state.prefix = "";
    state.listing = null;
    state.fileLoad = null;
    state.mode = "topic";
    renderApp();
  });
  syncFileProgressClock();
  if (state.topicView === "files") await loadFiles();
}

async function loadFiles(background = false): Promise<void> {
  if (!state.topic) return;
  if (fileRefreshTimer !== undefined) {
    window.clearTimeout(fileRefreshTimer);
    fileRefreshTimer = undefined;
  }
  fileLoadAbortController?.abort();
  const controller = new AbortController();
  fileLoadAbortController = controller;
  const requestId = ++fileLoadRequestId;
  const topicId = state.topic.id;
  const prefix = state.prefix;
  state.fileLoad = {
    requestId,
    active: true,
    mode: background ? "background" : state.listing ? "refresh" : "initial",
    stage: "topic",
    completedStages: [],
    completed: 0,
    total: 0,
    startedAt: Date.now(),
    elapsedMs: 0,
    slow: false,
    error: "",
  };
  renderApp();
  syncFileLoadClock();
  let listing: FileListResponse | null = null;
  let streamError: FileListErrorEvent | null = null;
  try {
    const path = `/list?topicId=${encodeURIComponent(topicId)}&prefix=${encodeURIComponent(prefix)}`;
    const stream = await apiStream(path, { signal: controller.signal });
    await consumeSse(stream, (event, data) => {
      if (!fileLoadIsCurrent(requestId, topicId, prefix)) return;
      if (event === "phase") {
        const phase = parseFileListPhase(data);
        if (phase) applyFileListPhase(phase);
      } else if (event === "result" && isFileListResponse(data)) {
        listing = data;
      } else if (event === "error") {
        streamError = parseFileListError(data);
      }
    });
    if (streamError) throw new Error((streamError as FileListErrorEvent).message);
    if (!listing) throw new Error("COS 文件列表未返回结果，请重新加载。");
    const resolvedListing = listing as FileListResponse;
    const batchSnapshot = state.uploadBatch?.topicId === topicId ? state.uploadBatch : null;
    const batchListing = batchSnapshot?.items.some((item) => item.state === "active" && ["registering", "queued", "processing", "indexing"].includes(item.stage))
      ? await loadBatchStatusListing(topicId, batchSnapshot, batchSnapshot.prefix === prefix ? resolvedListing : null, controller.signal)
      : resolvedListing;
    if (!fileLoadIsCurrent(requestId, topicId, prefix)) return;
    state.listing = resolvedListing;
    if (state.uploadBatch === batchSnapshot) reconcileUploadBatch(batchSnapshot, topicId, batchListing);
    if (state.fileLoad?.requestId === requestId) {
      state.fileLoad.active = false;
      state.fileLoad.elapsedMs = Date.now() - state.fileLoad.startedAt;
      state.fileLoad.completedStages = ["topic", "objects", "metadata", "assembling"];
    }
    renderApp();
    syncFileProgressClock();
    const batchHasServerWork = state.uploadBatch?.topicId === topicId
      && state.uploadBatch.items.some((item) => item.state === "active" && ["registering", "queued", "processing", "indexing"].includes(item.stage));
    if (resolvedListing.files.some((file) => processingDisplay(file).poll) || batchHasServerWork) {
      fileRefreshTimer = window.setTimeout(() => {
        fileRefreshTimer = undefined;
        if (state.mode === "topic" && state.topicView === "files") void loadFiles(true);
      }, batchHasServerWork ? CLIENT_TIMING.activeFileRefreshMs : CLIENT_TIMING.fileRefreshMs);
    }
  } catch (error) {
    if (controller.signal.aborted || !fileLoadIsCurrent(requestId, topicId, prefix)) return;
    if (state.fileLoad?.requestId === requestId) {
      state.fileLoad.active = false;
      state.fileLoad.elapsedMs = Date.now() - state.fileLoad.startedAt;
      state.fileLoad.error = error instanceof Error ? error.message : "COS 文件列表加载失败，请重试。";
    }
    renderApp();
  } finally {
    if (fileLoadAbortController === controller) fileLoadAbortController = null;
    syncFileLoadClock();
  }
}

function fileLoadIsCurrent(requestId: number, topicId: string, prefix: string): boolean {
  return state.fileLoad?.requestId === requestId
    && state.topic?.id === topicId
    && state.prefix === prefix
    && state.topicView === "files";
}

function applyFileListPhase(phase: FileListPhaseEvent): void {
  const load = state.fileLoad;
  if (!load) return;
  load.stage = phase.stage;
  load.elapsedMs = phase.elapsedMs;
  load.completed = phase.completed || 0;
  load.total = phase.total || 0;
  if (phase.state === "complete" && !load.completedStages.includes(phase.stage)) {
    load.completedStages = [...load.completedStages, phase.stage];
  }
  load.slow = load.elapsedMs >= 8_000;
  renderApp();
}

function syncFileLoadClock(): void {
  if (fileLoadClockTimer !== undefined) {
    window.clearTimeout(fileLoadClockTimer);
    fileLoadClockTimer = undefined;
  }
  const load = state.fileLoad;
  if (!load?.active) return;
  fileLoadClockTimer = window.setTimeout(() => {
    fileLoadClockTimer = undefined;
    if (!state.fileLoad?.active || state.fileLoad.requestId !== load.requestId) return;
    state.fileLoad.elapsedMs = Date.now() - state.fileLoad.startedAt;
    state.fileLoad.slow = state.fileLoad.elapsedMs >= 8_000;
    renderApp();
    syncFileLoadClock();
  }, 1_000);
}

async function loadBatchStatusListing(
  topicId: string,
  batch: UploadBatchState,
  firstPage: FileListResponse | null,
  signal?: AbortSignal,
): Promise<FileListResponse> {
  const files = [...(firstPage?.files || [])];
  let cursor = firstPage?.nextCursor;
  if (!firstPage) {
    const page = await api<FileListResponse>(`/list?topicId=${encodeURIComponent(topicId)}&prefix=${encodeURIComponent(batch.prefix)}`, { signal });
    files.push(...page.files);
    cursor = page.nextCursor;
  }
  const wantedPaths = new Set(batch.items.filter((item) => item.state === "active").map((item) => item.relativePath));
  const foundPaths = new Set(files.map((file) => file.path));
  while (cursor && [...wantedPaths].some((path) => !foundPaths.has(path))) {
    const page = await api<FileListResponse>(
      `/list?topicId=${encodeURIComponent(topicId)}&prefix=${encodeURIComponent(batch.prefix)}&cursor=${encodeURIComponent(cursor)}`,
      { signal },
    );
    files.push(...page.files);
    page.files.forEach((file) => foundPaths.add(file.path));
    cursor = page.nextCursor;
  }
  return {
    prefix: batch.prefix,
    folders: [],
    files,
    nextCursor: cursor || null,
  };
}

function syncFileProgressClock(): void {
  if (fileProgressClockTimer !== undefined) {
    window.clearTimeout(fileProgressClockTimer);
    fileProgressClockTimer = undefined;
  }
  const batch = state.uploadBatch;
  if (!batch || batch.completedAt || !uploadBatchIsVisible(batch)) return;
  fileProgressClockTimer = window.setTimeout(() => {
    fileProgressClockTimer = undefined;
    if (state.uploadBatch !== batch || batch.completedAt) return;
    renderApp();
    syncFileProgressClock();
  }, 1_000);
}

function uploadBatchIsVisible(batch: UploadBatchState): boolean {
  return state.mode === "topic"
    && state.topicView === "files"
    && state.topic?.id === batch.topicId
    && state.uploadBatch === batch;
}

function renderUploadBatch(batch: UploadBatchState): void {
  if (uploadBatchIsVisible(batch)) renderApp();
}

function setUploadBatchStatus(batch: UploadBatchState, message: string, tone: "neutral" | "success" | "danger"): void {
  if (state.topic?.id === batch.topicId) setStatus(message, tone);
}

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.name === "displayName") state.loginName = target.value;
  if (target.name === "accessCode") state.accessCode = target.value;
  if (target.name === "topicName") state.topicName = target.value;
  if (target.name === "reportDate" && state.editReportDate) {
    state.editReportDate.value = target.value;
    state.editReportDate.error = "";
  }
  if (target.name === "deleteConfirmation" && state.deleteConfirmation) {
    state.deleteConfirmation.input = target.value;
    state.deleteConfirmation.error = "";
    const submit = root.querySelector<HTMLButtonElement>("[data-delete-confirm-submit]");
    if (submit) submit.disabled = state.deleteConfirmation.pending || target.value !== state.deleteConfirmation.targetName;
    const error = root.querySelector<HTMLElement>("[data-delete-confirm-error]");
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
  }
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  if (form.matches("[data-delete-confirm-form]")) {
    await submitDeleteConfirmation();
    return;
  }
  if (form.matches("[data-login-form]")) {
    if (state.entryState === "authenticating") return;
    state.entryState = transitionEntryState(state.entryState, "submit-login");
    state.entryError = "";
    state.entrySlow = false;
    state.loading = true;
    renderApp();
    try {
      await runEntryRequest(
        (signal) => api("/login", {
          method: "POST",
          body: { displayName: state.loginName, accessCode: state.accessCode },
          signal,
        }),
        "登录验证超时，请检查网络后重试。",
      );
      state.accessCode = "";
      state.loading = false;
      state.entryState = transitionEntryState(state.entryState, "login-succeeded");
      await loadEntryOverview();
    } catch (error) {
      state.entryState = transitionEntryState(state.entryState, "login-failed");
      state.loading = false;
      state.entrySlow = false;
      state.entryError = error instanceof Error ? error.message : "登录失败，请重试。";
      state.accessCode = "";
      renderApp();
      window.requestAnimationFrame(() => root.querySelector<HTMLInputElement>('input[name="accessCode"]')?.focus());
    }
  }
  if (form.matches("[data-topic-form]")) {
    try {
      const result = await api<{ topic: Omit<OverviewResponse["topics"][number], "ready"> }>("/topic", {
        method: "POST",
        body: { name: state.topicName },
      });
      const topic = { ...result.topic, ready: false };
      state.topics = [topic, ...state.topics];
      state.topicName = "";
      state.createTopicOpen = false;
      await openTopic(topic.id, "files");
    } catch (error) { showError(error); }
    return;
  }
  if (form.matches("[data-report-date-form]")) {
    await submitReportDate();
  }
}

async function handleClick(event: MouseEvent): Promise<void> {
  const button = (event.target as Element).closest<HTMLElement>("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "toggle-theme") {
    window.jhssTheme.toggleTheme();
  } else if (action === "retry-entry") {
    if (state.entryState === "checking-session") await boot();
    if (state.entryState === "preparing-workspace") await loadEntryOverview();
  } else if (action === "logout") {
    cancelFileLoad();
    await api("/logout", { method: "POST" });
    location.reload();
  } else if (action === "create-topic") {
    state.createTopicOpen = true;
    state.topicName = "";
    renderApp();
  } else if (action === "cancel-create-topic") {
    state.createTopicOpen = false;
    state.topicName = "";
    renderApp();
  } else if (action === "back") {
    cancelFileLoad();
    await runWorkspaceTransition("scope-back", () => {
      state.mode = "overview";
      state.topic = null;
      state.fileLoad = null;
      renderApp();
    });
    syncFileProgressClock();
  } else if (action === "open-topic") {
    await openTopic(String(button.dataset.topicId));
  } else if (action === "topic-view") {
    const nextView = button.dataset.view === "files" ? "files" : "qa";
    if (state.topicView === nextView) return;
    if (state.topicView === "files" && nextView !== "files") cancelFileLoad();
    await runWorkspaceTransition("topic-panel", () => {
      state.topicView = nextView;
      renderApp();
    });
    syncFileProgressClock();
    if (state.topicView === "files") await loadFiles();
  } else if (action === "file-role-view") {
    const nextRole = normalizeKnowledgeRole(button.dataset.role);
    if (state.fileRoleView === nextRole) return;
    await runWorkspaceTransition("file-role", () => {
      state.fileRoleView = nextRole;
      state.expandedFilePath = null;
      renderApp();
    });
  } else if (action === "toggle-file-batch") {
    if (state.uploadBatch) {
      state.uploadBatch.expanded = !state.uploadBatch.expanded;
      renderApp();
    }
  } else if (action === "toggle-file-progress") {
    const path = String(button.dataset.path || "");
    state.expandedFilePath = state.expandedFilePath === path ? null : path;
    renderApp();
  } else if (action === "open-folder") {
    state.prefix = String(button.dataset.path || "");
    state.listing = null;
    state.fileLoad = null;
    await loadFiles();
  } else if (action === "up-folder") {
    state.prefix = directoryPrefix(state.prefix.replace(/\/$/, ""));
    state.listing = null;
    state.fileLoad = null;
    await loadFiles();
  } else if (action === "refresh-files" || action === "retry-file-list") {
    await loadFiles();
  } else if (action === "pick-reference") {
    root.querySelector<HTMLInputElement>("[data-reference-input]")?.click();
  } else if (action === "pick-reference-folder") {
    root.querySelector<HTMLInputElement>("[data-reference-folder-input]")?.click();
  } else if (action === "pick-evidence") {
    root.querySelector<HTMLInputElement>("[data-evidence-input]")?.click();
  } else if (action === "pick-methodology") {
    root.querySelector<HTMLInputElement>("[data-methodology-input]")?.click();
  } else if (action === "download-file") {
    const result = await api<{ url: string }>("/download-url", { method: "POST", body: { topicId: state.topic?.id, path: button.dataset.path } });
    window.open(result.url, "_blank", "noopener,noreferrer");
  } else if (action === "delete-file") {
    const path = String(button.dataset.path || "");
    if (!state.topic || !path) return;
    state.deleteConfirmation = {
      kind: "file",
      topicId: state.topic.id,
      path,
      targetName: fileNameFromPath(path),
      input: "",
      pending: false,
      error: "",
    };
    renderApp();
  } else if (action === "cancel-delete") {
    closeDeleteConfirmation();
  } else if (action === "retry-file") {
    const path = String(button.dataset.path || "");
    await api("/process-retry", { method: "POST", body: { topicId: state.topic?.id, path } });
    if (state.uploadBatch && state.topic?.id === state.uploadBatch.topicId) {
      advanceFileTask(state.uploadBatch, path, "queued");
    }
    setStatus("已重新提交处理任务。", "success");
    await loadFiles();
  } else if (action === "toggle-incorporated") {
    await api("/object", {
      method: "PATCH",
      body: {
        topicId: state.topic?.id,
        path: button.dataset.path,
        incorporated: button.dataset.incorporated !== "true",
      },
    });
    setStatus(button.dataset.incorporated === "true" ? "已取消纳入标记。" : "已标记为已纳入方法论。", "success");
    await loadFiles();
  } else if (action === "toggle-folder-incorporated") {
    await toggleFolderIncorporated(
      String(button.dataset.path || ""),
      button.dataset.incorporated !== "true",
    );
  } else if (action === "edit-report-date") {
    state.editReportDate = {
      path: String(button.dataset.path || ""),
      fileName: String(button.dataset.name || fileNameFromPath(String(button.dataset.path || ""))),
      value: String(button.dataset.reportDate || ""),
      pending: false,
      error: "",
    };
    renderApp();
  } else if (action === "cancel-report-date") {
    if (!state.editReportDate?.pending) {
      state.editReportDate = null;
      renderApp();
    }
  } else if (action === "delete-topic" && state.topic) {
    state.deleteConfirmation = {
      kind: "topic",
      topicId: state.topic.id,
      targetName: state.topic.name,
      input: "",
      pending: false,
      error: "",
    };
    renderApp();
  }
}

async function toggleFolderIncorporated(path: string, incorporated: boolean): Promise<void> {
  if (!state.topic || !path || state.pendingFolderIncorporationPath) return;
  state.pendingFolderIncorporationPath = path;
  renderApp();
  try {
    const result = await api<FolderIncorporationResult>("/folder", {
      method: "PATCH",
      body: { topicId: state.topic.id, prefix: path, incorporated },
    });
    if (!result.matchedCount) {
      setStatus("该文件夹内没有研报原件。", "neutral");
    } else if (result.failedCount) {
      setStatus(`已更新 ${result.changedCount} 份研报，${result.failedCount} 份更新失败。`, "danger");
    } else if (!result.changedCount) {
      setStatus(incorporated ? "该文件夹内的研报已全部纳入方法论。" : "该文件夹内的研报已全部取消纳入。", "success");
    } else {
      setStatus(incorporated ? `已将 ${result.changedCount} 份研报纳入方法论。` : `已取消 ${result.changedCount} 份研报的纳入标记。`, "success");
    }
  } catch (error) {
    showError(error);
  } finally {
    state.pendingFolderIncorporationPath = null;
    await loadFiles();
  }
}

async function submitDeleteConfirmation(): Promise<void> {
  const confirmation = state.deleteConfirmation;
  if (!confirmation || confirmation.pending || confirmation.input !== confirmation.targetName) return;
  confirmation.pending = true;
  confirmation.error = "";
  renderApp();
  try {
    if (confirmation.kind === "topic") {
      await api("/topic", {
        method: "DELETE",
        body: { topicId: confirmation.topicId, confirmName: confirmation.input },
      });
      state.deleteConfirmation = null;
      state.topic = null;
      await loadOverview();
    } else {
      await api("/object", {
        method: "DELETE",
        body: {
          topicId: confirmation.topicId,
          path: confirmation.path,
          confirmName: confirmation.input,
        },
      });
      state.deleteConfirmation = null;
      await loadFiles();
    }
  } catch (error) {
    if (state.deleteConfirmation !== confirmation) return;
    confirmation.pending = false;
    confirmation.error = error instanceof Error ? error.message : "删除失败，请稍后重试";
    renderApp();
  }
}

async function submitReportDate(): Promise<void> {
  const edit = state.editReportDate;
  if (!edit || edit.pending) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edit.value.trim())) {
    edit.error = "请选择有效的资料日期。";
    renderApp();
    return;
  }
  edit.pending = true;
  edit.error = "";
  renderApp();
  try {
    await api("/object", {
      method: "PATCH",
      body: { topicId: state.topic?.id, path: edit.path, reportDate: edit.value.trim() },
    });
    if (state.editReportDate !== edit) return;
    state.editReportDate = null;
    setStatus("资料日期已更新，索引正在重建。", "success");
    await loadFiles();
  } catch (error) {
    if (state.editReportDate !== edit) return;
    edit.pending = false;
    edit.error = error instanceof Error ? error.message : "资料日期更新失败，请重试。";
    renderApp();
  }
}

function cancelFileLoad(): void {
  fileLoadAbortController?.abort();
  fileLoadAbortController = null;
  if (fileLoadClockTimer !== undefined) {
    window.clearTimeout(fileLoadClockTimer);
    fileLoadClockTimer = undefined;
  }
}

function closeDeleteConfirmation(): void {
  if (!state.deleteConfirmation || state.deleteConfirmation.pending) return;
  const dialog = root.querySelector<HTMLElement & { open: boolean }>("wa-dialog.drive-delete-dialog");
  if (dialog) dialog.open = false;
  else {
    state.deleteConfirmation = null;
    renderApp();
  }
}

function handleDeleteDialogHide(event: Event): void {
  if (state.deleteConfirmation?.pending) event.preventDefault();
}

function handleDeleteDialogAfterHide(): void {
  if (!state.deleteConfirmation?.pending) {
    state.deleteConfirmation = null;
    renderApp();
  }
}

function handleTabKeydown(event: KeyboardEvent): void {
  const current = (event.target as Element).closest<HTMLButtonElement>('[role="tab"][data-action]');
  if (!current || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tablist = current.closest<HTMLElement>('[role="tablist"]');
  if (!tablist) return;
  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>(':scope > [role="tab"]'));
  const currentIndex = tabs.indexOf(current);
  if (currentIndex < 0 || !tabs.length) return;
  const nextIndex = event.key === "Home"
    ? 0
    : event.key === "End"
      ? tabs.length - 1
      : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  tabs[nextIndex]?.focus();
  tabs[nextIndex]?.click();
}

function normalizeKnowledgeRole(value: unknown): KnowledgeRole {
  return value === "reference" || value === "methodology" ? value : "evidence";
}

async function handleChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  if (!input.matches("[data-reference-input], [data-reference-folder-input], [data-evidence-input], [data-methodology-input]")) return;
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length) return;
  const knowledgeRole: KnowledgeRole = input.matches("[data-methodology-input]")
    ? "methodology"
    : input.matches("[data-reference-input], [data-reference-folder-input]")
      ? "reference"
      : "evidence";
  const isReferenceFolder = input.matches("[data-reference-folder-input]");
  await uploadFiles(
    knowledgeRole === "methodology" ? files.slice(0, 1) : files,
    (file) => knowledgeRole === "methodology" && state.topic?.methodologyPath
      ? state.topic.methodologyPath
      : knowledgeRole === "methodology"
        ? "专题方法论.md"
        : isReferenceFolder
          ? file.webkitRelativePath || file.name
          : file.name,
    knowledgeRole,
  );
}

async function uploadFiles(files: File[], pathForFile: (file: File) => string, knowledgeRole: KnowledgeRole): Promise<void> {
  if (!state.topic || state.role !== "admin") return;
  if (uploadOperationActive) {
    setStatus("已有文件正在上传，请等待当前上传完成。", "neutral");
    return;
  }
  uploadOperationActive = true;
  const topicId = state.topic.id;
  const prefix = state.prefix;
  let uppy: Uppy<UppyMeta, UppyBody> | null = null;
  let batch: UploadBatchState | null = null;
  try {
    const candidates = files.map((file) => ({
      file,
      relativePath: normalizeClientRelativePath(
        knowledgeRole === "methodology" ? pathForFile(file) : `${prefix}${pathForFile(file)}`,
      ),
    }));
    if (new Set(candidates.map((entry) => entry.relativePath)).size !== candidates.length) {
      throw new Error("同一批次不能上传多个同名文件，请分开上传。");
    }
    batch = createUploadBatch(
      topicId,
      prefix,
      knowledgeRole,
      candidates.map(({ file, relativePath }) => ({ name: file.name, relativePath, size: file.size })),
    );
    state.uploadBatch = batch;
    state.expandedFilePath = null;
    renderUploadBatch(batch);
    syncFileProgressClock();

    const prepared = [] as Array<{ file: File; relativePath: string; knowledgeRole: KnowledgeRole; pdfPages?: number }>;
    for (const { file, relativePath } of candidates) {
      try {
        validateFileSizeAndType(file, relativePath);
        if (knowledgeRole === "methodology" && !relativePath.toLowerCase().endsWith(".md")) throw new Error("专题方法论只支持 Markdown 文件");
        prepared.push({
          file,
          relativePath,
          knowledgeRole,
          ...(knowledgeRole === "evidence" && relativePath.toLowerCase().endsWith(".pdf") ? { pdfPages: await pdfPageCount(file) } : {}),
        });
      } catch (error) {
        advanceFileTask(batch, relativePath, "failed", {
          error: error instanceof Error ? error.message : "文件校验未通过。",
          retryable: true,
        });
        renderUploadBatch(batch);
      }
    }
    if (!prepared.length) {
      setUploadBatchStatus(batch, "所选文件均未通过校验，请调整后重新上传。", "danger");
      return;
    }

    const signatures = new Map<string, UploadSignature>();
    const completed: Array<{ uploadId: string; relativePath: string; size: number; contentType: string; knowledgeRole: KnowledgeRole; pdfPages?: number }> = [];
    uppy = new Uppy<UppyMeta, UppyBody>({ autoProceed: false });
    uppy.use(XHRUpload, {
      endpoint: async (fileOrBundle: unknown) => {
        const file = (Array.isArray(fileOrBundle) ? fileOrBundle[0] : fileOrBundle) as DriveUppyFile;
        const data = file.data as Blob;
        const relativePath = String(file.meta.relativePath || file.name);
        advanceFileTask(batch!, relativePath, "authorizing");
        renderUploadBatch(batch!);
        const signature = await api<UploadSignature>("/upload-url", {
          method: "POST",
          body: {
            topicId,
            relativePath: file.meta.relativePath,
            size: data.size,
            contentType: file.type || "application/octet-stream",
            pdfPages: file.meta.pdfPages,
            knowledgeRole: file.meta.knowledgeRole,
          },
        });
        signatures.set(file.id, signature);
        return signature.url;
      },
      method: "PUT",
      formData: false,
      limit: 3,
      headers: (file: DriveUppyFile) => signatures.get(file.id)?.requiredHeaders || { "content-type": file.type || "application/octet-stream" },
      getResponseData: () => ({}),
    });
    uppy.on("upload-progress", (file, progress) => {
      if (!file || !progress.bytesTotal) return;
      advanceFileTask(batch!, String(file.meta.relativePath || file.name), "uploading", {
        bytesUploaded: progress.bytesUploaded,
        bytesTotal: progress.bytesTotal,
      });
      renderUploadBatch(batch!);
    });
    uppy.on("upload-success", (file) => {
      if (!file) return;
      const data = file.data as Blob;
      const signature = signatures.get(file.id);
      if (!signature) return;
      completed.push({
        uploadId: signature.uploadId,
        relativePath: signature.path,
        size: data.size,
        contentType: file.type || "application/octet-stream",
        knowledgeRole: signature.knowledgeRole,
        ...(file.meta.pdfPages ? { pdfPages: file.meta.pdfPages } : {}),
      });
      advanceFileTask(batch!, signature.path, "registering", {
        bytesUploaded: data.size,
        bytesTotal: data.size,
      });
      renderUploadBatch(batch!);
    });
    for (const entry of prepared) uppy.addFile({
      name: entry.file.name,
      type: entry.file.type || "application/octet-stream",
      data: entry.file,
      meta: { relativePath: entry.relativePath, pdfPages: entry.pdfPages, knowledgeRole: entry.knowledgeRole },
    });
    const result = await uppy.upload();
    for (const failed of result?.failed || []) {
      advanceFileTask(batch, String(failed.meta.relativePath || failed.name), "failed", {
        error: "上传未完成，请检查网络后重新上传。",
        retryable: true,
      });
    }
    if (!completed.length) {
      setUploadBatchStatus(batch, "文件上传未完成，请检查网络后重试。", "danger");
      return;
    }

    const registration = await api<UploadCompleteResponse>("/upload-complete", {
      method: "POST",
      body: { topicId, files: completed },
    });
    for (const file of registration.files) {
      advanceFileTask(
        batch,
        file.path,
        file.knowledgeRole === "reference" ? "archived" : "queued",
        { sourceEtag: file.etag },
      );
    }
    for (const failure of registration.failures) {
      advanceFileTask(batch, failure.relativePath, "failed", {
        error: failure.message,
        retryable: failure.retryable,
      });
    }
    const counts = batchCounts(batch);
    setUploadBatchStatus(
      batch,
      counts.failed
        ? `${counts.failed} 个文件未完成，其他文件将继续处理。`
        : knowledgeRole === "reference"
          ? `已归档 ${registration.files.length} 份研报原件。`
          : `已登记 ${registration.files.length} 份资料，后台正在继续处理。`,
      counts.failed ? "danger" : "success",
    );
    if (state.topic?.id === topicId && state.topicView === "files") await loadFiles();
  } catch (error) {
    if (batch) {
      for (const item of batch.items.filter((entry) => entry.state === "active")) {
        advanceFileTask(batch, item.relativePath, "failed", {
          error: error instanceof Error && error.message.includes("超时")
            ? "文件登记超时，请重新上传该文件。"
            : "上传流程未完成，请重试。",
          retryable: true,
        });
      }
      setUploadBatchStatus(batch, "部分文件未完成，请在处理中心查看并重试。", "danger");
    } else {
      showError(error);
    }
  } finally {
    uppy?.destroy();
    uploadOperationActive = false;
    syncFileProgressClock();
  }
}

function renderApp(): void {
  if (state.entryState === "checking-session") {
    render(renderSessionCheck(), root);
    removePreflightShell();
    syncScopeIndicator();
    return;
  }
  if (state.entryState === "preparing-workspace") {
    render(renderWorkspaceLoading(), root);
    removePreflightShell();
    syncScopeIndicator();
    return;
  }
  render(state.mode === "login" ? renderLogin() : renderShell(), root);
  removePreflightShell();
  syncScopeIndicator();
}

function removePreflightShell(): void {
  root.querySelector(".drive-preflight-shell")?.remove();
}

function syncScopeIndicator(animate = true): void {
  const list = root.querySelector<HTMLElement>(".drive-scope-list");
  const indicator = list?.querySelector<HTMLElement>(".drive-scope-track-indicator");
  const activeItem = list?.querySelector<HTMLElement>(".drive-scope-item.is-active");
  if (!list || !indicator || !activeItem) {
    scopeListResizeObserver?.disconnect();
    observedScopeList = null;
    return;
  }

  if (observedScopeList !== list) {
    scopeListResizeObserver?.disconnect();
    scopeListResizeObserver?.observe(list);
    observedScopeList = list;
  }

  const reducedMotion = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const positioned = indicator.dataset.positioned === "true";
  const instant = !positioned || !animate || reducedMotion;
  const listBounds = list.getBoundingClientRect();
  const activeBounds = activeItem.getBoundingClientRect();
  indicator.classList.toggle("is-instant", instant);
  indicator.style.setProperty("--drive-scope-indicator-x", `${activeBounds.left - listBounds.left + list.scrollLeft}px`);
  indicator.style.setProperty("--drive-scope-indicator-y", `${activeBounds.top - listBounds.top + list.scrollTop}px`);
  indicator.style.setProperty("--drive-scope-indicator-width", `${activeBounds.width}px`);
  indicator.style.setProperty("--drive-scope-indicator-height", `${activeBounds.height}px`);
  indicator.dataset.positioned = "true";

  if (instant && !reducedMotion) {
    void indicator.offsetWidth;
    indicator.classList.remove("is-instant");
  }
}

function renderLogin(): TemplateResult {
  const authenticating = state.entryState === "authenticating";
  const hasAuthError = state.entryState === "auth-error" && Boolean(state.entryError);
  return html`<section class="drive-login-panel">
    ${renderThemeToggle("drive-login-theme-toggle")}
    <div class="drive-login-story">
      <div class="drive-brand-lockup"><img src="/assets/jhss-logo-cropped.png" alt="嘉合杉升"><span>嘉合杉升</span></div>
      <div class="drive-login-copy">
        <h1>把知识，<br>变成答案。</h1>
      </div>
      <div class="drive-login-principles" aria-label="知识库能力">
        <span>${renderIcon("database")}跨专题检索</span>
        <span>${renderIcon("link")}来源可追溯</span>
        <span>${renderIcon("files")}资料统一管理</span>
      </div>
    </div>
    <form class="drive-form drive-login-card" data-login-form>
      <div class="drive-login-card-head"><span class="drive-eyebrow">内部访问</span><h2>欢迎回来</h2><p>使用您的姓名与访问码进入知识库。</p></div>
      <label class="drive-field"><span>登录姓名</span><input name="displayName" autocomplete="name" placeholder="请输入姓名" .value=${state.loginName} required></label>
      <label class=${`drive-field${hasAuthError ? " has-error" : ""}`}>
        <span>访问码</span>
        <input
          name="accessCode"
          type="password"
          autocomplete="current-password"
          placeholder="请输入访问码"
          .value=${state.accessCode}
          aria-invalid=${String(hasAuthError)}
          aria-describedby=${hasAuthError ? "drive-login-error" : nothing}
          required
        >
        ${hasAuthError ? html`<small id="drive-login-error" class="drive-field-error" role="alert">${renderIcon("warning")}<span>${state.entryError}</span></small>` : nothing}
      </label>
      <button class="drive-control drive-control-primary drive-login-submit" type="submit" ?disabled=${authenticating}>
        <span>${authenticating ? state.entrySlow ? "验证时间较长…" : "正在验证…" : "进入知识库"}</span>
        ${authenticating ? html`<span class="drive-spin">${renderIcon("spinner-gap")}</span>` : renderIcon("arrow-right", "bold")}
      </button>
      ${renderStatus()}
      <div class="drive-login-foot"><p class="drive-login-help">仅限授权成员访问</p><a class="drive-docs-link" href="/docs/">${renderIcon("book-open")}浏览 AI 手册</a></div>
    </form>
  </section>`;
}

function renderSessionCheck(): TemplateResult {
  const hasError = Boolean(state.entryError);
  return html`<section class=${`drive-entry-screen${hasError ? " has-error" : ""}`} data-entry-state="checking-session">
    ${renderEntryHeader()}
    <div class="drive-entry-layout">
      <div class="drive-entry-content" role="status" aria-live="polite">
        <span class="drive-eyebrow">${hasError ? "连接中断" : "安全访问检查"}</span>
        <h1>${hasError ? "暂时无法连接知识库" : "正在确认访问状态"}</h1>
        <p>${hasError ? state.entryError : "正在安全检查您的登录会话，请稍候。"}</p>
        ${hasError
          ? html`<button class="drive-control drive-control-primary drive-entry-retry" type="button" data-action="retry-entry">${renderIcon("arrow-clockwise")}重新连接</button>`
          : html`<div class="drive-entry-live"><span class="drive-spin">${renderIcon("spinner-gap")}</span><span>${state.entrySlow ? "连接时间较长，仍在继续尝试…" : "正在建立加密连接"}</span></div>`}
      </div>
      ${renderEntryNetwork()}
    </div>
    <footer class="drive-entry-footer">${renderIcon("check-circle")}<span>企业级加密连接 · 仅限授权成员访问</span></footer>
  </section>`;
}

function renderWorkspaceLoading(): TemplateResult {
  const hasError = Boolean(state.entryError);
  return html`<section class=${`drive-entry-screen${hasError ? " has-error" : ""}`} data-entry-state="preparing-workspace">
    ${renderEntryHeader()}
    <div class="drive-entry-layout">
      <div class="drive-entry-content" role="status" aria-live="polite">
        <span class="drive-eyebrow">${hasError ? "工作区同步中断" : "安全会话已建立"}</span>
        <h1>${hasError ? "工作区暂未准备完成" : "正在连接知识库"}</h1>
        <p>${hasError ? state.entryError : "正在恢复您的专题、资料索引与最近访问状态。"}</p>
        ${hasError ? html`
          <button class="drive-control drive-control-primary drive-entry-retry" type="button" data-action="retry-entry">${renderIcon("arrow-clockwise")}重新同步</button>
        ` : html`
          <ol class="drive-entry-steps" aria-label="工作区准备进度">
            <li class="is-complete"><span class="drive-entry-step-icon">${renderIcon("check", "bold")}</span><span><strong>验证身份</strong><small>身份验证成功</small></span></li>
            <li class="is-complete"><span class="drive-entry-step-icon">${renderIcon("check", "bold")}</span><span><strong>建立安全会话</strong><small>加密通道已建立</small></span></li>
            <li class="is-active"><span class="drive-entry-step-icon drive-spin">${renderIcon("circle-notch")}</span><span><strong>同步专题索引</strong><small>${state.entrySlow ? "同步时间较长，仍在继续…" : "正在准备知识内容"}</small></span></li>
          </ol>
        `}
      </div>
      ${renderEntryNetwork()}
    </div>
    <footer class="drive-entry-footer">${renderIcon("check-circle")}<span>安全连接已建立，无需重复登录</span></footer>
  </section>`;
}

function renderEntryHeader(): TemplateResult {
  return html`<header class="drive-entry-header">
    <div class="drive-brand-lockup"><img src="/assets/jhss-logo-cropped.png" alt="嘉合杉升"><span>嘉合杉升</span></div>
    ${renderThemeToggle()}
  </header>`;
}

function renderEntryNetwork(): TemplateResult {
  return html`<div class="drive-entry-network" aria-hidden="true">
    <img class="drive-entry-network-light" src="/assets/knowledge-network-light.png" alt="">
    <img class="drive-entry-network-dark" src="/assets/knowledge-network-dark.png" alt="">
    <img class="drive-entry-network-mark" src="/assets/jhss-logo-cropped.png" alt="">
  </div>`;
}

function renderShell(): TemplateResult {
  return html`<section class="drive-dashboard">
    <header class="drive-appbar">
      <button class="drive-brand-lockup drive-brand-button drive-title-button" type="button" data-action="back" aria-label="返回知识库首页">
        <img src="/assets/jhss-logo-cropped.png" alt=""><span><strong>嘉合杉升</strong><small>AI 知识库</small></span>
      </button>
      <div class="drive-appbar-meta">
        <a class="drive-appbar-docs" href="/docs/">${renderIcon("book-open")}AI 手册</a>
        ${renderThemeToggle()}
        <wa-dropdown class="drive-account-menu" placement="bottom-end">
          <button class="drive-account-trigger" type="button" slot="trigger">
            <span class="drive-account-avatar" aria-hidden="true">${state.displayName.trim().slice(0, 1) || "用"}</span>
            <span class="drive-account-copy"><strong>${state.displayName}</strong><small>${state.role === "admin" ? "管理员" : "成员"}</small></span>
            ${renderIcon("caret-down")}
          </button>
          <wa-dropdown-item disabled>${state.displayName}<span slot="details">${state.role === "admin" ? "管理员" : "成员"}</span></wa-dropdown-item>
          <wa-dropdown-item value="logout" variant="danger" data-action="logout">${renderIcon("sign-out")}退出知识库</wa-dropdown-item>
        </wa-dropdown>
      </div>
    </header>
    <div class="drive-workbench">
      ${renderScopeRail()}
      <main class=${`drive-dashboard-main is-${state.mode}`} data-mode=${state.mode}>
        ${state.mode === "topic" ? renderTopicHeader() : nothing}
        ${renderStatus()}
        ${state.loading ? renderLoading() : state.mode === "overview" ? renderOverview() : renderTopic()}
      </main>
    </div>
    ${renderDeleteConfirmation()}
    ${renderCreateTopicDialog()}
    ${renderReportDateDialog()}
  </section>`;
}

function renderScopeRail(): TemplateResult {
  return html`
    <aside class="drive-scope-rail" aria-label="资料范围">
      <div class="drive-scope-rail-head">
        <span class="drive-eyebrow">资料范围</span>
        ${state.role === "admin" ? html`
          <button class="drive-scope-create" data-action="create-topic" type="button" aria-label="新建专题" title="新建专题">
            ${renderIcon("folder-plus", "bold")}<span>新建专题</span>
          </button>
        ` : nothing}
      </div>
      <nav class="drive-scope-list" aria-label="知识库范围">
        <span class="drive-scope-track-indicator" aria-hidden="true"></span>
        <button class=${`drive-scope-item is-global${state.mode === "overview" ? " is-active" : ""}`} type="button" data-action="back" aria-current=${state.mode === "overview" ? "page" : nothing}>
          <span class="drive-scope-item-icon">${renderIcon("files", "duotone")}</span>
          <span><strong>全部资料</strong><small>${state.topics.filter((topic) => topic.ready).length} 个专题可问答</small></span>
        </button>
        <div class="drive-scope-section-label"><span>专题</span><small>${state.topics.length}</small></div>
        ${state.topics.length
          ? repeat(state.topics, (topic) => topic.id, (topic) => html`
              <button
                class=${`drive-scope-item${state.topic?.id === topic.id ? " is-active" : ""}`}
                type="button"
                data-action="open-topic"
                data-topic-id=${topic.id}
                aria-current=${state.topic?.id === topic.id ? "page" : nothing}
              >
                <span class="drive-scope-item-icon">${renderIcon("folder")}</span>
                <span><strong>${topic.name}</strong><small class=${topic.ready ? "is-ready" : ""}>${topic.ready ? "可问答" : "处理中"}</small></span>
              </button>
            `)
          : html`<div class="drive-scope-empty"><span>还没有专题</span><small>创建后即可上传资料</small></div>`}
      </nav>
    </aside>
  `;
}

function renderTopicHeader(): TemplateResult | typeof nothing {
  if (!state.topic) return nothing;
  return html`
    <header class="drive-topic-workspace-head">
      <div class="drive-topic-title">
        <span class="drive-topic-title-icon">${renderIcon("folder", "duotone")}</span>
        <span><strong>${state.topic.name}</strong><small class=${state.topic.ready ? "is-ready" : ""}>${state.topic.ready ? "可问答" : "资料处理中"}</small></span>
        ${state.role === "admin" ? html`
          <button class="drive-topic-delete" type="button" data-action="delete-topic">${renderIcon("trash")}删除专题</button>
        ` : nothing}
      </div>
      <div class="drive-tabs" role="tablist" aria-label="专题工作区">
        ${tabButton("qa", "问答", "chat-circle-dots")}
        ${tabButton("files", state.role === "admin" ? "文件" : "资料", "files")}
      </div>
    </header>
  `;
}

function renderDeleteConfirmation(): TemplateResult | typeof nothing {
  const confirmation = state.deleteConfirmation;
  if (!confirmation) return nothing;
  const isTopic = confirmation.kind === "topic";
  const matches = confirmation.input === confirmation.targetName;
  const inputDescriptionId = "delete-confirmation-description";
  return html`
    <wa-dialog
      class="drive-delete-dialog"
      label=${isTopic ? "删除专题" : "删除文件"}
      with-footer
      .open=${true}
      @wa-hide=${handleDeleteDialogHide}
      @wa-after-hide=${handleDeleteDialogAfterHide}
    >
      <form id="drive-delete-confirm-form" class="drive-delete-confirm-form" data-delete-confirm-form>
        <div class="drive-delete-warning">
          <span class="drive-delete-warning-icon" aria-hidden="true">${renderIcon("warning")}</span>
          <div>
            <strong>${isTopic ? "此操作会永久删除整个专题" : "此操作会永久删除该文件"}</strong>
            <p>${isTopic ? "专题内的全部资料和索引也会一并移除，删除后无法恢复。" : "相关处理结果和索引数据也会一并移除，删除后无法恢复。"}</p>
          </div>
        </div>
        <div class="drive-delete-target">
          <span>${isTopic ? "专题名称" : "文件名称"}</span>
          <strong>${confirmation.targetName}</strong>
          ${!isTopic && confirmation.path !== confirmation.targetName
            ? html`<small>完整路径：${confirmation.path}</small>`
            : nothing}
        </div>
        <label class="drive-field drive-delete-confirm-field">
          <span>请输入${isTopic ? "专题名称" : "文件名称"}以确认</span>
          <small id=${inputDescriptionId}>必须与上方名称完全一致，包括大小写和空格。</small>
          <input
            name="deleteConfirmation"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            autofocus
            aria-describedby=${inputDescriptionId}
            .value=${confirmation.input}
            ?disabled=${confirmation.pending}
          >
        </label>
        <div
          class="drive-delete-dialog-error"
          data-delete-confirm-error
          role="alert"
          ?hidden=${!confirmation.error}
        >${confirmation.error}</div>
      </form>
      <div class="drive-delete-dialog-actions" slot="footer">
        <button class="drive-control" type="button" data-action="cancel-delete" ?disabled=${confirmation.pending}>${renderIcon("x-circle")}取消</button>
        <button
          class="drive-control drive-delete-confirm-button"
          type="submit"
          form="drive-delete-confirm-form"
          data-delete-confirm-submit
          ?disabled=${confirmation.pending || !matches}
        >${renderIcon("trash", "bold")}${confirmation.pending ? "删除中…" : isTopic ? "永久删除专题" : "永久删除文件"}</button>
      </div>
    </wa-dialog>
  `;
}

function renderCreateTopicDialog(): TemplateResult | typeof nothing {
  if (!state.createTopicOpen) return nothing;
  return html`
    <wa-dialog
      class="drive-create-topic-dialog"
      label="新建专题"
      with-footer
      .open=${true}
      @wa-after-hide=${handleCreateTopicDialogAfterHide}
    >
      <form id="drive-create-topic-form" class="drive-dialog-form" data-topic-form>
        <div class="drive-dialog-intro">
          <span class="drive-dialog-intro-icon">${renderIcon("folder-plus", "duotone")}</span>
          <div><strong>建立独立的资料范围</strong><p>创建后将直接进入文件页，上传第一份资料并查看真实处理进度。</p></div>
        </div>
        <label class="drive-field">
          <span>专题名称</span>
          <input name="topicName" placeholder="例如：鸡蛋" .value=${state.topicName} maxlength="80" autofocus required>
        </label>
      </form>
      <div class="drive-delete-dialog-actions" slot="footer">
        <button class="drive-control" type="button" data-action="cancel-create-topic">${renderIcon("x-circle")}取消</button>
        <button class="drive-control drive-control-primary" type="submit" form="drive-create-topic-form">${renderIcon("check", "bold")}创建并上传资料</button>
      </div>
    </wa-dialog>
  `;
}

function renderReportDateDialog(): TemplateResult | typeof nothing {
  const edit = state.editReportDate;
  if (!edit) return nothing;
  return html`
    <wa-dialog
      class="drive-report-date-dialog"
      label="编辑资料日期"
      with-footer
      .open=${true}
      @wa-hide=${(event: Event) => { if (edit.pending) event.preventDefault(); }}
      @wa-after-hide=${handleReportDateDialogAfterHide}
    >
      <form id="drive-report-date-form" class="drive-dialog-form" data-report-date-form>
        <div class="drive-date-target">
          <span>资料</span><strong>${edit.fileName}</strong>
        </div>
        <label class="drive-field">
          <span>资料日期</span>
          <small>用于排序和检索时识别资料对应的实际日期。</small>
          <input name="reportDate" type="date" .value=${edit.value} ?disabled=${edit.pending} required>
        </label>
        ${edit.error ? html`<div class="drive-delete-dialog-error" role="alert">${edit.error}</div>` : nothing}
      </form>
      <div class="drive-delete-dialog-actions" slot="footer">
        <button class="drive-control" type="button" data-action="cancel-report-date" ?disabled=${edit.pending}>${renderIcon("x-circle")}取消</button>
        <button class="drive-control drive-control-primary" type="submit" form="drive-report-date-form" ?disabled=${edit.pending || !edit.value}>
          ${edit.pending ? html`<span class="drive-spin">${renderIcon("spinner-gap")}</span>保存中…` : html`${renderIcon("check", "bold")}保存日期`}
        </button>
      </div>
    </wa-dialog>
  `;
}

function handleCreateTopicDialogAfterHide(): void {
  state.createTopicOpen = false;
  state.topicName = "";
  renderApp();
}

function handleReportDateDialogAfterHide(): void {
  if (!state.editReportDate?.pending) {
    state.editReportDate = null;
    renderApp();
  }
}

function renderOverview(): TemplateResult {
  const ready = state.topics.some((topic) => topic.ready);
  return html`<drive-ai-qa class="drive-primary-qa" scope="global" .displayName=${state.displayName} .ready=${ready}></drive-ai-qa>`;
}

function renderTopic(): TemplateResult {
  if (!state.topic) return html``;
  return html`<div
      id="topic-panel"
      class="drive-topic-view-panel"
      role="tabpanel"
      aria-labelledby=${`topic-tab-${state.topicView}`}
      tabindex="0"
    >
      ${state.topicView === "qa"
        ? html`<drive-ai-qa scope="topic" .topicId=${state.topic.id} .topicName=${state.topic.name} .displayName=${state.displayName} .ready=${state.topic.ready}></drive-ai-qa>`
        : renderFiles()}
    </div>`;
}

function renderFiles(): TemplateResult {
  const listing = state.listing;
  const role = visibleFileRole(state.role, state.fileRoleView);
  const roles = visibleFileRoles(state.role);
  const presentation = FILE_ROLE_PRESENTATION[role];
  const roleFiles = listing ? filesForKnowledgeRole(listing.files, role) : [];
  const methodologyExists = Boolean(listing?.files.some((file) => file.knowledgeRole === "methodology"));
  const uploadLabel = role === "methodology" && methodologyExists ? "替换专题方法论" : presentation.uploadLabel;
  const uploadBatch = state.uploadBatch?.topicId === state.topic?.id ? state.uploadBatch : null;
  return html`
    <section class=${`drive-tab-panel drive-files-panel is-${role}`}>
      <div class=${`drive-file-role-tabs${state.role === "admin" ? "" : " is-two-column"}`} role="tablist" aria-label="资料类型">
        ${repeat(roles, (entry) => entry, (entry) => renderFileRoleTab(entry, role, listing))}
      </div>
      <div
        id="file-role-panel"
        class="drive-file-role-panel"
        role="tabpanel"
        aria-labelledby=${`file-role-tab-${role}`}
        tabindex="0"
      >
        <div class="drive-material-toolbar">
          <div class="drive-material-heading">
            <span class="drive-file-role-symbol">${renderIcon(presentation.icon, "duotone")}</span>
            <div>
              <span class="drive-eyebrow">${state.role === "admin" ? "资料管理" : "只读资料"}</span>
              <h2>${presentation.label}</h2>
            </div>
          </div>
          <div class="drive-upload-actions">
            ${state.prefix ? html`<button class="drive-control" type="button" data-action="up-folder">${renderIcon("arrow-left")}上一级</button>` : nothing}
            <button class="drive-control drive-refresh-files" type="button" data-action="refresh-files" ?disabled=${Boolean(state.fileLoad?.active)}>
              <span class=${state.fileLoad?.active ? "drive-spin" : ""}>${renderIcon("arrow-clockwise")}</span>
              ${state.fileLoad?.active ? "正在同步" : "刷新状态"}
            </button>
            ${state.role === "admin"
              ? html`
                  <button class="drive-control drive-control-primary" type="button" data-action=${presentation.uploadAction}>
                    ${renderIcon(role === "methodology" ? "database" : "upload-simple", "bold")}${uploadLabel}
                  </button>
                  ${role === "reference"
                    ? html`
                        <button class="drive-control" type="button" data-action="pick-reference-folder">
                          ${renderIcon("folder-plus", "bold")}上传文件夹
                        </button>
                      `
                    : nothing}
                `
              : nothing}
          </div>
        </div>
        <input data-reference-input type="file" multiple hidden>
        <input data-reference-folder-input type="file" multiple webkitdirectory directory hidden>
        <input data-evidence-input type="file" multiple hidden>
        <input data-methodology-input type="file" accept=".md,text/markdown" hidden>
        ${uploadBatch ? renderFileProcessingCenter(uploadBatch) : nothing}
        ${renderFileLoadProgress(Boolean(listing))}
        ${listing ? renderFileList(listing, roleFiles, presentation, role) : state.fileLoad ? nothing : renderLoading()}
      </div>
    </section>
  `;
}

const FILE_LIST_PROGRESS_STEPS: Array<{ stage: FileListProgressStage; label: string; detail: string; icon: string }> = [
  { stage: "topic", label: "确认专题", detail: "检查专题与访问权限", icon: "folder" },
  { stage: "objects", label: "读取目录", detail: "连接 COS 并读取对象列表", icon: "database" },
  { stage: "metadata", label: "同步状态", detail: "读取资料元数据与处理结果", icon: "arrows-clockwise" },
  { stage: "assembling", label: "整理列表", detail: "合并权限、状态与目录信息", icon: "list" },
];

function renderFileLoadProgress(hasListing: boolean): TemplateResult | typeof nothing {
  const load = state.fileLoad;
  if (!load) return nothing;
  if (hasListing && !load.error) {
    if (!load.active) return nothing;
    return html`
      <div class=${`drive-file-sync-strip${load.slow ? " is-slow" : ""}`} role="status" aria-live=${load.mode === "background" ? "off" : "polite"}>
        <span class="drive-spin">${renderIcon("arrows-clockwise", "duotone")}</span>
        <span>
          <strong>${load.slow ? "COS 响应较慢，仍在继续读取" : fileListStageLabel(load.stage)}</strong>
          <small>${fileLoadSummary(load)}</small>
        </span>
      </div>
    `;
  }
  if (load.error) {
    return html`
      <section class="drive-file-load-state is-error" role="alert">
        <span class="drive-file-load-state-icon">${renderIcon("warning", "duotone")}</span>
        <div><strong>资料列表暂未加载完成</strong><p>${load.error}</p></div>
        <button class="drive-control" type="button" data-action="retry-file-list">${renderIcon("arrow-clockwise")}重新加载</button>
      </section>
    `;
  }
  return html`
    <section class=${`drive-file-load-progress${load.slow ? " is-slow" : ""}`} role="status" aria-live="polite" aria-label="资料列表加载进度">
      <div class="drive-file-load-progress-head">
        <span class="drive-file-load-progress-icon drive-spin">${renderIcon("arrows-clockwise", "duotone")}</span>
        <div>
          <span class="drive-eyebrow">正在连接文件存储</span>
          <strong>${fileListStageLabel(load.stage)}</strong>
          <small>${fileLoadSummary(load)}</small>
        </div>
      </div>
      <ol class="drive-file-load-steps">
        ${FILE_LIST_PROGRESS_STEPS.map((step) => {
          const stepState = fileListProgressStepState(load.stage, load.completedStages, step.stage);
          return html`
            <li class=${`is-${stepState}`} aria-current=${stepState === "active" ? "step" : nothing}>
              <span class="drive-file-load-step-icon">
                ${stepState === "complete" ? renderIcon("check", "bold") : renderIcon(step.icon)}
              </span>
              <span><strong>${step.label}</strong><small>${step.detail}</small></span>
            </li>
          `;
        })}
      </ol>
      ${load.slow ? html`<p class="drive-file-load-slow">${renderIcon("info")}COS 响应较慢，仍在继续读取，请保持页面开启。</p>` : nothing}
    </section>
  `;
}

function fileListStageLabel(stage: FileListProgressStage): string {
  return FILE_LIST_PROGRESS_STEPS.find((step) => step.stage === stage)?.detail || "正在读取资料";
}

function fileLoadSummary(load: NonNullable<typeof state.fileLoad>): string {
  const parts = [];
  if (load.stage === "metadata" && load.total) parts.push(`${load.completed}/${load.total} 份`);
  if (load.elapsedMs >= 3_000) parts.push(elapsedLabel(load.startedAt, undefined, load.startedAt + load.elapsedMs));
  return parts.join(" · ") || "请稍候，完成后将自动显示资料";
}

function fileListProgressStepState(
  current: FileListProgressStage,
  completed: FileListProgressStage[],
  stage: FileListProgressStage,
): "pending" | "active" | "complete" {
  if (completed.includes(stage)) return "complete";
  return current === stage ? "active" : "pending";
}

function renderFileRoleTab(role: KnowledgeRole, selectedRole: KnowledgeRole, listing: FileListResponse | null): TemplateResult {
  const presentation = FILE_ROLE_PRESENTATION[role];
  const selected = selectedRole === role;
  const count = listing ? filesForKnowledgeRole(listing.files, role).length : 0;
  return html`
    <button
      id=${`file-role-tab-${role}`}
      class=${`drive-file-role-tab is-${role}${selected ? " is-active" : ""}`}
      type="button"
      role="tab"
      aria-selected=${String(selected)}
      aria-controls="file-role-panel"
      tabindex=${selected ? "0" : "-1"}
      data-action="file-role-view"
      data-role=${role}
    >
      ${selected ? html`<span class="drive-file-role-active-indicator" aria-hidden="true"></span>` : nothing}
      <span class="drive-file-role-tab-icon">${renderIcon(presentation.icon, "duotone")}</span>
      <span><strong>${presentation.label}</strong><small>${count} 项</small></span>
    </button>
  `;
}

function renderFileList(
  listing: FileListResponse,
  files: KnowledgeFile[],
  presentation: (typeof FILE_ROLE_PRESENTATION)[KnowledgeRole],
  role: KnowledgeRole,
): TemplateResult {
  if (!listing.folders.length && !files.length) {
    return html`
      <div class="drive-empty drive-file-role-empty">
        ${renderIcon(presentation.icon, "duotone", "ui-icon-lg")}
        <h3>${presentation.emptyTitle}</h3>
        <p>${presentation.emptyDescription}</p>
      </div>
    `;
  }
  return html`
    <div class="drive-file-table" role="table" aria-label=${presentation.label}>
      <div class="drive-file-row drive-file-row-head" role="row">
        <span role="columnheader">名称</span><span role="columnheader">资料日期</span><span role="columnheader">处理状态</span><span role="columnheader">最近更新</span><span role="columnheader">操作</span>
      </div>
      ${repeat(listing.folders, (folder) => folder.path, (folder) => renderFolderRow(folder, role))}
      ${repeat(files, (file) => file.path, renderFileRow)}
    </div>
  `;
}

function renderFolderRow(folder: KnowledgeFolder, role: KnowledgeRole): TemplateResult {
  const hasReferences = folder.referenceCount > 0;
  const fullyIncorporated = hasReferences && folder.incorporatedCount === folder.referenceCount;
  const partiallyIncorporated = folder.incorporatedCount > 0 && !fullyIncorporated;
  const pending = state.pendingFolderIncorporationPath === folder.path;
  const folderStatus = !hasReferences
    ? "暂无研报"
    : `${folder.incorporatedCount}/${folder.referenceCount} 已纳入`;
  return html`
    <div class="drive-file-row" role="row">
      <span class="drive-file-name" role="cell" data-label="名称">${renderIcon("folder")}<strong>${folder.name}</strong></span>
      <span role="cell" data-label="资料日期">—</span>
      <span role="cell" data-label="处理状态">
        <span class=${`drive-file-state-chip${partiallyIncorporated ? " is-partial" : fullyIncorporated ? " is-incorporated" : ""}`}>
          ${role === "reference" ? folderStatus : "目录"}
        </span>
      </span>
      <span role="cell" data-label="最近更新">—</span>
      <span class="drive-row-actions" role="cell" data-label="操作">
        ${state.role === "admin" && role === "reference" && hasReferences ? html`
          <button class="drive-table-action" type="button" data-action="toggle-folder-incorporated" data-path=${folder.path} data-incorporated=${String(fullyIncorporated)} ?disabled=${pending}>
            <span class=${pending ? "drive-spin" : ""}>${renderIcon(pending ? "arrows-clockwise" : fullyIncorporated ? "x-circle" : "check")}</span>
            ${pending ? "处理中" : fullyIncorporated ? "全部取消" : "全部纳入"}
          </button>
        ` : nothing}
        <button class="drive-table-action" type="button" data-action="open-folder" data-path=${folder.path} ?disabled=${pending}>${renderIcon("folder-open")}打开</button>
      </span>
    </div>
  `;
}

function renderFileRow(file: KnowledgeFile): TemplateResult {
  const processing = file.knowledgeRole === "reference" ? null : processingDisplay(file);
  const displayName = methodologyDisplayName(file);
  const stage: FileTaskStage = processing?.stage || "archived";
  const status = processing?.label || "已归档";
  const detail = processing?.detail || (file.incorporatedAt ? "研报原件已归档，并已纳入专题方法论。" : "研报原件已归档，当前尚未纳入专题方法论。");
  const tone = processing?.tone || "success";
  const expanded = state.expandedFilePath === file.path;
  return html`
    <div class=${`drive-file-row is-${file.knowledgeRole}`} role="row">
      <span class="drive-file-name" role="cell" data-label="名称">
        <span class="drive-file-type-icon">${renderIcon(fileIconName(displayName))}</span>
        <span class="drive-file-name-copy"><strong title=${displayName}>${displayName}</strong><small>${formatBytes(file.size)}</small></span>
      </span>
      <span role="cell" data-label="资料日期">${file.knowledgeRole === "evidence" ? file.reportDate || "待补充" : "—"}</span>
      <span role="cell" data-label="处理状态">
        <button
          class=${`drive-file-status is-${tone}`}
          type="button"
          data-action="toggle-file-progress"
          data-path=${file.path}
          aria-expanded=${String(expanded)}
        >
          <span class="drive-file-status-copy"><strong>${status}</strong>${file.knowledgeRole === "reference" ? html`<small>${file.incorporatedAt ? "已纳入方法论" : "待纳入方法论"}</small>` : nothing}</span>
          ${renderIcon(expanded ? "caret-up" : "caret-down")}
        </button>
      </span>
      <span role="cell" data-label="最近更新">${formatDate(file.processing?.updatedAt || file.uploadedAt || file.lastModified)}</span>
      <span class="drive-row-actions" role="cell" data-label="操作">
        ${state.role === "admin" && processing?.retryable ? html`<button class="drive-table-action" type="button" data-action="retry-file" data-path=${file.path}>${renderIcon("arrow-clockwise")}重试</button>` : nothing}
        <span class="drive-row-actions-desktop">
          ${state.role === "admin" && file.knowledgeRole === "reference" ? html`<button class="drive-table-action" type="button" data-action="toggle-incorporated" data-path=${file.path} data-incorporated=${String(Boolean(file.incorporatedAt))}>${renderIcon(file.incorporatedAt ? "x-circle" : "check")} ${file.incorporatedAt ? "取消纳入" : "标记纳入"}</button>` : nothing}
          ${state.role === "admin" && file.knowledgeRole === "evidence" ? html`<button class="drive-table-action" type="button" data-action="edit-report-date" data-path=${file.path} data-name=${displayName} data-report-date=${file.reportDate || ""}>${renderIcon("calendar-dots", "duotone")}编辑资料日期</button>` : nothing}
          <button class="drive-table-action" type="button" data-action="download-file" data-path=${file.path}>${renderIcon("download-simple")}下载</button>
          ${state.role === "admin" && file.knowledgeRole !== "methodology" ? html`<button class="drive-table-action is-danger" type="button" data-action="delete-file" data-path=${file.path} data-name=${displayName}>${renderIcon("trash")}删除</button>` : nothing}
        </span>
        <wa-dropdown class="drive-row-action-menu" placement="bottom-end">
          <button class="drive-table-action" type="button" slot="trigger" aria-label=${`打开 ${displayName} 的操作菜单`}>
            ${renderIcon("list")}操作
          </button>
          ${state.role === "admin" && file.knowledgeRole === "reference" ? html`
            <wa-dropdown-item data-action="toggle-incorporated" data-path=${file.path} data-incorporated=${String(Boolean(file.incorporatedAt))}>
              ${file.incorporatedAt ? "取消纳入方法论" : "标记纳入方法论"}
            </wa-dropdown-item>
          ` : nothing}
          ${state.role === "admin" && file.knowledgeRole === "evidence" ? html`
            <wa-dropdown-item data-action="edit-report-date" data-path=${file.path} data-name=${displayName} data-report-date=${file.reportDate || ""}>编辑资料日期</wa-dropdown-item>
          ` : nothing}
          <wa-dropdown-item data-action="download-file" data-path=${file.path}>下载文件</wa-dropdown-item>
          ${state.role === "admin" && file.knowledgeRole !== "methodology" ? html`
            <wa-dropdown-item variant="danger" data-action="delete-file" data-path=${file.path} data-name=${displayName}>删除文件</wa-dropdown-item>
          ` : nothing}
        </wa-dropdown>
      </span>
    </div>
    ${expanded ? renderFileProgressDetail(file, stage, status, detail) : nothing}
  `;
}

function renderFileProcessingCenter(batch: UploadBatchState): TemplateResult {
  const counts = batchCounts(batch);
  const elapsed = elapsedLabel(batch.startedAt, batch.completedAt);
  const allComplete = counts.complete === batch.items.length;
  const title = allComplete
    ? `本批次 ${batch.items.length} 份资料已处理完成`
    : counts.active
      ? `正在处理 ${batch.items.length} 份资料 · ${counts.complete} 份已完成`
      : `${counts.failed} 份资料未完成`;
  const summary = [
    counts.active ? `${counts.active} 项进行中` : "",
    counts.failed ? `${counts.failed} 项需处理` : "",
    elapsed ? `用时 ${elapsed}` : "",
  ].filter(Boolean).join(" · ");
  return html`
    <section
      class=${`drive-file-processing-center${counts.failed ? " has-failure" : ""}${allComplete ? " is-complete" : ""}`}
      aria-label="资料处理中心"
      aria-busy=${String(counts.active > 0)}
    >
      <button class="drive-file-processing-head" type="button" data-action="toggle-file-batch" aria-expanded=${String(batch.expanded)}>
        <span class=${`drive-file-processing-icon${counts.active ? " is-active" : ""}`}>
          ${renderIcon(counts.failed ? "warning" : allComplete ? "check-circle" : "arrows-clockwise", counts.active ? "duotone" : "regular")}
        </span>
        <span class="drive-file-processing-title">
          <strong>${title}</strong>
          <small>${summary || "正在建立真实处理轨迹"}</small>
        </span>
        ${renderIcon(batch.expanded ? "caret-up" : "caret-down")}
      </button>
      <span class="drive-visually-hidden" role="status" aria-live="polite">${title}</span>
      ${batch.expanded ? html`
        <div class="drive-file-processing-body">
          <ol class="drive-file-pipeline" aria-label="批次处理阶段">
            ${taskSteps(batch.knowledgeRole).map((step) => renderBatchStep(batch, step.stage, step.label))}
          </ol>
          <div class="drive-file-task-list">
            ${batch.items.map(renderBatchItem)}
          </div>
          ${counts.failed ? html`
            <div class="drive-file-processing-recovery">
              <span>失败项目不会影响其他资料继续处理。</span>
              <button class="drive-control" type="button" data-action=${uploadActionForRole(batch.knowledgeRole)}>
                ${renderIcon("upload-simple")}重新选择文件
              </button>
            </div>
          ` : nothing}
        </div>
      ` : nothing}
    </section>
  `;
}

function renderBatchStep(batch: UploadBatchState, stage: FileTaskStage, label: string): TemplateResult {
  const states = batch.items.map((item) => stepState(item.stage, stage, item.failedStage));
  const complete = states.filter((value) => value === "complete").length;
  const active = states.some((value) => value === "active");
  const failed = states.some((value) => value === "failed");
  const stateName = failed ? "failed" : active ? "active" : complete === batch.items.length ? "complete" : "pending";
  return html`
    <li class=${`is-${stateName}`}>
      <span class="drive-file-pipeline-node">${stateName === "complete" ? renderIcon("check", "bold") : renderIcon(failed ? "warning" : "circle")}</span>
      <span><strong>${label}</strong><small>${complete}/${batch.items.length}</small></span>
    </li>
  `;
}

function renderBatchItem(item: FileTaskItem): TemplateResult {
  const percent = fileTaskPercent(item);
  const elapsed = elapsedLabel(item.startedAt, item.completedAt);
  return html`
    <div class=${`drive-file-task-item is-${item.state}`}>
      <span class="drive-file-task-mark">${renderIcon(item.state === "complete" ? "check-circle" : item.state === "failed" ? "warning" : "file-arrow-up", "duotone")}</span>
      <span class="drive-file-task-copy">
        <strong title=${item.name}>${item.name}</strong>
        <small>${item.error || fileTaskStageLabel(item.stage, item.knowledgeRole)}${elapsed ? ` · ${elapsed}` : ""}</small>
        ${item.stage === "uploading" ? html`<wa-progress-bar aria-label=${`${item.name} 上传进度`} .value=${percent}></wa-progress-bar>` : nothing}
      </span>
      <span class="drive-file-task-value">${item.stage === "uploading" ? `${percent}%` : item.state === "complete" ? "完成" : item.state === "failed" ? "需处理" : "进行中"}</span>
    </div>
  `;
}

function renderFileProgressDetail(file: KnowledgeFile, stage: FileTaskStage, status: string, detail: string): TemplateResult {
  return html`
    <div class="drive-file-progress-detail" role="row">
      <div role="cell">
        <div class="drive-file-progress-detail-head">
          <span><strong>${status}</strong><small>${detail}</small></span>
          <time>${formatDate(file.processing?.updatedAt || file.uploadedAt || file.lastModified)}</time>
        </div>
        <ol class="drive-file-progress-track" aria-label=${`${methodologyDisplayName(file)}处理轨迹`}>
          ${taskSteps(file.knowledgeRole).map((step) => {
            const stateName = stepState(stage, step.stage, stage === "failed" ? "processing" : undefined);
            return html`
              <li class=${`is-${stateName}`}>
                <span>${stateName === "complete" ? renderIcon("check", "bold") : renderIcon(stateName === "failed" ? "warning" : "circle")}</span>
                <strong>${step.label}</strong>
              </li>
            `;
          })}
        </ol>
      </div>
    </div>
  `;
}

function uploadActionForRole(role: KnowledgeRole): string {
  return role === "reference" ? "pick-reference" : role === "methodology" ? "pick-methodology" : "pick-evidence";
}

function tabButton(view: TopicView, label: string, icon: string): TemplateResult {
  const selected = state.topicView === view;
  return html`
    <button
      id=${`topic-tab-${view}`}
      type="button"
      class=${selected ? "is-active" : ""}
      role="tab"
      aria-selected=${String(selected)}
      aria-controls="topic-panel"
      tabindex=${selected ? "0" : "-1"}
      data-action="topic-view"
      data-view=${view}
    >${selected ? html`<span class="drive-tab-active-indicator" aria-hidden="true"></span>` : nothing}${renderIcon(icon)}<span>${label}</span></button>
  `;
}

function iconButton(icon: string, label: string, action: string): TemplateResult {
  return html`<button class="drive-icon-button" type="button" data-action=${action} aria-label=${label} title=${label}>${renderIcon(icon)}</button>`;
}

function renderThemeToggle(className = ""): TemplateResult {
  const target = state.theme === "dark" ? "亮色" : "暗色";
  const label = `切换到${target}主题`;
  return html`<button class=${`theme-toggle ${className}`.trim()} type="button" data-theme-toggle data-action="toggle-theme" aria-label=${label} title=${label}>${renderIcon(state.theme === "dark" ? "sun" : "moon")}</button>`;
}

function renderLoading(): TemplateResult { return html`<div class="drive-inline-skeleton"><span></span><span></span><span></span></div>`; }
function renderStatus(): TemplateResult | typeof nothing { return state.status ? html`<wa-callout variant=${state.statusTone === "danger" ? "danger" : state.statusTone === "success" ? "success" : "neutral"}>${state.status}</wa-callout>` : nothing; }
function setStatus(message: string, tone: "neutral" | "success" | "danger" = "neutral"): void { statusController.show(message, tone); }
function showError(error: unknown): void { state.loading = false; setStatus(error instanceof Error ? error.message : "请求失败", "danger"); }

function parseFileListPhase(data: Record<string, unknown>): FileListPhaseEvent | null {
  if (!isFileListProgressStage(data.stage) || (data.state !== "active" && data.state !== "complete")) return null;
  return {
    stage: data.stage,
    state: data.state,
    elapsedMs: typeof data.elapsedMs === "number" && Number.isFinite(data.elapsedMs) ? Math.max(0, data.elapsedMs) : 0,
    ...(typeof data.completed === "number" && Number.isFinite(data.completed) ? { completed: Math.max(0, data.completed) } : {}),
    ...(typeof data.total === "number" && Number.isFinite(data.total) ? { total: Math.max(0, data.total) } : {}),
  };
}

function parseFileListError(data: Record<string, unknown>): FileListErrorEvent | null {
  if (
    !isFileListProgressStage(data.stage)
    || data.code !== "FILE_LIST_FAILED"
    || data.retryable !== true
    || typeof data.message !== "string"
  ) return null;
  return {
    stage: data.stage,
    code: "FILE_LIST_FAILED",
    retryable: true,
    message: data.message,
  };
}

function isFileListProgressStage(value: unknown): value is FileListProgressStage {
  return value === "topic" || value === "objects" || value === "metadata" || value === "assembling";
}

function isFileListResponse(value: unknown): value is FileListResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FileListResponse>;
  return typeof candidate.prefix === "string"
    && Array.isArray(candidate.folders)
    && Array.isArray(candidate.files)
    && (typeof candidate.nextCursor === "string" || candidate.nextCursor === null);
}
function showEntryError(error: unknown): void {
  state.loading = false;
  state.entrySlow = false;
  state.entryError = error instanceof Error ? error.message : "请求失败，请重试。";
  renderApp();
}
