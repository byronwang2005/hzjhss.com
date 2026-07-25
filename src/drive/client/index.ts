import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "./drive.css";

import Uppy from "@uppy/core";
import type { UppyFile } from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import { html, nothing, render, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { renderIcon } from "./icons";
import { transitionEntryState } from "./entry-flow";
import "./qa-chat";
import type { FileListResponse, KnowledgeFile, KnowledgeRole, OverviewResponse, UploadCompleteResponse } from "../shared/contracts";
import { CLIENT_TIMING } from "../shared/runtime";
import { directoryPrefix, FILE_ROLE_PRESENTATION, fileIconName, fileNameFromPath, filesForKnowledgeRole, formatBytes, formatDate, methodologyDisplayName, normalizeClientRelativePath, processingDisplay, visibleFileRole, visibleFileRoles } from "./utils";
import { api, ApiError } from "./api";
import { state, type TopicView } from "./state";
import { pdfPageCount, validateFileSizeAndType } from "./upload-policy";
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

let fileRefreshTimer: number | undefined;
let fileProgressClockTimer: number | undefined;
let uploadOperationActive = false;

root.addEventListener("click", (event) => void handleClick(event));
root.addEventListener("submit", (event) => void handleSubmit(event));
root.addEventListener("input", handleInput);
root.addEventListener("change", (event) => void handleChange(event));
root.addEventListener("keydown", handleTabKeydown);
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
  state.topic = topic;
  state.topicView = view;
  state.fileRoleView = "evidence";
  state.prefix = "";
  state.listing = null;
  state.mode = "topic";
  renderApp();
  syncFileProgressClock();
  if (state.topicView === "files") await loadFiles();
}

async function loadFiles(background = false): Promise<void> {
  if (!state.topic) return;
  if (fileRefreshTimer !== undefined) {
    window.clearTimeout(fileRefreshTimer);
    fileRefreshTimer = undefined;
  }
  const topicId = state.topic.id;
  const prefix = state.prefix;
  if (!background) {
    state.loading = true;
    renderApp();
  }
  const listing = await api<FileListResponse>(`/list?topicId=${encodeURIComponent(topicId)}&prefix=${encodeURIComponent(prefix)}`);
  const batchSnapshot = state.uploadBatch?.topicId === topicId ? state.uploadBatch : null;
  const batchListing = batchSnapshot?.items.some((item) => item.state === "active" && ["registering", "queued", "processing", "indexing"].includes(item.stage))
    ? await loadBatchStatusListing(topicId, batchSnapshot, batchSnapshot.prefix === prefix ? listing : null)
    : listing;
  if (state.topic?.id !== topicId || state.prefix !== prefix || state.topicView !== "files") return;
  state.listing = listing;
  if (state.uploadBatch === batchSnapshot) reconcileUploadBatch(batchSnapshot, topicId, batchListing);
  state.loading = false;
  renderApp();
  syncFileProgressClock();
  const batchHasServerWork = state.uploadBatch?.topicId === topicId
    && state.uploadBatch.items.some((item) => item.state === "active" && ["registering", "queued", "processing", "indexing"].includes(item.stage));
  if (listing.files.some((file) => processingDisplay(file).poll) || batchHasServerWork) {
    fileRefreshTimer = window.setTimeout(() => {
      fileRefreshTimer = undefined;
      if (state.mode === "topic" && state.topicView === "files") void loadFiles(true);
    }, batchHasServerWork ? CLIENT_TIMING.activeFileRefreshMs : CLIENT_TIMING.fileRefreshMs);
  }
}

async function loadBatchStatusListing(
  topicId: string,
  batch: UploadBatchState,
  firstPage: FileListResponse | null,
): Promise<FileListResponse> {
  const files = [...(firstPage?.files || [])];
  let cursor = firstPage?.nextCursor;
  if (!firstPage) {
    const page = await api<FileListResponse>(`/list?topicId=${encodeURIComponent(topicId)}&prefix=${encodeURIComponent(batch.prefix)}`);
    files.push(...page.files);
    cursor = page.nextCursor;
  }
  const wantedPaths = new Set(batch.items.filter((item) => item.state === "active").map((item) => item.relativePath));
  const foundPaths = new Set(files.map((file) => file.path));
  while (cursor && [...wantedPaths].some((path) => !foundPaths.has(path))) {
    const page = await api<FileListResponse>(
      `/list?topicId=${encodeURIComponent(topicId)}&prefix=${encodeURIComponent(batch.prefix)}&cursor=${encodeURIComponent(cursor)}`,
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
      await api("/topic", { method: "POST", body: { name: state.topicName } });
      state.topicName = "";
      await loadOverview();
    } catch (error) { showError(error); }
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
    await api("/logout", { method: "POST" });
    location.reload();
  } else if (action === "refresh") {
    if (state.mode === "topic" && state.topicView === "files") await loadFiles(); else await loadOverview();
  } else if (action === "create-topic") {
    state.mode = "create";
    renderApp();
  } else if (action === "back") {
    state.mode = "overview";
    state.topic = null;
    renderApp();
    syncFileProgressClock();
  } else if (action === "open-topic") {
    await openTopic(String(button.dataset.topicId));
  } else if (action === "topic-view") {
    state.topicView = button.dataset.view === "files" ? "files" : "qa";
    renderApp();
    syncFileProgressClock();
    if (state.topicView === "files") await loadFiles();
  } else if (action === "file-role-view") {
    state.fileRoleView = normalizeKnowledgeRole(button.dataset.role);
    state.expandedFilePath = null;
    renderApp();
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
    await loadFiles();
  } else if (action === "up-folder") {
    state.prefix = directoryPrefix(state.prefix.replace(/\/$/, ""));
    await loadFiles();
  } else if (action === "pick-reference") {
    root.querySelector<HTMLInputElement>("[data-reference-input]")?.click();
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
  } else if (action === "edit-report-date") {
    const value = window.prompt("请输入资料日期（YYYY-MM-DD）", button.dataset.reportDate || "");
    if (value === null) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      setStatus("资料日期必须为 YYYY-MM-DD。", "danger");
      return;
    }
    await api("/object", {
      method: "PATCH",
      body: { topicId: state.topic?.id, path: button.dataset.path, reportDate: value.trim() },
    });
    setStatus("资料日期已更新，索引正在重建。", "success");
    await loadFiles();
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
  if (!input.matches("[data-reference-input], [data-evidence-input], [data-methodology-input]")) return;
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length) return;
  const knowledgeRole: KnowledgeRole = input.matches("[data-methodology-input]")
    ? "methodology"
    : input.matches("[data-reference-input]")
      ? "reference"
      : "evidence";
  await uploadFiles(
    knowledgeRole === "methodology" ? files.slice(0, 1) : files,
    (file) => knowledgeRole === "methodology" && state.topic?.methodologyPath
      ? state.topic.methodologyPath
      : knowledgeRole === "methodology"
        ? "专题方法论.md"
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
    return;
  }
  if (state.entryState === "preparing-workspace") {
    render(renderWorkspaceLoading(), root);
    removePreflightShell();
    return;
  }
  render(state.mode === "login" ? renderLogin() : renderShell(), root);
  removePreflightShell();
}

function removePreflightShell(): void {
  root.querySelector(".drive-preflight-shell")?.remove();
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
  const title = state.mode === "topic" ? state.topic?.name : "新建专题";
  const description = state.mode === "topic"
    ? state.topic?.ready ? "从当前专题中提问，或管理专题资料。" : "资料仍在处理中，完成后即可开始问答。"
    : "建立一个独立的资料范围，让后续问答更聚焦。";
  return html`<section class="drive-dashboard">
    <header class="drive-appbar">
      <button class="drive-brand-lockup drive-brand-button drive-title-button" type="button" data-action="back" aria-label="返回知识库首页">
        <img src="/assets/jhss-logo-cropped.png" alt=""><span><strong>嘉合杉升</strong><small>AI 知识库</small></span>
      </button>
      <div class="drive-appbar-meta"><a class="drive-appbar-docs" href="/docs/">${renderIcon("book-open")}AI 手册</a>${renderThemeToggle()}<span class="drive-user-badge">${state.displayName}<small>${state.role === "admin" ? "管理员" : "成员"}</small></span>${iconButton("arrow-clockwise", "刷新", "refresh")}${iconButton("sign-out", "退出", "logout")}</div>
    </header>
    <main class=${`drive-dashboard-main is-${state.mode}`} data-mode=${state.mode}>
      ${state.mode === "overview" ? nothing : html`
        <div class="drive-page-head"><div>
          <button class="drive-back-link" type="button" data-action="back">${renderIcon("arrow-left")}返回知识库</button>
          <h1>${title}</h1><p>${description}</p>
        </div></div>
      `}
      ${renderStatus()}
      ${state.loading ? renderLoading() : state.mode === "overview" ? renderOverview() : state.mode === "create" ? renderCreate() : renderTopic()}
    </main>
    ${renderDeleteConfirmation()}
  </section>`;
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

function renderOverview(): TemplateResult {
  const ready = state.topics.some((topic) => topic.ready);
  return html`<div class="drive-two-column"><drive-ai-qa scope="global" .displayName=${state.displayName} .ready=${ready}></drive-ai-qa><aside class="drive-panel drive-topic-panel"><div class="drive-panel-head"><div><span class="drive-eyebrow">资料范围</span><h2>专题</h2></div><div class="drive-topic-panel-actions"><span>${state.topics.length} 个</span>${state.role === "admin" ? html`<button class="drive-control" data-action="create-topic" type="button">${renderIcon("folder-plus")}新建专题</button>` : nothing}</div></div>
    ${state.topics.length ? html`<div class="drive-topic-grid">${repeat(state.topics, (topic) => topic.id, (topic) => html`<button class="drive-topic-card" type="button" data-action="open-topic" data-topic-id=${topic.id}><span class="drive-topic-card-icon">${renderIcon("folder")}</span><span><strong>${topic.name}</strong><small class=${topic.ready ? "is-ready" : ""}>${topic.ready ? "可问答" : "处理中"}</small></span>${renderIcon("arrow-right")}</button>`)}</div>` : html`<div class="drive-empty">${renderIcon("folder")}<h3>还没有专题</h3><p>创建专题并上传资料后，即可开始可追溯问答。</p></div>`}
  </aside></div>`;
}

function renderCreate(): TemplateResult {
  return html`<form class="drive-form drive-create-card" data-topic-form><div class="drive-create-icon">${renderIcon("folder-plus")}</div><div><h2>专题信息</h2><p>专题创建后，可继续上传文件并等待系统处理。</p></div><label class="drive-field"><span>专题名称</span><input name="topicName" placeholder="例如：2026 年行业研究" .value=${state.topicName} required></label><div class="drive-form-actions"><button class="drive-control" type="button" data-action="back">${renderIcon("x-circle")}取消</button><button class="drive-control drive-control-primary" type="submit">${renderIcon("check", "bold")}创建专题</button></div></form>`;
}

function renderTopic(): TemplateResult {
  if (!state.topic) return html``;
  return html`
    <div class="drive-tabs" role="tablist" aria-label="专题工作区">
      ${tabButton("qa", "问答", "chat-circle-dots")}
      ${tabButton("files", state.role === "admin" ? "文件" : "资料", "files")}
    </div>
    <div
      id="topic-panel"
      class="drive-topic-view-panel"
      role="tabpanel"
      aria-labelledby=${`topic-tab-${state.topicView}`}
      tabindex="0"
    >
      ${state.topicView === "qa"
        ? html`<drive-ai-qa scope="topic" .topicId=${state.topic.id} .topicName=${state.topic.name} .ready=${state.topic.ready}></drive-ai-qa>`
        : renderFiles()}
    </div>
  `;
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
              <p>${presentation.description}</p>
            </div>
          </div>
          <div class="drive-upload-actions">
            ${state.prefix ? html`<button class="drive-control" type="button" data-action="up-folder">${renderIcon("arrow-left")}上一级</button>` : nothing}
            ${state.role === "admin"
              ? html`
                  <button class="drive-control drive-control-primary" type="button" data-action=${presentation.uploadAction}>
                    ${renderIcon(role === "methodology" ? "database" : "upload-simple", "bold")}${uploadLabel}
                  </button>
                `
              : nothing}
          </div>
        </div>
        <input data-reference-input type="file" multiple hidden>
        <input data-evidence-input type="file" multiple hidden>
        <input data-methodology-input type="file" accept=".md,text/markdown" hidden>
        ${uploadBatch ? renderFileProcessingCenter(uploadBatch) : nothing}
        ${listing ? renderFileList(listing, roleFiles, presentation) : renderLoading()}
        ${state.role === "admin" && !state.prefix
          ? html`
              <div class="drive-topic-danger-zone">
                <div><strong>专题管理</strong><span>删除专题会永久移除其中的全部资料。</span></div>
                <button class="drive-control drive-control-danger" type="button" data-action="delete-topic">${renderIcon("trash")}删除专题</button>
              </div>
            `
          : nothing}
      </div>
    </section>
  `;
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
      <span class="drive-file-role-tab-icon">${renderIcon(presentation.icon, "duotone")}</span>
      <span><strong>${presentation.label}</strong><small>${count} 项</small></span>
    </button>
  `;
}

function renderFileList(listing: FileListResponse, files: KnowledgeFile[], presentation: (typeof FILE_ROLE_PRESENTATION)[KnowledgeRole]): TemplateResult {
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
        <span role="columnheader">名称</span><span role="columnheader">大小</span><span role="columnheader">状态</span><span role="columnheader">更新</span><span role="columnheader">操作</span>
      </div>
      ${repeat(listing.folders, (folder) => folder.path, (folder) => html`
        <div class="drive-file-row" role="row">
          <span class="drive-file-name" role="cell" data-label="名称">${renderIcon("folder")}<strong>${folder.name}</strong></span>
          <span role="cell" data-label="大小">-</span>
          <span role="cell" data-label="状态">目录</span>
          <span role="cell" data-label="更新">-</span>
          <span class="drive-row-actions" role="cell" data-label="操作"><button class="drive-table-action" type="button" data-action="open-folder" data-path=${folder.path}>${renderIcon("folder-open")}打开</button></span>
        </div>
      `)}
      ${repeat(files, (file) => file.path, renderFileRow)}
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
        <span class="drive-file-name-copy"><strong title=${displayName}>${displayName}</strong></span>
      </span>
      <span role="cell" data-label="大小">${formatBytes(file.size)}</span>
      <span role="cell" data-label="状态">
        <button
          class=${`drive-file-status is-${tone}`}
          type="button"
          data-action="toggle-file-progress"
          data-path=${file.path}
          aria-expanded=${String(expanded)}
        >
          <span class="drive-file-status-copy"><strong>${status}</strong><small>${file.reportDate || (file.knowledgeRole === "reference" ? file.incorporatedAt ? "已纳入方法论" : "待纳入方法论" : "")}</small></span>
          <span class="drive-file-status-nodes" aria-hidden="true">
            ${taskSteps(file.knowledgeRole).map((step) => {
              const stateName = stepState(stage, step.stage, stage === "failed" ? "processing" : undefined);
              return html`<i class=${`is-${stateName}`}></i>`;
            })}
          </span>
          ${renderIcon(expanded ? "caret-up" : "caret-down")}
        </button>
      </span>
      <span role="cell" data-label="更新">${formatDate(file.processing?.updatedAt || file.uploadedAt || file.lastModified)}</span>
      <span class="drive-row-actions" role="cell" data-label="操作">
        ${state.role === "admin" && file.knowledgeRole === "reference" ? html`<button class="drive-table-action" type="button" data-action="toggle-incorporated" data-path=${file.path} data-incorporated=${String(Boolean(file.incorporatedAt))}>${renderIcon(file.incorporatedAt ? "x-circle" : "check")} ${file.incorporatedAt ? "取消纳入" : "标记纳入"}</button>` : nothing}
        ${state.role === "admin" && file.knowledgeRole === "evidence" ? html`<button class="drive-table-action" type="button" data-action="edit-report-date" data-path=${file.path} data-report-date=${file.reportDate || ""}>${renderIcon("calendar-dots", "duotone")}日期</button>` : nothing}
        ${state.role === "admin" && processing?.retryable ? html`<button class="drive-table-action" type="button" data-action="retry-file" data-path=${file.path}>${renderIcon("arrow-clockwise")}重试</button>` : nothing}
        <button class="drive-table-action" type="button" data-action="download-file" data-path=${file.path}>${renderIcon("download-simple")}下载</button>
        ${state.role === "admin" && file.knowledgeRole !== "methodology" ? html`<button class="drive-table-action is-danger" type="button" data-action="delete-file" data-path=${file.path} data-name=${displayName}>${renderIcon("trash")}删除</button>` : nothing}
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
    >${renderIcon(icon)}${label}</button>
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
function setStatus(message: string, tone: "neutral" | "success" | "danger" = "neutral"): void { state.status = message; state.statusTone = tone; renderApp(); }
function showError(error: unknown): void { state.loading = false; setStatus(error instanceof Error ? error.message : "请求失败", "danger"); }
function showEntryError(error: unknown): void {
  state.loading = false;
  state.entrySlow = false;
  state.entryError = error instanceof Error ? error.message : "请求失败，请重试。";
  renderApp();
}
