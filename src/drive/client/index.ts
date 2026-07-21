import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "./drive.css";

import Uppy from "@uppy/core";
import type { UppyFile } from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import { html, nothing, render, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { renderIcon } from "./icons";
import "./qa-chat";
import type { FileListResponse, KnowledgeFile, OverviewResponse, TopicSummary, UserRole } from "./types";
import { directoryPrefix, fileIconName, fileNameFromPath, formatBytes, formatDate, normalizeClientRelativePath } from "./utils";

declare const __PDF_WORKER_FILENAME__: string;

type Mode = "login" | "overview" | "topic" | "create";
type TopicView = "qa" | "files";
type UppyMeta = { relativePath?: string; pdfPages?: number };
type UppyBody = Record<string, unknown>;
type DriveUppyFile = UppyFile<UppyMeta, UppyBody>;

interface UploadSignature {
  url: string;
  uploadId: string;
  path: string;
  contentType: string;
  requiredHeaders: Record<string, string>;
}

const rootElement = document.querySelector<HTMLElement>("[data-drive-root]");
if (!rootElement) throw new Error("Missing [data-drive-root] mount element");
const root = rootElement;

const state: {
  mode: Mode;
  role: UserRole;
  displayName: string;
  topics: TopicSummary[];
  topic: TopicSummary | null;
  topicView: TopicView;
  prefix: string;
  listing: FileListResponse | null;
  loading: boolean;
  status: string;
  statusTone: "neutral" | "success" | "danger";
  loginName: string;
  accessCode: string;
  topicName: string;
  upload: { active: boolean; name: string; percent: number; overallPercent: number; total: number };
} = {
  mode: "login",
  role: "viewer",
  displayName: "",
  topics: [],
  topic: null,
  topicView: "qa",
  prefix: "",
  listing: null,
  loading: true,
  status: "",
  statusTone: "neutral",
  loginName: "",
  accessCode: "",
  topicName: "",
  upload: { active: false, name: "", percent: 0, overallPercent: 0, total: 0 },
};

root.addEventListener("click", (event) => void handleClick(event));
root.addEventListener("submit", (event) => void handleSubmit(event));
root.addEventListener("input", handleInput);
root.addEventListener("change", (event) => void handleChange(event));

void boot();

async function boot(): Promise<void> {
  try {
    await loadOverview();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      state.mode = "login";
      state.loading = false;
      renderApp();
      return;
    }
    showError(error);
  }
}

async function loadOverview(): Promise<void> {
  state.loading = true;
  renderApp();
  const overview = await api<OverviewResponse>("/overview");
  state.role = overview.role;
  state.displayName = overview.displayName;
  state.topics = overview.topics;
  state.mode = "overview";
  state.loading = false;
  renderApp();
}

async function openTopic(topicId: string, view: TopicView = "qa"): Promise<void> {
  const topic = state.topics.find((entry) => entry.id === topicId);
  if (!topic) return;
  state.topic = topic;
  state.topicView = state.role === "admin" ? view : "qa";
  state.prefix = "";
  state.listing = null;
  state.mode = "topic";
  renderApp();
  if (state.role === "admin" && state.topicView === "files") await loadFiles();
}

async function loadFiles(): Promise<void> {
  if (!state.topic || state.role !== "admin") return;
  state.loading = true;
  renderApp();
  state.listing = await api<FileListResponse>(`/list?topicId=${encodeURIComponent(state.topic.id)}&prefix=${encodeURIComponent(state.prefix)}`);
  state.loading = false;
  renderApp();
  if (state.listing.files.some((file) => !file.processing || ["queued", "processing", "indexing"].includes(file.processing.state))) {
    window.setTimeout(() => {
      if (state.mode === "topic" && state.topicView === "files") void loadFiles();
    }, 5000);
  }
}

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.name === "displayName") state.loginName = target.value;
  if (target.name === "accessCode") state.accessCode = target.value;
  if (target.name === "topicName") state.topicName = target.value;
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  if (form.matches("[data-login-form]")) {
    state.loading = true;
    renderApp();
    try {
      await api("/login", { method: "POST", body: { displayName: state.loginName, accessCode: state.accessCode } });
      state.accessCode = "";
      await loadOverview();
    } catch (error) { showError(error); }
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
  if (action === "logout") {
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
  } else if (action === "open-topic") {
    await openTopic(String(button.dataset.topicId));
  } else if (action === "topic-view") {
    state.topicView = button.dataset.view === "files" ? "files" : "qa";
    renderApp();
    if (state.topicView === "files") await loadFiles();
  } else if (action === "open-folder") {
    state.prefix = String(button.dataset.path || "");
    await loadFiles();
  } else if (action === "up-folder") {
    state.prefix = directoryPrefix(state.prefix.replace(/\/$/, ""));
    await loadFiles();
  } else if (action === "pick-files") {
    root.querySelector<HTMLInputElement>("[data-file-input]")?.click();
  } else if (action === "pick-folder") {
    root.querySelector<HTMLInputElement>("[data-folder-input]")?.click();
  } else if (action === "download-file") {
    const result = await api<{ url: string }>("/download-url", { method: "POST", body: { topicId: state.topic?.id, path: button.dataset.path } });
    window.open(result.url, "_blank", "noopener,noreferrer");
  } else if (action === "delete-file") {
    const name = String(button.dataset.name || "");
    if (window.confirm(`确定永久删除“${name}”吗？`)) {
      await api("/object", { method: "DELETE", body: { topicId: state.topic?.id, path: button.dataset.path } });
      await loadFiles();
    }
  } else if (action === "retry-file") {
    await api("/process-retry", { method: "POST", body: { topicId: state.topic?.id, path: button.dataset.path } });
    setStatus("已重新提交处理任务。", "success");
    await loadFiles();
  } else if (action === "delete-topic" && state.topic) {
    if (window.confirm(`确定永久删除专题“${state.topic.name}”及全部文件吗？`)) {
      await api("/topic", { method: "DELETE", body: { topicId: state.topic.id, confirmName: state.topic.name } });
      await loadOverview();
    }
  }
}

async function handleChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  if (!input.matches("[data-file-input], [data-folder-input]")) return;
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length) return;
  await uploadFiles(files, (file) => input.matches("[data-folder-input]") ? file.webkitRelativePath || file.name : file.name);
}

async function uploadFiles(files: File[], pathForFile: (file: File) => string): Promise<void> {
  if (!state.topic || state.role !== "admin") return;
  let uppy: Uppy<UppyMeta, UppyBody> | null = null;
  try {
    const prepared = [] as Array<{ file: File; relativePath: string; pdfPages?: number }>;
    for (const file of files) {
      const relativePath = normalizeClientRelativePath(`${state.prefix}${pathForFile(file)}`);
      validateFileSizeAndType(file, relativePath);
      prepared.push({ file, relativePath, ...(relativePath.toLowerCase().endsWith(".pdf") ? { pdfPages: await pdfPageCount(file) } : {}) });
    }
    state.upload = { active: true, name: "准备上传...", percent: 0, overallPercent: 0, total: prepared.length };
    renderApp();
    const signatures = new Map<string, UploadSignature>();
    const completed: Array<{ uploadId: string; relativePath: string; size: number; contentType: string; pdfPages?: number }> = [];
    uppy = new Uppy<UppyMeta, UppyBody>({ autoProceed: false });
    uppy.use(XHRUpload, {
      endpoint: async (fileOrBundle: unknown) => {
        const file = (Array.isArray(fileOrBundle) ? fileOrBundle[0] : fileOrBundle) as DriveUppyFile;
        const data = file.data as Blob;
        const signature = await api<UploadSignature>("/upload-url", {
          method: "POST",
          body: { topicId: state.topic?.id, relativePath: file.meta.relativePath, size: data.size, contentType: file.type || "application/octet-stream", pdfPages: file.meta.pdfPages },
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
      state.upload = { ...state.upload, name: String(file.meta.relativePath || file.name), percent: Math.round(progress.bytesUploaded / progress.bytesTotal * 100) };
      renderApp();
    });
    uppy.on("progress", (overallPercent) => {
      state.upload = { ...state.upload, overallPercent };
      renderApp();
    });
    uppy.on("upload-success", (file) => {
      if (!file) return;
      const data = file.data as Blob;
      const signature = signatures.get(file.id);
      if (!signature) return;
      completed.push({ uploadId: signature.uploadId, relativePath: String(file.meta.relativePath), size: data.size, contentType: file.type || "application/octet-stream", ...(file.meta.pdfPages ? { pdfPages: file.meta.pdfPages } : {}) });
    });
    for (const entry of prepared) uppy.addFile({ name: entry.file.name, type: entry.file.type || "application/octet-stream", data: entry.file, meta: { relativePath: entry.relativePath, pdfPages: entry.pdfPages } });
    const result = await uppy.upload();
    if (result?.failed?.length) throw new Error(`${result.failed.length} 个文件上传失败`);
    await api("/upload-complete", { method: "POST", body: { topicId: state.topic.id, files: completed } });
    state.upload = { active: false, name: "", percent: 0, overallPercent: 0, total: 0 };
    setStatus(`已上传 ${completed.length} 个文件，腾讯云正在异步处理。`, "success");
    await loadFiles();
  } catch (error) {
    state.upload = { active: false, name: "", percent: 0, overallPercent: 0, total: 0 };
    showError(error);
  } finally {
    uppy?.destroy();
  }
}

function validateFileSizeAndType(file: File, path: string): void {
  const extension = path.split(".").at(-1)?.toLowerCase() || "";
  const allowed = new Set(["png", "jpg", "jpeg", "bmp", "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "md", "txt", "wps"]);
  if (!allowed.has(extension)) throw new Error(`${file.name} 的格式不受支持`);
  const max = ["pdf", "doc", "docx", "ppt", "pptx"].includes(extension) ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size <= 0 || file.size > max) throw new Error(`${file.name} 不能超过 ${max / 1024 / 1024} MB`);
}

async function pdfPageCount(file: File): Promise<number> {
  const pdf = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdf.GlobalWorkerOptions.workerSrc = new URL(__PDF_WORKER_FILENAME__, import.meta.url).href;
  const task = pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const document = await task.promise;
    if (document.numPages > 300) throw new Error(`${file.name} 超过 300 页`);
    return document.numPages;
  } finally {
    await task.destroy();
  }
}

function renderApp(): void {
  render(state.mode === "login" ? renderLogin() : renderShell(), root);
}

function renderLogin(): TemplateResult {
  return html`<section class="drive-login-panel"><div><h1>AI 知识库</h1></div><form class="drive-form drive-login-card" data-login-form>
    <label class="drive-field"><span>登录姓名</span><input name="displayName" autocomplete="name" .value=${state.loginName} required></label>
    <label class="drive-field"><span>访问码</span><input name="accessCode" type="password" autocomplete="current-password" .value=${state.accessCode} required></label>
    <button class="drive-control drive-control-primary" type="submit" ?disabled=${state.loading}>${renderIcon("arrow-right", "bold")}进入</button>
    ${renderStatus()}
  </form></section>`;
}

function renderShell(): TemplateResult {
  return html`<section class="drive-dashboard"><div class="drive-page-head"><div><h1>${state.mode === "topic" ? state.topic?.name : "AI 知识库"}</h1></div><div class="drive-head-actions">
    ${state.mode !== "overview" ? iconButton("arrow-left", "返回", "back") : nothing}
    ${iconButton("arrow-clockwise", "刷新", "refresh")}
    ${iconButton("sign-out", "退出", "logout")}
  </div></div>${renderStatus()}${state.loading ? renderLoading() : state.mode === "overview" ? renderOverview() : state.mode === "create" ? renderCreate() : renderTopic()}</section>`;
}

function renderOverview(): TemplateResult {
  const ready = state.topics.some((topic) => topic.ready);
  return html`<div class="drive-two-column"><drive-ai-qa scope="global" .ready=${ready}></drive-ai-qa><section class="drive-panel"><div class="drive-panel-head"><h2>专题</h2>${state.role === "admin" ? html`<button class="drive-control drive-control-primary" data-action="create-topic" type="button">${renderIcon("folder-plus", "bold")}新建</button>` : nothing}</div>
    ${state.topics.length ? html`<div class="drive-topic-grid">${repeat(state.topics, (topic) => topic.id, (topic) => html`<button class="drive-topic-card" type="button" data-action="open-topic" data-topic-id=${topic.id}><span class="drive-topic-card-icon">${renderIcon("folder")}</span><span><strong>${topic.name}</strong><small>${topic.ready ? "可问答" : "处理中"}</small></span>${renderIcon("arrow-right")}</button>`)}</div>` : html`<div class="drive-empty"><h3>暂无专题</h3></div>`}
  </section></div>`;
}

function renderCreate(): TemplateResult {
  return html`<form class="drive-form drive-create-card" data-topic-form><label class="drive-field"><span>专题名称</span><input name="topicName" .value=${state.topicName} required></label><div class="drive-form-actions"><button class="drive-control" type="button" data-action="back">${renderIcon("x-circle")}取消</button><button class="drive-control drive-control-primary" type="submit">${renderIcon("check", "bold")}创建</button></div></form>`;
}

function renderTopic(): TemplateResult {
  if (!state.topic) return html``;
  if (state.role !== "admin") return html`<drive-ai-qa scope="topic" .topicId=${state.topic.id} .topicName=${state.topic.name} .ready=${state.topic.ready}></drive-ai-qa>`;
  return html`<div class="drive-tabs" role="tablist">${tabButton("qa", "问答", "chat-circle-dots")}${tabButton("files", "文件", "files")}</div>${state.topicView === "qa" ? html`<drive-ai-qa scope="topic" .topicId=${state.topic.id} .topicName=${state.topic.name} .ready=${state.topic.ready}></drive-ai-qa>` : renderFiles()}`;
}

function renderFiles(): TemplateResult {
  const listing = state.listing;
  return html`<section class="drive-tab-panel"><div class="drive-material-toolbar"><div><h2>${state.prefix || "全部文件"}</h2></div><div class="drive-upload-actions">
    ${state.prefix ? html`<button class="drive-control" type="button" data-action="up-folder">${renderIcon("arrow-left")}上一级</button>` : nothing}
    <button class="drive-control drive-control-primary" type="button" data-action="pick-files">${renderIcon("upload-simple", "bold")}上传文件</button>
    <button class="drive-control" type="button" data-action="pick-folder">${renderIcon("folder-simple-plus")}上传文件夹</button>
    <input data-file-input type="file" multiple hidden><input data-folder-input type="file" webkitdirectory multiple hidden>
    ${state.prefix ? nothing : html`<button class="drive-control drive-control-danger" type="button" data-action="delete-topic">${renderIcon("trash")}删除专题</button>`}
  </div></div>${state.upload.active ? renderUploadProgress() : nothing}${listing ? renderFileList(listing) : renderLoading()}</section>`;
}

function renderFileList(listing: FileListResponse): TemplateResult {
  return html`<div class="drive-file-table" role="table"><div class="drive-file-row drive-file-row-head" role="row"><span>名称</span><span>大小</span><span>状态</span><span>更新</span><span>操作</span></div>
    ${repeat(listing.folders, (folder) => folder.path, (folder) => html`<div class="drive-file-row" role="row"><span class="drive-file-name">${renderIcon("folder")}<strong>${folder.name}</strong></span><span>-</span><span>目录</span><span>-</span><span class="drive-row-actions"><button class="drive-table-action" type="button" data-action="open-folder" data-path=${folder.path}>${renderIcon("folder-open")}打开</button></span></div>`)}
    ${repeat(listing.files, (file) => file.path, renderFileRow)}
  </div>`;
}

function renderFileRow(file: KnowledgeFile): TemplateResult {
  const status = file.processing?.state || "queued";
  const labels: Record<string, string> = { queued: "排队中", processing: "处理中", indexing: "建索引", ready: "可问答", failed: "失败" };
  return html`<div class="drive-file-row" role="row"><span class="drive-file-name">${renderIcon(fileIconName(file.name))}<strong>${file.name}</strong></span><span>${formatBytes(file.size)}</span><span title=${file.processing?.error || ""}>${labels[status]}</span><span>${formatDate(file.uploadedAt || file.lastModified)}</span><span class="drive-row-actions">${status === "failed" ? html`<button class="drive-table-action" type="button" data-action="retry-file" data-path=${file.path}>${renderIcon("arrow-clockwise")}重试</button>` : nothing}<button class="drive-table-action" type="button" data-action="download-file" data-path=${file.path}>${renderIcon("download-simple")}下载</button><button class="drive-table-action is-danger" type="button" data-action="delete-file" data-path=${file.path} data-name=${file.name}>${renderIcon("trash")}删除</button></span></div>`;
}

function renderUploadProgress(): TemplateResult {
  return html`<div class="drive-upload-progress"><div class="drive-upload-progress-item"><div class="drive-upload-progress-label"><strong>${state.upload.name}</strong><span>${state.upload.percent}%</span></div><wa-progress-bar aria-label="当前文件上传进度" .value=${state.upload.percent}></wa-progress-bar></div>${state.upload.total > 1 ? html`<div class="drive-upload-progress-item"><div class="drive-upload-progress-label"><strong>总体进度</strong><span>${state.upload.overallPercent}% · ${state.upload.total} 个文件</span></div><wa-progress-bar aria-label="总体上传进度" .value=${state.upload.overallPercent}></wa-progress-bar></div>` : nothing}</div>`;
}

function tabButton(view: TopicView, label: string, icon: string): TemplateResult {
  return html`<button type="button" class=${state.topicView === view ? "is-active" : ""} data-action="topic-view" data-view=${view}>${renderIcon(icon)}${label}</button>`;
}

function iconButton(icon: string, label: string, action: string): TemplateResult {
  return html`<button class="drive-icon-button" type="button" data-action=${action} aria-label=${label} title=${label}>${renderIcon(icon)}</button>`;
}

function renderLoading(): TemplateResult { return html`<div class="drive-inline-skeleton"><span></span><span></span><span></span></div>`; }
function renderStatus(): TemplateResult | typeof nothing { return state.status ? html`<wa-callout variant=${state.statusTone === "danger" ? "danger" : state.statusTone === "success" ? "success" : "neutral"}>${state.status}</wa-callout>` : nothing; }
function setStatus(message: string, tone: "neutral" | "success" | "danger" = "neutral"): void { state.status = message; state.statusTone = tone; renderApp(); }
function showError(error: unknown): void { state.loading = false; setStatus(error instanceof Error ? error.message : "请求失败", "danger"); }

class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`/api/drive${path}`, { method: options.method || "GET", credentials: "same-origin", headers: options.body === undefined ? undefined : { "content-type": "application/json" }, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: unknown };
    throw new ApiError(typeof data.error === "string" ? data.error : `请求失败（${response.status}）`, response.status);
  }
  return response.json() as Promise<T>;
}
