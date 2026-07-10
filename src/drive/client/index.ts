import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/drawer/drawer.js";
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "pdfjs-dist/web/pdf_viewer.css";
import "./phosphor-drive.css";
import "./drive.css";

import Uppy from "@uppy/core";
import type { UppyFile } from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import DOMPurify from "dompurify";
import { html, nothing, render, type TemplateResult } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import MarkdownIt from "markdown-it";
import type {
  DriveFile,
  DriveFolder,
  DriveListResult,
  DriveOverview,
  DriveOverviewTopic,
  PreviewKind,
  TopicDetail,
  TopicTab,
  UploadCompleteResponse,
  ViewMode,
} from "./types";
import {
  canPreview,
  directoryPrefix,
  fileIconName,
  fileKindLabel,
  fileNameFromPath,
  formatBytes,
  formatDate,
  formatDateOnly,
  normalizeClientRelativePath,
  previewKindForFile,
  shouldRefreshAfterMutation,
  sortFilesByFreshness,
  visibleMaterialFiles,
} from "./utils";

interface PreviewState {
  file: DriveFile;
  kind: PreviewKind;
  title: string;
  url?: string;
  renderedHtml?: string;
  loading: boolean;
  failed: boolean;
}

interface DraftState {
  loginName: string;
  accessCode: string;
  topicName: string;
  createKeywords: string;
  settingsKeywords: string;
}

interface AppState {
  mode: ViewMode;
  activeTab: TopicTab;
  overview: DriveOverview | null;
  topic: TopicDetail | null;
  materialList: DriveListResult | null;
  materialPrefix: string;
  status: string;
  statusTone: "neutral" | "danger" | "success";
  loading: boolean;
  upload: { active: boolean; name: string; percent: number; total: number };
  preview: PreviewState | null;
  pendingDelete: { type: "file" | "topic"; path?: string; prefix?: string; name: string } | null;
  deleteConfirmText: string;
  busyAction: "agent-manifest" | "agent-output-task" | null;
  drafts: DraftState;
}

interface PresignedUpload {
  url: string;
  path: string;
  contentType: string;
}

type UppyMeta = Record<string, unknown>;
type UppyBody = Record<string, unknown>;
type DriveUppyFile = UppyFile<UppyMeta, UppyBody>;
type RequestKey = "overview" | "topic" | "materials";

const apiBase = "/api/drive";
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: false });
const rootElement = document.querySelector<HTMLElement>("[data-drive-root]");
const requestControllers = new Map<RequestKey, AbortController>();

const state: AppState = {
  mode: "login",
  activeTab: "outputs",
  overview: null,
  topic: null,
  materialList: null,
  materialPrefix: "",
  status: "",
  statusTone: "neutral",
  loading: false,
  upload: { active: false, name: "", percent: 0, total: 0 },
  preview: null,
  pendingDelete: null,
  deleteConfirmText: "",
  busyAction: null,
  drafts: {
    loginName: "",
    accessCode: "",
    topicName: "",
    createKeywords: "",
    settingsKeywords: "",
  },
};

let previewVersion = 0;
let previewReturnFocus: HTMLElement | null = null;

if (!rootElement) {
  throw new Error("Missing [data-drive-root] mount element.");
}

const root = rootElement;

root.addEventListener("click", (event) => void handleClick(event));
root.addEventListener("submit", (event) => void handleSubmit(event));
root.addEventListener("change", (event) => void handleChange(event));
root.addEventListener("input", handleInput);
root.addEventListener("wa-after-hide", (event) => {
  const target = event.target as HTMLElement;
  if (target.matches("[data-preview-drawer]") && state.preview?.kind !== "pdf") {
    closePreview();
  }
  if (target.matches("[data-delete-dialog]")) {
    state.pendingDelete = null;
    state.deleteConfirmText = "";
    renderApp();
  }
});
root.addEventListener("drive-pdf-close", () => closePreview());

renderApp();
void boot();

async function boot(): Promise<void> {
  setStatus("正在读取专题资料库...");
  await loadOverview();
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
  const form = event.target as HTMLFormElement;
  if (!form.matches("[data-login-form], [data-create-form], [data-settings-form]")) {
    return;
  }
  event.preventDefault();
  if (form.matches("[data-login-form]")) {
    await submitLogin();
  } else if (form.matches("[data-create-form]")) {
    await submitCreateTopic();
  } else {
    await submitTopicSettings();
  }
}

async function handleClick(event: MouseEvent): Promise<void> {
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!target || target.hasAttribute("disabled")) {
    return;
  }
  const action = target.dataset.action || "";
  const path = target.dataset.path || "";
  const prefix = target.dataset.prefix || "";
  const name = target.dataset.name || fileNameFromPath(path);

  if (action === "logout") {
    await logout();
  } else if (action === "create-view") {
    showCreateTopic();
  } else if (action === "cancel-create" || action === "back-overview") {
    await loadOverview();
  } else if (action === "open-topic") {
    await openTopic(prefix || path, "outputs");
  } else if (action === "tab") {
    setActiveTab(target.dataset.tab as TopicTab);
  } else if (action === "open-folder") {
    await loadMaterialDirectory(path);
  } else if (action === "preview") {
    await openPreview(path, target);
  } else if (action === "download") {
    await downloadFile(path);
  } else if (action === "copy-link") {
    await copySignedLink(path);
  } else if (action === "delete-file") {
    openDelete({ type: "file", path, name });
  } else if (action === "delete-topic" && state.topic) {
    openDelete({ type: "topic", prefix: state.topic.topic.prefix, name: state.topic.topic.name });
  } else if (action === "confirm-delete") {
    await confirmDelete();
  } else if (action === "cancel-delete") {
    closeDeleteDialog();
  } else if (action === "agent-manifest") {
    await copyAgentManifest();
  } else if (action === "agent-output-task") {
    await copyAgentOutputTask();
  } else if (action === "refresh") {
    await refreshCurrent();
  }
}

async function handleChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  if (input.matches("[data-file-input]")) {
    const files = Array.from(input.files || []);
    input.value = "";
    await uploadFiles(files, (file) => file.name);
  } else if (input.matches("[data-folder-input]")) {
    const files = Array.from(input.files || []);
    input.value = "";
    await uploadFiles(files, (file) => file.webkitRelativePath || file.name);
  }
}

function handleInput(event: Event): void {
  const input = event.target as HTMLInputElement | HTMLTextAreaElement;
  const draft = input.dataset.draft as keyof DraftState | undefined;
  if (draft) {
    state.drafts[draft] = input.value;
  }
  if (input.matches("[data-delete-confirm-input]")) {
    state.deleteConfirmText = input.value;
    renderApp();
    queueMicrotask(() => document.querySelector<HTMLInputElement>("[data-delete-confirm-input]")?.focus());
  }
}

async function submitLogin(): Promise<void> {
  try {
    setLoading(true, "正在校验身份...");
    await api<{ ok: true; displayName: string }>("/login", {
      method: "POST",
      body: {
        displayName: state.drafts.loginName,
        accessCode: state.drafts.accessCode,
      },
    });
    state.drafts.loginName = "";
    state.drafts.accessCode = "";
    await loadOverview("欢迎回来。");
  } catch (error) {
    showError(error);
    state.mode = "login";
    renderApp();
  } finally {
    setLoading(false);
  }
}

async function submitCreateTopic(): Promise<void> {
  const name = state.drafts.topicName.trim();
  if (!name) {
    setStatus("请输入专题名称。", "danger");
    renderApp();
    return;
  }
  try {
    setLoading(true, "正在创建专题...");
    const detail = await api<TopicDetail>("/topic", {
      method: "POST",
      body: { name, analysisKeywords: state.drafts.createKeywords },
    });
    state.drafts.topicName = "";
    state.drafts.createKeywords = "";
    setStatus("专题已创建，成果目录和分析关键词已准备好。", "success");
    await openTopic(detail.topic.prefix, "agent");
  } catch (error) {
    showError(error);
    renderApp();
  } finally {
    setLoading(false);
  }
}

async function submitTopicSettings(): Promise<void> {
  if (!state.topic) {
    return;
  }
  try {
    setLoading(true, "正在保存专题设置...");
    state.topic = await api<TopicDetail>("/topic", {
      method: "PUT",
      body: {
        prefix: state.topic.topic.prefix,
        analysisKeywords: state.drafts.settingsKeywords,
      },
    });
    state.drafts.settingsKeywords = state.topic.topic.analysisKeywords;
    setStatus("专题设置已保存。", "success");
    renderApp();
  } catch (error) {
    showError(error);
    renderApp();
  } finally {
    setLoading(false);
  }
}

async function loadOverview(successMessage = ""): Promise<void> {
  const signal = beginRequest("overview");
  cancelRequest("topic");
  cancelRequest("materials");
  closePreview(false);
  try {
    state.mode = "overview";
    state.loading = true;
    state.topic = null;
    state.materialList = null;
    state.materialPrefix = "";
    renderApp();
    const overview = await api<DriveOverview>("/overview", { signal });
    if (signal.aborted) {
      return;
    }
    state.overview = overview;
    state.loading = false;
    setStatus(successMessage || overviewStatus(overview), successMessage ? "success" : "neutral");
    renderApp();
  } catch (error) {
    if (isAbort(error)) {
      return;
    }
    state.loading = false;
    if (isUnauthorized(error)) {
      state.mode = "login";
      setStatus("请输入姓名和访问码后继续。");
    } else {
      showError(error);
      state.mode = "login";
    }
    renderApp();
  }
}

async function openTopic(prefix: string, tab: TopicTab = "outputs"): Promise<void> {
  const signal = beginRequest("topic");
  cancelRequest("materials");
  closePreview(false);
  try {
    state.mode = "topic";
    state.activeTab = tab;
    state.loading = true;
    state.materialPrefix = prefix;
    renderApp();
    const [topic, materialList] = await Promise.all([
      api<TopicDetail>(`/topic?${new URLSearchParams({ prefix }).toString()}`, { signal }),
      listAllDirectory(prefix, signal),
    ]);
    if (signal.aborted) {
      return;
    }
    state.topic = topic;
    state.materialList = materialList;
    state.materialPrefix = materialList.prefix;
    state.drafts.settingsKeywords = topic.topic.analysisKeywords;
    state.loading = false;
    setStatus("专题成果和资料已更新。");
    renderApp();
  } catch (error) {
    if (isAbort(error)) {
      return;
    }
    state.loading = false;
    showError(error);
    renderApp();
  }
}

async function loadMaterialDirectory(prefix: string): Promise<void> {
  const signal = beginRequest("materials");
  closePreview(false);
  try {
    state.materialPrefix = prefix;
    state.materialList = null;
    state.activeTab = "materials";
    renderApp();
    const listing = await listAllDirectory(prefix, signal);
    if (signal.aborted) {
      return;
    }
    state.materialList = listing;
    state.materialPrefix = listing.prefix;
    setStatus("资料目录已更新。");
    renderApp();
  } catch (error) {
    if (isAbort(error)) {
      return;
    }
    showError(error);
    renderApp();
  }
}

async function listAllDirectory(prefix: string, signal?: AbortSignal): Promise<DriveListResult> {
  const folders = new Map<string, DriveFolder>();
  const files = new Map<string, DriveFile>();
  let cursor: string | null = null;
  do {
    const query = new URLSearchParams({ prefix });
    if (cursor) {
      query.set("cursor", cursor);
    }
    const page = await api<DriveListResult>(`/list?${query.toString()}`, { signal });
    page.folders.forEach((folder) => folders.set(folder.path, folder));
    page.files.forEach((file) => files.set(file.path, file));
    cursor = page.nextCursor;
  } while (cursor && !signal?.aborted);
  return { prefix, folders: [...folders.values()], files: [...files.values()], nextCursor: null };
}

function setActiveTab(tab: TopicTab): void {
  if (!["outputs", "materials", "agent", "settings"].includes(tab)) {
    return;
  }
  closePreview(false);
  state.activeTab = tab;
  renderApp();
}

async function refreshCurrent(): Promise<void> {
  if (state.mode === "topic" && state.topic) {
    if (state.activeTab === "materials") {
      await loadMaterialDirectory(state.materialPrefix || state.topic.topic.prefix);
    } else {
      await openTopic(state.topic.topic.prefix, state.activeTab);
    }
  } else {
    await loadOverview();
  }
}

async function logout(): Promise<void> {
  await api("/logout", { method: "POST" }).catch(() => null);
  requestControllers.forEach((controller) => controller.abort());
  closePreview(false);
  state.mode = "login";
  state.overview = null;
  state.topic = null;
  setStatus("已退出登录。");
  renderApp();
}

function showCreateTopic(): void {
  closePreview(false);
  state.mode = "create";
  state.topic = null;
  state.materialList = null;
  setStatus("填写专题名称和分析关键词，系统会创建成果目录。");
  renderApp();
  queueMicrotask(() => document.querySelector<HTMLInputElement>('[name="topicName"]')?.focus());
}

async function copyAgentManifest(): Promise<void> {
  if (!state.topic) {
    return;
  }
  try {
    state.busyAction = "agent-manifest";
    setStatus("正在生成 agent 分析提示词...");
    renderApp();
    const data = await api<{ prompt: string; fileCount: number; expiresIn: number }>("/agent-manifest", {
      method: "POST",
      body: { prefix: state.topic.topic.prefix },
    });
    await writeClipboard(data.prompt);
    setStatus(`分析提示词已复制。资料 ${data.fileCount || 0} 个，链接 ${data.expiresIn || 0} 秒内有效。`, "success");
  } catch (error) {
    showError(error);
  } finally {
    state.busyAction = null;
    renderApp();
  }
}

async function copyAgentOutputTask(): Promise<void> {
  if (!state.topic) {
    return;
  }
  try {
    state.busyAction = "agent-output-task";
    setStatus("正在生成成果回传授权...");
    renderApp();
    const data = await api<{ prompt: string; expiresIn: number; paths: string[] }>("/agent-output-task", {
      method: "POST",
      body: { prefix: state.topic.topic.prefix },
    });
    await writeClipboard(data.prompt);
    setStatus(`成果生成与回传提示词已复制。授权 ${data.expiresIn || 0} 秒内有效。`, "success");
  } catch (error) {
    showError(error);
  } finally {
    state.busyAction = null;
    renderApp();
  }
}

async function copySignedLink(path: string): Promise<void> {
  try {
    const data = await signedDownload(path);
    await writeClipboard(data.url);
    setStatus("短时成果链接已复制。", "success");
  } catch (error) {
    showError(error);
  }
  renderApp();
}

async function downloadFile(path: string): Promise<void> {
  try {
    const data = await signedDownload(path);
    window.location.href = data.url;
  } catch (error) {
    showError(error);
    renderApp();
  }
}

async function openPreview(path: string, trigger: HTMLElement): Promise<void> {
  const file = findFileByPath(path);
  if (!file) {
    setStatus("找不到要预览的文件。", "danger");
    renderApp();
    return;
  }
  const kind = previewKindForFile(file);
  if (kind === "none") {
    await downloadFile(path);
    return;
  }
  if (kind === "pdf" && state.preview?.kind === "pdf" && state.preview.file.path === path) {
    closePreview();
    return;
  }

  const version = ++previewVersion;
  previewReturnFocus = trigger;
  state.preview = { file, kind, title: file.name, loading: true, failed: false };
  renderApp();

  try {
    const data = await signedDownload(path);
    if (version !== previewVersion) {
      return;
    }
    if (kind === "pdf") {
      await import("./pdf-preview");
      if (version !== previewVersion) {
        return;
      }
      state.preview = { file, kind, title: file.name, url: data.url, loading: false, failed: false };
    } else if (kind === "markdown" || kind === "text") {
      const response = await fetch(data.url);
      if (!response.ok) {
        throw new Error(`预览读取失败：${response.status}`);
      }
      const text = await response.text();
      const rawHtml = kind === "markdown" ? markdown.render(text) : `<pre>${escapeHtml(text)}</pre>`;
      if (version !== previewVersion) {
        return;
      }
      state.preview = {
        file,
        kind,
        title: file.name,
        renderedHtml: DOMPurify.sanitize(rawHtml),
        loading: false,
        failed: false,
      };
    } else {
      state.preview = { file, kind, title: file.name, url: data.url, loading: false, failed: false };
    }
    renderApp();
  } catch (error) {
    if (version !== previewVersion) {
      return;
    }
    showError(error);
    state.preview = { file, kind, title: file.name, loading: false, failed: true };
    renderApp();
  }
}

function closePreview(restoreFocus = true): void {
  previewVersion += 1;
  const focusTarget = restoreFocus ? previewReturnFocus : null;
  state.preview = null;
  previewReturnFocus = null;
  renderApp();
  if (focusTarget?.isConnected) {
    queueMicrotask(() => focusTarget.focus());
  }
}

function openDelete(target: AppState["pendingDelete"]): void {
  state.pendingDelete = target;
  state.deleteConfirmText = "";
  renderApp();
  queueMicrotask(() => document.querySelector<HTMLInputElement>("[data-delete-confirm-input]")?.focus());
}

function closeDeleteDialog(): void {
  state.pendingDelete = null;
  state.deleteConfirmText = "";
  renderApp();
}

async function confirmDelete(): Promise<void> {
  const target = state.pendingDelete;
  if (!target || state.deleteConfirmText !== target.name) {
    return;
  }
  closeDeleteDialog();
  try {
    if (target.type === "topic") {
      setStatus("正在删除专题...");
      const result = await api<{ deletedCount: number }>("/topic", {
        method: "DELETE",
        body: { prefix: target.prefix, confirmName: target.name },
      });
      setStatus(`专题已删除，共删除 ${result.deletedCount || 0} 个对象。`, "success");
      await loadOverview();
    } else if (target.path && state.topic) {
      await api("/object", { method: "DELETE", body: { path: target.path } });
      const refresh = shouldRefreshAfterMutation(state.activeTab, target.path, state.topic.topic.prefix);
      setStatus("文件已删除。", "success");
      if (refresh === "topic") {
        await openTopic(state.topic.topic.prefix, state.activeTab);
      } else {
        await loadMaterialDirectory(state.materialPrefix);
      }
    }
  } catch (error) {
    showError(error);
    renderApp();
  }
}

async function uploadFiles(files: File[], relativePathForFile: (file: File) => string): Promise<void> {
  if (!files.length || !state.topic) {
    return;
  }
  const topicPrefix = state.topic.topic.prefix;
  const targetPrefix = state.activeTab === "materials" ? state.materialPrefix || topicPrefix : topicPrefix;
  const entries = files.map((file) => ({ file, relativePath: normalizeClientRelativePath(relativePathForFile(file)) }));
  let uppy: Uppy<UppyMeta, UppyBody> | null = null;

  try {
    const conflicts = await findUploadConflicts(entries, targetPrefix);
    if (conflicts.length && !window.confirm(`将覆盖 ${conflicts.length} 个同路径同名文件。是否继续上传？`)) {
      return;
    }
    state.upload = { active: true, name: "准备上传...", percent: 0, total: entries.length };
    renderApp();

    const signedUploads = new Map<string, PresignedUpload>();
    const completed: Promise<UploadCompleteResponse>[] = [];
    uppy = new Uppy<UppyMeta, UppyBody>({ autoProceed: false });
    uppy.use(XHRUpload, {
      endpoint: async (fileOrBundle: unknown) => {
        const file = (Array.isArray(fileOrBundle) ? fileOrBundle[0] : fileOrBundle) as DriveUppyFile;
        const relativePath = String(file.meta.relativePath || file.name);
        const fileData = file.data as Blob | undefined;
        const upload = await api<PresignedUpload>("/upload-url", {
          method: "POST",
          body: {
            prefix: targetPrefix,
            filename: file.name,
            relativePath,
            size: fileData?.size || 0,
            contentType: file.type || "application/octet-stream",
          },
        });
        signedUploads.set(file.id, upload);
        return upload.url;
      },
      method: "PUT",
      formData: false,
      limit: 3,
      headers: (file: DriveUppyFile) => ({ "content-type": file.type || "application/octet-stream" }),
      getResponseData: () => ({}),
    });

    uppy.on("upload-progress", (file, progress) => {
      if (!file || !progress.bytesTotal) {
        return;
      }
      state.upload = {
        active: true,
        name: String(file.meta.relativePath || file.name),
        percent: Math.round((progress.bytesUploaded / progress.bytesTotal) * 100),
        total: entries.length,
      };
      renderApp();
    });
    uppy.on("upload-success", (file) => {
      if (!file) {
        return;
      }
      const upload = signedUploads.get(file.id);
      if (!upload) {
        return;
      }
      const fileData = file.data as Blob | undefined;
      completed.push(
        api<UploadCompleteResponse>("/upload-complete", {
          method: "POST",
          body: {
            path: upload.path,
            size: fileData?.size || 0,
            contentType: upload.contentType,
            kind: upload.path.startsWith(`${topicPrefix}outputs/`) ? "output" : "material",
          },
        }),
      );
    });

    entries.forEach((entry) => {
      uppy?.addFile({
        name: entry.file.name,
        type: entry.file.type || "application/octet-stream",
        data: entry.file,
        meta: { relativePath: entry.relativePath },
      });
    });
    const result = await uppy.upload();
    await Promise.all(completed);
    if (result?.failed?.length) {
      throw new Error(`${result.failed.length} 个文件上传失败。`);
    }
    state.upload = { active: false, name: "", percent: 0, total: 0 };
    setStatus(`上传完成，已登记 ${entries.length} 个文件。`, "success");
    const currentTopicPrefix = state.topic?.topic.prefix;
    const currentMaterialPrefix = state.materialPrefix || currentTopicPrefix;
    if (currentTopicPrefix === topicPrefix && state.activeTab === "materials" && currentMaterialPrefix === targetPrefix) {
      await loadMaterialDirectory(targetPrefix);
    } else {
      renderApp();
    }
  } catch (error) {
    state.upload = { active: false, name: "", percent: 0, total: 0 };
    showError(error);
    renderApp();
  } finally {
    uppy?.destroy();
  }
}

async function findUploadConflicts(entries: Array<{ relativePath: string }>, targetPrefix: string): Promise<Array<{ relativePath: string }>> {
  const directories = Array.from(new Set(entries.map((entry) => directoryPrefix(entry.relativePath))));
  const existingByDirectory = new Map<string, Set<string>>();
  await Promise.all(
    directories.map(async (directory) => {
      try {
        const data = await listAllDirectory(`${targetPrefix}${directory}`);
        existingByDirectory.set(directory, new Set(data.files.map((file) => file.name)));
      } catch {
        existingByDirectory.set(directory, new Set());
      }
    }),
  );
  return entries.filter((entry) => existingByDirectory.get(directoryPrefix(entry.relativePath))?.has(fileNameFromPath(entry.relativePath)));
}

async function signedDownload(path: string): Promise<{ url: string; path: string }> {
  return api<{ url: string; path: string }>("/download-url", { method: "POST", body: { path } });
}

async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const init: RequestInit = {
    method: options.method || "GET",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    signal: options.signal,
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  const response = await fetch(`${apiBase}${path}`, init);
  const data = (await response.json().catch(() => ({}))) as { error?: unknown };
  if (!response.ok) {
    const error = new Error(typeof data.error === "string" ? data.error : "请求失败") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data as T;
}

function beginRequest(key: RequestKey): AbortSignal {
  cancelRequest(key);
  const controller = new AbortController();
  requestControllers.set(key, controller);
  return controller.signal;
}

function cancelRequest(key: RequestKey): void {
  requestControllers.get(key)?.abort();
  requestControllers.delete(key);
}

function renderApp(): void {
  render(
    html`
      <div class="drive-workspace">
        ${renderTopbar()}
        <main class="drive-main" aria-live="polite">
          ${renderStatus()}
          ${state.mode === "login" ? renderLogin() : nothing}
          ${state.mode === "overview" ? renderOverview() : nothing}
          ${state.mode === "create" ? renderCreateTopic() : nothing}
          ${state.mode === "topic" ? renderTopic() : nothing}
        </main>
        ${renderPreviewDrawer()} ${renderDeleteDialogMarkup()}
      </div>
    `,
    root,
  );
}

function renderTopbar(): TemplateResult {
  return html`
    <header class=${classMap({ "drive-topbar": true, "is-authenticated": state.mode !== "login" })}>
      <div class="drive-brand-actions">
        <a class="drive-brand" href="/drive" aria-label="返回嘉合杉升专题资料库">
          <img src="./assets/jhss-logo-cropped.png" alt="" aria-hidden="true" width="400" height="501" />
          <span>嘉合杉升专题资料库</span>
        </a>
        ${state.mode !== "login" ? controlButton("退出登录", "ph-sign-out", "logout", false, "", "drive-logout-button") : nothing}
      </div>
      <nav class="drive-nav" aria-label="专题资料库导航"><a href="./index.html">返回首页</a></nav>
    </header>
  `;
}

function renderStatus(): TemplateResult | typeof nothing {
  if (!state.status && !state.upload.active && !state.loading) {
    return nothing;
  }
  return html`
    <section class="drive-system-row" aria-live="polite">
      <div
        class=${classMap({
          "drive-status-line": true,
          "is-danger": state.statusTone === "danger",
          "is-success": state.statusTone === "success",
        })}
      >
        <i class=${`ph ${state.loading ? "ph-circle-notch drive-spin" : "ph-info"}`} aria-hidden="true"></i>
        <span>${state.status || "正在处理..."}</span>
      </div>
      ${renderUploadProgress()}
    </section>
  `;
}

function renderLogin(): TemplateResult {
  return html`
    <section class="drive-login-panel" aria-labelledby="drive-login-title">
      <div><h1 id="drive-login-title">专题资料库</h1></div>
      <form class="drive-form drive-login-card" data-login-form>
        <label class="drive-field">
          <span>登录姓名</span>
          <input data-draft="loginName" name="displayName" type="text" autocomplete="name" .value=${state.drafts.loginName} required />
          <small>上传和设置记录会显示该姓名。</small>
        </label>
        <label class="drive-field">
          <span>访问码</span>
          <input data-draft="accessCode" name="accessCode" type="password" autocomplete="current-password" .value=${state.drafts.accessCode} required />
          <small>登录态会定时失效，请勿在公共设备保存访问码。</small>
        </label>
        <button class="drive-control drive-control-primary" type="submit" ?disabled=${state.loading}>
          <i class="ph ph-arrow-right" aria-hidden="true"></i>进入资料库
        </button>
      </form>
    </section>
  `;
}

function renderOverview(): TemplateResult {
  if (state.loading && !state.overview) {
    return renderOverviewSkeleton();
  }
  const topics = state.overview?.topics || [];
  const totalOutputs = topics.reduce((sum, topic) => sum + topic.outputCount, 0);
  const emptyTopics = topics.filter((topic) => topic.outputCount === 0).length;
  const latest = topics.flatMap((topic) => (topic.latestOutput ? [{ topic, output: topic.latestOutput }] : [])).slice(0, 5);
  return html`
    <section class="drive-dashboard">
      <div class="drive-page-head">
        <div><h1>专题资料库</h1></div>
        <div class="drive-head-actions">
          ${controlButton("刷新", "ph-arrow-clockwise", "refresh")}
          ${controlButton("新建专题", "ph-folder-plus", "create-view", true)}
        </div>
      </div>
      <div class="drive-metrics" aria-label="专题资料库概览">
        ${metricCard("专题", String(topics.length), "已建专题数")}
        ${metricCard("成果", String(totalOutputs), "成果文件数")}
        ${metricCard("待交付", String(emptyTopics), "无成果的专题数")}
      </div>
      <div class="drive-two-column">
        <section class="drive-panel">
          <div class="drive-panel-head"><h2>最近成果</h2><span>${latest.length ? "可预览或复制短时链接" : "暂无成果"}</span></div>
          ${latest.length
            ? repeat(latest, ({ output }) => output.path, ({ topic, output }) => renderLatestOutput(topic, output))
            : renderEmpty("ph-tray", "还没有可交付成果", "")}
        </section>
        <section class="drive-panel">
          <div class="drive-panel-head"><h2>专题队列</h2><span>${topics.length ? "按最近交付排序" : "等待创建"}</span></div>
          ${topics.length
            ? repeat(topics, (topic) => topic.prefix, renderTopicCard)
            : renderEmpty("ph-folder-plus", "还没有专题", "创建第一个专题后，系统会准备成果目录。")}
        </section>
      </div>
    </section>
  `;
}

function renderCreateTopic(): TemplateResult {
  return html`
    <section class="drive-create-layout">
      <div class="drive-page-head"><div><h1>创建专题</h1></div>${controlButton("返回", "ph-arrow-left", "back-overview")}</div>
      <form class="drive-form drive-create-card" data-create-form>
        <label class="drive-field">
          <span>专题名称</span>
          <input data-draft="topicName" name="topicName" type="text" autocomplete="off" .value=${state.drafts.topicName} required />
        </label>
        <label class="drive-field">
          <span>分析关键词</span>
          <textarea data-draft="createKeywords" name="analysisKeywords" rows="6" placeholder="填写关注主题、分析维度、资料口径等，可使用多行文本。" .value=${state.drafts.createKeywords} required></textarea>
        </label>
        <div class="drive-form-actions">
          <button class="drive-control" type="button" data-action="cancel-create">取消</button>
          <button class="drive-control drive-control-primary" type="submit" ?disabled=${state.loading}>
            <i class="ph ph-check" aria-hidden="true"></i>创建专题
          </button>
        </div>
      </form>
    </section>
  `;
}

function renderTopic(): TemplateResult {
  if (state.loading || !state.topic) {
    return renderTopicSkeleton();
  }
  const topic = state.topic.topic;
  return html`
    <section class="drive-topic-workbench">
      <div class="drive-topic-headline">
        <button class="drive-link-button" type="button" data-action="back-overview"><i class="ph ph-arrow-left" aria-hidden="true"></i>成果概览</button>
        <div class="drive-topic-title-row">
          <div><h1>${topic.name}</h1><p>${topic.analysisKeywords || "尚未填写分析关键词。"}</p></div>
          <div class="drive-topic-meta">
            <span>创建人 ${topic.createdBy || "-"}</span><span>更新 ${formatDate(topic.updatedAt)}</span><span>${topic.prefix}</span>
          </div>
        </div>
      </div>
      <div class="drive-tabs" role="tablist" aria-label="专题工作区">
        ${tabButton("outputs", "成果", "ph-package")}${tabButton("materials", "资料", "ph-files")}${tabButton("agent", "Agent", "ph-terminal-window")}${tabButton("settings", "设置", "ph-sliders-horizontal")}
      </div>
      ${state.activeTab === "outputs" ? renderOutputsTab() : nothing}
      ${state.activeTab === "materials" ? renderMaterialsTab() : nothing}
      ${state.activeTab === "agent" ? renderAgentTab() : nothing}
      ${state.activeTab === "settings" ? renderSettingsTab() : nothing}
    </section>
  `;
}

function renderOutputsTab(): TemplateResult {
  const outputs = sortFilesByFreshness(state.topic?.outputs || []);
  return html`
    <section class="drive-tab-panel" role="tabpanel" aria-label="成果">
      <div class="drive-panel-head"><h2>专题成果</h2><span>${outputs.length} 个文件</span></div>
      ${outputs.length
        ? renderFileTable(outputs, { outputMode: true, empty: "" })
        : renderEmpty("ph-package", "这个专题还没有成果", "依次执行 Agent 两个阶段，确认最终口径后回传 PDF。")}
    </section>
  `;
}

function renderMaterialsTab(): TemplateResult {
  const listing = state.materialList;
  const topicPrefix = state.topic?.topic.prefix || "";
  const folders = listing?.folders.filter((folder) => folder.name !== "outputs") || [];
  const files = visibleMaterialFiles(listing?.files || []);
  return html`
    <section class="drive-tab-panel" role="tabpanel" aria-label="资料">
      <div class="drive-material-toolbar">
        <div><h2>资料库</h2>${renderBreadcrumbs(state.materialPrefix || topicPrefix)}</div>
        <div class="drive-upload-actions">
          <label class="drive-control drive-control-primary drive-upload-trigger">
            <i class="ph ph-upload-simple" aria-hidden="true"></i>上传文件<input data-file-input type="file" multiple />
          </label>
          <label class="drive-control drive-upload-trigger">
            <i class="ph ph-folder-simple-plus" aria-hidden="true"></i>上传文件夹<input data-folder-input type="file" webkitdirectory multiple />
          </label>
        </div>
      </div>
      ${listing ? html`${renderFolderList(folders)}${renderFileTable(files, { outputMode: false, empty: "当前目录没有资料。" })}` : renderInlineSkeleton()}
    </section>
  `;
}

function renderAgentTab(): TemplateResult {
  const hasKeywords = Boolean(state.topic?.topic.analysisKeywords.trim());
  return html`
    <section class="drive-tab-panel" role="tabpanel" aria-label="Agent">
      ${hasKeywords
        ? nothing
        : html`<wa-callout class="drive-agent-callout" variant="warning"><i class="ph ph-warning" slot="icon" aria-hidden="true"></i>请先在设置中填写分析关键词，再执行 Agent 流程。</wa-callout>`}
      <div class="drive-agent-grid">
        <div class="drive-agent-card">
          <h2>1. 获取资料并分析</h2>
          <p>复制后交给本地 Agent。它会读取短时资料链接，并只按分析关键词完成结构化分析，不生成文件。</p>
          <button class="drive-control drive-control-primary" type="button" data-action="agent-manifest" ?disabled=${!hasKeywords || state.busyAction !== null}>
            <i class="ph ph-clipboard-text" aria-hidden="true"></i>${state.busyAction === "agent-manifest" ? "正在生成..." : "复制第一阶段提示词"}
          </button>
        </div>
        <div class="drive-agent-card">
          <h2>2. 转换格式并回传</h2>
          <p>请先在同一会话中校正判断并确认最终口径。第二阶段只转换为 PDF，并使用无 Cookie 的短时授权回传。</p>
          <button class="drive-control drive-control-primary" type="button" data-action="agent-output-task" ?disabled=${!hasKeywords || state.busyAction !== null}>
            <i class="ph ph-file-arrow-up" aria-hidden="true"></i>${state.busyAction === "agent-output-task" ? "正在生成..." : "复制第二阶段提示词"}
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderSettingsTab(): TemplateResult | typeof nothing {
  if (!state.topic) {
    return nothing;
  }
  return html`
    <section class="drive-tab-panel" role="tabpanel" aria-label="设置">
      <form class="drive-form drive-settings-form" data-settings-form>
        <label class="drive-field">
          <span>分析关键词</span>
          <textarea data-draft="settingsKeywords" name="analysisKeywords" rows="6" .value=${state.drafts.settingsKeywords} required></textarea>
        </label>
        <div class="drive-form-actions">
          <button class="drive-control drive-control-primary" type="submit" ?disabled=${state.loading}><i class="ph ph-floppy-disk" aria-hidden="true"></i>保存设置</button>
          <button class="drive-control drive-control-danger" type="button" data-action="delete-topic"><i class="ph ph-trash" aria-hidden="true"></i>删除专题</button>
        </div>
      </form>
    </section>
  `;
}

function renderLatestOutput(topic: DriveOverviewTopic, output: NonNullable<DriveOverviewTopic["latestOutput"]>): TemplateResult {
  return html`
    <div class="drive-output-item">
      <article class="drive-output-card">
        <div class="drive-file-symbol"><i class=${`ph ${fileIconName(output)}`} aria-hidden="true"></i></div>
        <div class="drive-output-main">
          <button class="drive-title-button" type="button" data-action="open-topic" data-prefix=${topic.prefix}>${output.name}</button>
          <p>${topic.name} · ${formatDate(output.uploadedAt || output.lastModified)} · ${formatBytes(output.size || 0)}</p>
        </div>
        <div class="drive-row-actions">
          ${canPreview(output) ? actionButton("预览", "preview", output.path) : nothing}${actionButton("链接", "copy-link", output.path)}${actionButton("下载", "download", output.path)}
        </div>
      </article>
      ${renderInlinePdf(output.path)}
    </div>
  `;
}

function renderTopicCard(topic: DriveOverviewTopic): TemplateResult {
  return html`
    <article class="drive-topic-card">
      <div><button class="drive-title-button" type="button" data-action="open-topic" data-prefix=${topic.prefix}>${topic.name}</button><p>${topic.analysisKeywords || "尚未填写分析关键词。"}</p></div>
      <div class="drive-topic-card-meta"><span>${topic.outputCount} 个成果</span><span>更新 ${formatDateOnly(topic.updatedAt)}</span></div>
    </article>
  `;
}

function renderFileTable(files: DriveFile[], options: { outputMode: boolean; empty: string }): TemplateResult | typeof nothing {
  if (!files.length) {
    return options.empty ? renderEmpty("ph-files", options.empty, "") : nothing;
  }
  return html`
    <div class="drive-file-table" role="table">
      <div class="drive-file-row drive-file-row-head" role="row"><span>名称</span><span>类型</span><span>上传者</span><span>更新</span><span>操作</span></div>
      ${repeat(
        files,
        (file) => file.path,
        (file) => html`${renderFileRow(file, options.outputMode)}${renderInlinePdf(file.path, true)}`,
      )}
    </div>
  `;
}

function renderFileRow(file: DriveFile, outputMode: boolean): TemplateResult {
  return html`
    <div class="drive-file-row" role="row">
      <span class="drive-file-name" data-label="名称"><i class=${`ph ${fileIconName(file)}`} aria-hidden="true"></i><span>${file.name}</span></span>
      <span data-label="类型">${fileKindLabel(file)}</span>
      <span data-label="上传者">${file.uploadedBy || "-"}</span>
      <span data-label="更新">${formatDate(file.uploadedAt || file.lastModified)}</span>
      <span class="drive-row-actions" data-label="操作">
        ${canPreview(file) ? actionButton("预览", "preview", file.path) : nothing}${outputMode ? actionButton("链接", "copy-link", file.path) : nothing}${actionButton("下载", "download", file.path)}${actionButton("删除", "delete-file", file.path, file.name, true)}
      </span>
    </div>
  `;
}

function renderInlinePdf(path: string, tableRow = false): TemplateResult | typeof nothing {
  const preview = state.preview;
  if (!preview || preview.kind !== "pdf" || preview.file.path !== path) {
    return nothing;
  }
  const body = preview.loading
    ? renderInlineSkeleton()
    : preview.failed || !preview.url
      ? renderEmpty("ph-eye-slash", "无法预览", "请下载文件后查看。")
      : html`<drive-pdf-preview .url=${preview.url} .title=${preview.title}></drive-pdf-preview>`;
  return html`<div class=${classMap({ "drive-inline-preview": true, "is-table-row": tableRow })}>${body}</div>`;
}

function renderFolderList(folders: DriveFolder[]): TemplateResult | typeof nothing {
  if (!folders.length) {
    return nothing;
  }
  return html`
    <div class="drive-folder-grid">
      ${repeat(
        folders,
        (folder) => folder.path,
        (folder) => html`<button class="drive-folder-tile" type="button" data-action="open-folder" data-path=${folder.path}><i class="ph ph-folder" aria-hidden="true"></i><span>${folder.name}</span></button>`,
      )}
    </div>
  `;
}

function renderBreadcrumbs(prefix: string): TemplateResult {
  const topicPrefix = state.topic?.topic.prefix || "";
  const segments = prefix.split("/").filter(Boolean);
  const parts: Array<{ label: string; path: string }> = [{ label: state.topic?.topic.name || "专题", path: topicPrefix }];
  let current = "";
  segments.forEach((segment) => {
    current += `${segment}/`;
    if (current !== topicPrefix) {
      parts.push({ label: segment, path: current });
    }
  });
  return html`
    <nav class="drive-breadcrumbs" aria-label="当前资料目录">
      ${parts.map((part, index) => html`${index ? html`<span>/</span>` : nothing}<button type="button" data-action="open-folder" data-path=${part.path}>${part.label}</button>`)}
    </nav>
  `;
}

function renderPreviewDrawer(): TemplateResult | typeof nothing {
  const preview = state.preview;
  if (!preview || preview.kind === "pdf") {
    return nothing;
  }
  const body = preview.loading
    ? renderInlineSkeleton()
    : preview.failed
      ? renderEmpty("ph-eye-slash", "无法预览", "请下载文件后查看。")
      : preview.renderedHtml
        ? html`<article class="drive-preview-markdown">${unsafeHTML(preview.renderedHtml)}</article>`
        : preview.url
          ? html`<iframe class="drive-preview-frame" src=${preview.url} title=${preview.title} sandbox referrerpolicy="no-referrer"></iframe>`
          : renderEmpty("ph-eye-slash", "无法预览", "请下载文件后查看。");
  return html`
    <wa-drawer data-preview-drawer open placement="end" label=${preview.title} style="--size: min(980px, 94vw);">
      <div class="drive-preview-body">${body}</div>
      <div slot="footer" class="drive-drawer-footer">${controlButton("复制链接", "ph-link", "copy-link", false, preview.file.path)}${controlButton("下载", "ph-download-simple", "download", true, preview.file.path)}</div>
    </wa-drawer>
  `;
}

function renderDeleteDialogMarkup(): TemplateResult | typeof nothing {
  if (!state.pendingDelete) {
    return nothing;
  }
  const target = state.pendingDelete;
  const title = target.type === "topic" ? "确认删除专题" : "确认删除文件";
  const message = target.type === "topic"
    ? `将永久删除专题「${target.name}」及其全部资料、提示词、成果和临时 manifest。此操作不可恢复。`
    : `将永久删除「${target.name}」。此操作不会删除其他文件，但无法从资料库恢复。`;
  return html`
    <wa-dialog data-delete-dialog open label=${title} style="--width: min(520px, 94vw);">
      <div class="drive-delete-body">
        <p>${message}</p>
        <label class="drive-field"><span>请输入完整${target.type === "topic" ? "专题名" : "文件名"}以确认删除</span><input data-delete-confirm-input type="text" autocomplete="off" .value=${state.deleteConfirmText} /></label>
      </div>
      <div slot="footer" class="drive-dialog-actions">
        <button class="drive-control" type="button" data-action="cancel-delete">取消</button>
        <button class="drive-control drive-control-danger" type="button" data-action="confirm-delete" ?disabled=${state.deleteConfirmText !== target.name}>永久删除</button>
      </div>
    </wa-dialog>
  `;
}

function renderUploadProgress(): TemplateResult | typeof nothing {
  if (!state.upload.active) {
    return nothing;
  }
  return html`
    <div class="drive-upload-progress"><div><strong>${state.upload.name}</strong><span>${state.upload.percent}% · ${state.upload.total} 个文件</span></div><wa-progress-bar .value=${state.upload.percent}></wa-progress-bar></div>
  `;
}

function renderOverviewSkeleton(): TemplateResult {
  return html`<section class="drive-dashboard">${renderPageHeadSkeleton()}<div class="drive-metrics">${[1, 2, 3].map(() => html`<div class="drive-skeleton drive-skeleton-metric"></div>`)}</div><div class="drive-two-column">${[1, 2].map(() => html`<div class="drive-skeleton drive-skeleton-panel"></div>`)}</div></section>`;
}

function renderTopicSkeleton(): TemplateResult {
  return html`<section class="drive-topic-workbench"><div class="drive-skeleton drive-skeleton-title"></div><div class="drive-skeleton drive-skeleton-tabs"></div><div class="drive-skeleton drive-skeleton-panel"></div></section>`;
}

function renderPageHeadSkeleton(): TemplateResult {
  return html`<div class="drive-page-head"><div class="drive-skeleton drive-skeleton-title"></div><div class="drive-skeleton drive-skeleton-button"></div></div>`;
}

function renderInlineSkeleton(): TemplateResult {
  return html`<div class="drive-inline-skeleton" aria-hidden="true"><span></span><span></span><span></span></div>`;
}

function renderEmpty(icon: string, title: string, body: string): TemplateResult {
  return html`<div class="drive-empty"><i class=${`ph ${icon}`} aria-hidden="true"></i><h3>${title}</h3>${body ? html`<p>${body}</p>` : nothing}</div>`;
}

function metricCard(label: string, value: string, detail: string): TemplateResult {
  return html`<article class="drive-metric"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`;
}

function tabButton(tab: TopicTab, label: string, icon: string): TemplateResult {
  const active = state.activeTab === tab;
  return html`<button class=${classMap({ "drive-tab": true, "is-active": active })} type="button" role="tab" aria-selected=${String(active)} tabindex=${active ? "0" : "-1"} data-action="tab" data-tab=${tab}><i class=${`ph ${icon}`} aria-hidden="true"></i>${label}</button>`;
}

function controlButton(label: string, icon: string, action: string, primary = false, path = "", extraClass = ""): TemplateResult {
  return html`<button class=${`drive-control ${primary ? "drive-control-primary" : ""} ${extraClass}`} type="button" data-action=${action} data-path=${path}><i class=${`ph ${icon}`} aria-hidden="true"></i>${label}</button>`;
}

function actionButton(label: string, action: string, path: string, name = "", danger = false): TemplateResult {
  return html`<button class=${classMap({ "drive-table-action": true, "is-danger": danger })} type="button" data-action=${action} data-path=${path} data-name=${name}>${label}</button>`;
}

function setStatus(message: string, tone: AppState["statusTone"] = "neutral"): void {
  state.status = message;
  state.statusTone = tone;
}

function setLoading(value: boolean, message = ""): void {
  state.loading = value;
  if (message) {
    setStatus(message);
  }
  renderApp();
}

function showError(error: unknown): void {
  setStatus(error instanceof Error ? error.message : "请求失败", "danger");
}

function overviewStatus(overview: DriveOverview): string {
  if (!overview.topics.length) {
    return "还没有专题。";
  }
  const outputCount = overview.topics.reduce((sum, topic) => sum + topic.outputCount, 0);
  return `已加载 ${overview.topics.length} 个专题，${outputCount} 个成果。`;
}

function findFileByPath(path: string): DriveFile | undefined {
  const outputs = state.topic?.outputs || [];
  const materials = state.materialList?.files || [];
  const overviewOutputs = (state.overview?.topics || []).flatMap((topic) => topic.latestOutput ? [topic.latestOutput] : []);
  return [...outputs, ...materials, ...overviewOutputs].find((file) => file.path === path);
}

function isUnauthorized(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "status" in error && (error as { status?: number }).status === 401);
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function writeClipboard(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
