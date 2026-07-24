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
import { directoryPrefix, fileIconName, fileNameFromPath, formatBytes, formatDate, normalizeClientRelativePath, processingDisplay } from "./utils";

declare const __PDF_WORKER_FILENAME__: string;

type Mode = "login" | "overview" | "topic" | "create";
type TopicView = "qa" | "files";
type UppyMeta = { relativePath?: string; pdfPages?: number };
type UppyBody = Record<string, unknown>;
type DriveUppyFile = UppyFile<UppyMeta, UppyBody>;
type UploadPhase = "preparing" | "uploading" | "registering";
type ThemeName = "light" | "dark";

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
root.replaceChildren();

let fileRefreshTimer: number | undefined;

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
  theme: ThemeName;
  upload: { active: boolean; phase: UploadPhase; name: string; percent: number; overallPercent: number; total: number };
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
  theme: window.jhssTheme.getResolvedTheme(),
  upload: { active: false, phase: "preparing", name: "", percent: 0, overallPercent: 0, total: 0 },
};

root.addEventListener("click", (event) => void handleClick(event));
root.addEventListener("submit", (event) => void handleSubmit(event));
root.addEventListener("input", handleInput);
root.addEventListener("change", (event) => void handleChange(event));
window.jhssTheme.subscribe((theme) => {
  if (state.theme !== theme) {
    state.theme = theme;
    renderApp();
  }
});

void boot();

async function boot(): Promise<void> {
  try {
    await loadOverview();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await new Promise((resolve) => window.setTimeout(resolve, 150));
      try {
        await loadOverview();
        return;
      } catch (retryError) {
        if (!(retryError instanceof ApiError && retryError.status === 401)) {
          showError(retryError);
          return;
        }
        state.mode = "login";
        state.loading = false;
        renderApp();
        return;
      }
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

async function loadFiles(background = false): Promise<void> {
  if (!state.topic || state.role !== "admin") return;
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
  if (state.topic?.id !== topicId || state.prefix !== prefix || state.topicView !== "files") return;
  state.listing = listing;
  state.loading = false;
  renderApp();
  if (listing.files.some((file) => processingDisplay(file).poll)) {
    fileRefreshTimer = window.setTimeout(() => {
      fileRefreshTimer = undefined;
      if (state.mode === "topic" && state.topicView === "files") void loadFiles(true);
    }, 10_000);
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
  if (action === "toggle-theme") {
    window.jhssTheme.toggleTheme();
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
    state.upload = { active: true, phase: "preparing", name: "准备上传...", percent: 0, overallPercent: 0, total: prepared.length };
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
    state.upload = { ...state.upload, phase: "uploading", name: prepared[0]?.relativePath || "上传文件" };
    renderApp();
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
    if (completed.length !== prepared.length) throw new Error(`仅完成 ${completed.length}/${prepared.length} 个文件上传`);
    state.upload = { ...state.upload, phase: "registering", name: "正在登记文件...", percent: 100, overallPercent: 100 };
    renderApp();
    await withTimeout(api("/upload-complete", { method: "POST", body: { topicId: state.topic.id, files: completed } }), 60_000, "文件登记超时，请稍后重试");
    state.upload = { active: false, phase: "preparing", name: "", percent: 0, overallPercent: 0, total: 0 };
    setStatus(`已上传 ${completed.length} 个文件，腾讯云正在异步处理。`, "success");
    await loadFiles();
  } catch (error) {
    state.upload = { active: false, phase: "preparing", name: "", percent: 0, overallPercent: 0, total: 0 };
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
  return html`<section class="drive-login-panel">
    ${renderThemeToggle("drive-login-theme-toggle")}
    <div class="drive-login-story">
      <div class="drive-brand-lockup"><img src="/assets/jhss-logo-cropped.png" alt="嘉合杉升"><span>嘉合杉升</span></div>
      <div class="drive-login-copy">
        <span class="drive-eyebrow">企业知识工作台</span>
        <h1>把知识，<br>变成答案。</h1>
        <p>从分散资料中快速提取结论、核验风险，并回到每一处可信来源。</p>
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
      <label class="drive-field"><span>访问码</span><input name="accessCode" type="password" autocomplete="current-password" placeholder="请输入访问码" .value=${state.accessCode} required></label>
      <button class="drive-control drive-control-primary drive-login-submit" type="submit" ?disabled=${state.loading}>进入知识库${renderIcon("arrow-right", "bold")}</button>
      ${renderStatus()}
      <div class="drive-login-foot"><p class="drive-login-help">仅限授权成员访问</p><a class="drive-docs-link" href="/docs/">${renderIcon("book-open")}浏览 AI 手册</a></div>
    </form>
  </section>`;
}

function renderShell(): TemplateResult {
  const title = state.mode === "topic" ? state.topic?.name : state.mode === "create" ? "新建专题" : `欢迎回来，${state.displayName}`;
  const description = state.mode === "topic"
    ? state.topic?.ready ? "从当前专题中提问，或管理专题资料。" : "资料仍在处理中，完成后即可开始问答。"
    : state.mode === "create" ? "建立一个独立的资料范围，让后续问答更聚焦。" : "从全部资料中提问，快速获得带来源的可靠答案。";
  return html`<section class="drive-dashboard">
    <header class="drive-appbar">
      <button class="drive-brand-lockup drive-brand-button drive-title-button" type="button" data-action="back" aria-label="返回知识库首页">
        <img src="/assets/jhss-logo-cropped.png" alt=""><span><strong>嘉合杉升</strong><small>AI 知识库</small></span>
      </button>
      <div class="drive-appbar-meta"><a class="drive-appbar-docs" href="/docs/">${renderIcon("book-open")}AI 手册</a>${renderThemeToggle()}<span class="drive-user-badge">${state.displayName}<small>${state.role === "admin" ? "管理员" : "成员"}</small></span>${iconButton("arrow-clockwise", "刷新", "refresh")}${iconButton("sign-out", "退出", "logout")}</div>
    </header>
    <main class="drive-dashboard-main">
      <div class="drive-page-head"><div>
        ${state.mode !== "overview" ? html`<button class="drive-back-link" type="button" data-action="back">${renderIcon("arrow-left")}返回知识库</button>` : html`<span class="drive-eyebrow">知识工作台</span>`}
        <h1>${title}</h1><p>${description}</p>
      </div><div class="drive-head-actions">${state.mode === "overview" && state.role === "admin" ? html`<button class="drive-control" data-action="create-topic" type="button">${renderIcon("folder-plus")}新建专题</button>` : nothing}</div></div>
      ${renderStatus()}
      ${state.loading ? renderLoading() : state.mode === "overview" ? renderOverview() : state.mode === "create" ? renderCreate() : renderTopic()}
    </main>
  </section>`;
}

function renderOverview(): TemplateResult {
  const ready = state.topics.some((topic) => topic.ready);
  return html`<div class="drive-two-column"><drive-ai-qa scope="global" .ready=${ready}></drive-ai-qa><aside class="drive-panel drive-topic-panel"><div class="drive-panel-head"><div><span class="drive-eyebrow">资料范围</span><h2>专题</h2></div><span>${state.topics.length} 个</span></div>
    ${state.topics.length ? html`<div class="drive-topic-grid">${repeat(state.topics, (topic) => topic.id, (topic) => html`<button class="drive-topic-card" type="button" data-action="open-topic" data-topic-id=${topic.id}><span class="drive-topic-card-icon">${renderIcon("folder")}</span><span><strong>${topic.name}</strong><small class=${topic.ready ? "is-ready" : ""}>${topic.ready ? "可问答" : "处理中"}</small></span>${renderIcon("arrow-right")}</button>`)}</div>` : html`<div class="drive-empty">${renderIcon("folder")}<h3>还没有专题</h3><p>创建专题并上传资料后，即可开始可追溯问答。</p></div>`}
  </aside></div>`;
}

function renderCreate(): TemplateResult {
  return html`<form class="drive-form drive-create-card" data-topic-form><div class="drive-create-icon">${renderIcon("folder-plus")}</div><div><h2>专题信息</h2><p>专题创建后，可继续上传文件并等待系统处理。</p></div><label class="drive-field"><span>专题名称</span><input name="topicName" placeholder="例如：2026 年行业研究" .value=${state.topicName} required></label><div class="drive-form-actions"><button class="drive-control" type="button" data-action="back">${renderIcon("x-circle")}取消</button><button class="drive-control drive-control-primary" type="submit">${renderIcon("check", "bold")}创建专题</button></div></form>`;
}

function renderTopic(): TemplateResult {
  if (!state.topic) return html``;
  if (state.role !== "admin") return html`<drive-ai-qa scope="topic" .topicId=${state.topic.id} .topicName=${state.topic.name} .ready=${state.topic.ready}></drive-ai-qa>`;
  return html`<div class="drive-tabs" role="tablist">${tabButton("qa", "问答", "chat-circle-dots")}${tabButton("files", "文件", "files")}</div>${state.topicView === "qa" ? html`<drive-ai-qa scope="topic" .topicId=${state.topic.id} .topicName=${state.topic.name} .ready=${state.topic.ready}></drive-ai-qa>` : renderFiles()}`;
}

function renderFiles(): TemplateResult {
  const listing = state.listing;
  return html`<section class="drive-tab-panel"><div class="drive-material-toolbar"><div><span class="drive-eyebrow">资料管理</span><h2>${state.prefix || "全部文件"}</h2></div><div class="drive-upload-actions">
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
  const processing = processingDisplay(file);
  return html`<div class="drive-file-row" role="row"><span class="drive-file-name">${renderIcon(fileIconName(file.name))}<strong>${file.name}</strong></span><span>${formatBytes(file.size)}</span><span title=${file.processing?.error || ""}>${processing.label}</span><span>${formatDate(file.uploadedAt || file.lastModified)}</span><span class="drive-row-actions">${processing.retryable ? html`<button class="drive-table-action" type="button" data-action="retry-file" data-path=${file.path}>${renderIcon("arrow-clockwise")}重试</button>` : nothing}<button class="drive-table-action" type="button" data-action="download-file" data-path=${file.path}>${renderIcon("download-simple")}下载</button><button class="drive-table-action is-danger" type="button" data-action="delete-file" data-path=${file.path} data-name=${file.name}>${renderIcon("trash")}删除</button></span></div>`;
}

function renderUploadProgress(): TemplateResult {
  const label = state.upload.phase === "preparing" ? "准备上传..." : state.upload.phase === "registering" ? "正在登记文件..." : state.upload.name;
  return html`<div class="drive-upload-progress"><div class="drive-upload-progress-item"><div class="drive-upload-progress-label"><strong>${label}</strong><span>${state.upload.percent}%</span></div><wa-progress-bar aria-label="当前文件上传进度" .value=${state.upload.percent}></wa-progress-bar></div>${state.upload.total > 1 ? html`<div class="drive-upload-progress-item"><div class="drive-upload-progress-label"><strong>总体进度</strong><span>${state.upload.overallPercent}% · ${state.upload.total} 个文件</span></div><wa-progress-bar aria-label="总体上传进度" .value=${state.upload.overallPercent}></wa-progress-bar></div>` : nothing}</div>`;
}

function tabButton(view: TopicView, label: string, icon: string): TemplateResult {
  return html`<button type="button" class=${state.topicView === view ? "is-active" : ""} data-action="topic-view" data-view=${view}>${renderIcon(icon)}${label}</button>`;
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

class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
async function api<T = unknown>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(`/api/drive${path}`, { method: options.method || "GET", credentials: "same-origin", headers: options.body === undefined ? undefined : { "content-type": "application/json" }, body: options.body === undefined ? undefined : JSON.stringify(options.body), signal: options.signal });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: unknown };
    throw new ApiError(typeof data.error === "string" ? data.error : `请求失败（${response.status}）`, response.status);
  }
  return response.json() as Promise<T>;
}

async function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => { timer = window.setTimeout(() => reject(new Error(message)), milliseconds); }),
    ]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
}
