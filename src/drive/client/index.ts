import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/drawer/drawer.js";
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "./phosphor-drive.css";

import Uppy from "@uppy/core";
import type { UppyFile } from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
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
  preview: { file: DriveFile; kind: PreviewKind; title: string; url?: string; html?: string; loading: boolean } | null;
  pendingDelete: { type: "file" | "topic"; path?: string; prefix?: string; name: string } | null;
  deleteConfirmText: string;
}

interface PresignedUpload {
  url: string;
  path: string;
  contentType: string;
}

type UppyMeta = Record<string, unknown>;
type UppyBody = Record<string, unknown>;
type DriveUppyFile = UppyFile<UppyMeta, UppyBody>;

const apiBase = "/api/drive";
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: false });
const rootElement = document.querySelector<HTMLElement>("[data-drive-root]");

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
};

if (!rootElement) {
  throw new Error("Missing [data-drive-root] mount element.");
}

const root = rootElement;

root.addEventListener("click", (event) => {
  void handleClick(event);
});
root.addEventListener("submit", (event) => {
  void handleSubmit(event);
});
root.addEventListener("change", (event) => {
  void handleChange(event);
});
root.addEventListener("input", handleInput);
root.addEventListener("wa-after-hide", (event) => {
  const target = event.target as HTMLElement;
  if (target.matches("[data-preview-drawer]")) {
    state.preview = null;
    render();
  }
  if (target.matches("[data-delete-dialog]")) {
    state.pendingDelete = null;
    state.deleteConfirmText = "";
    render();
  }
});

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
    await submitLogin(form);
  } else if (form.matches("[data-create-form]")) {
    await submitCreateTopic(form);
  } else if (form.matches("[data-settings-form]")) {
    await submitTopicSettings(form);
  }
}

async function handleClick(event: MouseEvent): Promise<void> {
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!target) {
    return;
  }
  const action = target.dataset.action || "";
  const path = target.dataset.path || "";
  const prefix = target.dataset.prefix || "";
  const name = target.dataset.name || path.split("/").pop() || "";

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
    await openPreview(path);
  } else if (action === "download") {
    await downloadFile(path);
  } else if (action === "copy-link") {
    await copySignedLink(path);
  } else if (action === "delete-file") {
    openDelete({ type: "file", path, name });
  } else if (action === "delete-topic") {
    if (state.topic) {
      openDelete({ type: "topic", prefix: state.topic.topic.prefix, name: state.topic.topic.name });
    }
  } else if (action === "confirm-delete") {
    await confirmDelete();
  } else if (action === "cancel-delete") {
    closeDeleteDialog();
  } else if (action === "agent-manifest") {
    await copyAgentManifest(target);
  } else if (action === "copy-generate-prompt") {
    await copyGeneratePrompt();
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
  const input = event.target as HTMLInputElement;
  if (input.matches("[data-delete-confirm-input]")) {
    state.deleteConfirmText = input.value;
    const confirm = document.querySelector<HTMLButtonElement>('[data-action="confirm-delete"]');
    if (confirm) {
      confirm.disabled = !state.pendingDelete || state.deleteConfirmText !== state.pendingDelete.name;
    }
  }
}

async function submitLogin(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  try {
    setLoading(true, "正在校验身份...");
    await api<{ ok: true; displayName: string }>("/login", {
      method: "POST",
      body: {
        displayName: data.get("displayName"),
        accessCode: data.get("accessCode"),
      },
    });
    form.reset();
    await loadOverview("欢迎回来。");
  } catch (error) {
    showError(error);
    state.mode = "login";
    render();
  } finally {
    setLoading(false);
  }
}

async function submitCreateTopic(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  const name = String(data.get("topicName") || "").trim();
  if (!name) {
    setStatus("请输入专题名称。", "danger");
    render();
    return;
  }
  try {
    setLoading(true, "正在创建专题...");
    const detail = await api<TopicDetail>("/topic", {
      method: "POST",
      body: {
        name,
        description: data.get("topicDescription"),
      },
    });
    form.reset();
    setStatus("专题已创建，成果目录和提示词已准备好。", "success");
    await openTopic(detail.topic.prefix, "agent");
  } catch (error) {
    showError(error);
    render();
  } finally {
    setLoading(false);
  }
}

async function submitTopicSettings(form: HTMLFormElement): Promise<void> {
  if (!state.topic) {
    return;
  }
  const data = new FormData(form);
  try {
    setLoading(true, "正在保存专题设置...");
    state.topic = await api<TopicDetail>("/topic", {
      method: "PUT",
      body: {
        prefix: state.topic.topic.prefix,
        description: data.get("topicDescription"),
        generatePrompt: data.get("generatePrompt"),
      },
    });
    setStatus("专题设置已保存。", "success");
    render();
  } catch (error) {
    showError(error);
    render();
  } finally {
    setLoading(false);
  }
}

async function loadOverview(successMessage = ""): Promise<void> {
  try {
    state.mode = "overview";
    state.loading = true;
    state.topic = null;
    state.materialList = null;
    state.materialPrefix = "";
    render();
    state.overview = await api<DriveOverview>("/overview");
    state.mode = "overview";
    state.loading = false;
    setStatus(successMessage || overviewStatus(state.overview), successMessage ? "success" : "neutral");
    render();
  } catch (error) {
    state.loading = false;
    if (isUnauthorized(error)) {
      state.mode = "login";
      setStatus("请输入姓名和访问码后继续。");
      render();
      return;
    }
    showError(error);
    state.mode = "login";
    render();
  }
}

async function openTopic(prefix: string, tab: TopicTab = "outputs"): Promise<void> {
  try {
    state.mode = "topic";
    state.activeTab = tab;
    state.loading = true;
    state.materialPrefix = prefix;
    render();
    const [topic, materialList] = await Promise.all([
      api<TopicDetail>(`/topic?${new URLSearchParams({ prefix }).toString()}`),
      api<DriveListResult>(`/list?${new URLSearchParams({ prefix }).toString()}`),
    ]);
    state.topic = topic;
    state.materialList = materialList;
    state.materialPrefix = materialList.prefix;
    state.loading = false;
    setStatus("专题成果和资料已更新。");
    render();
  } catch (error) {
    state.loading = false;
    showError(error);
    render();
  }
}

async function loadMaterialDirectory(prefix: string): Promise<void> {
  try {
    state.materialPrefix = prefix;
    state.materialList = null;
    state.activeTab = "materials";
    render();
    state.materialList = await api<DriveListResult>(`/list?${new URLSearchParams({ prefix }).toString()}`);
    state.materialPrefix = state.materialList.prefix;
    setStatus("资料目录已更新。");
    render();
  } catch (error) {
    showError(error);
    render();
  }
}

function setActiveTab(tab: TopicTab): void {
  if (!["outputs", "materials", "agent", "settings"].includes(tab)) {
    return;
  }
  state.activeTab = tab;
  render();
}

async function refreshCurrent(): Promise<void> {
  if (state.mode === "topic" && state.topic) {
    await openTopic(state.topic.topic.prefix, state.activeTab);
  } else {
    await loadOverview();
  }
}

async function logout(): Promise<void> {
  await api("/logout", { method: "POST" }).catch(() => null);
  state.mode = "login";
  state.overview = null;
  state.topic = null;
  setStatus("已退出登录。");
  render();
}

function showCreateTopic(): void {
  state.mode = "create";
  state.topic = null;
  state.materialList = null;
  setStatus("填写专题名称和说明，系统会创建成果目录和默认提示词。");
  render();
}

async function copyAgentManifest(button: HTMLElement): Promise<void> {
  if (!state.topic) {
    return;
  }
  const original = button.textContent || "";
  try {
    button.setAttribute("disabled", "");
    button.textContent = "正在生成...";
    setStatus("正在生成 agent 分析提示词...");
    const data = await api<{ prompt: string; fileCount: number; expiresIn: number }>("/agent-manifest", {
      method: "POST",
      body: { prefix: state.topic.topic.prefix },
    });
    await writeClipboard(data.prompt);
    setStatus(`分析提示词已复制。资料 ${data.fileCount || 0} 个，链接 ${data.expiresIn || 0} 秒内有效。`, "success");
  } catch (error) {
    showError(error);
  } finally {
    button.removeAttribute("disabled");
    button.textContent = original;
    render();
  }
}

async function copyGeneratePrompt(): Promise<void> {
  if (!state.topic?.generatePrompt) {
    setStatus("当前专题还没有生成提示词。", "danger");
    render();
    return;
  }
  try {
    await writeClipboard(state.topic.generatePrompt);
    setStatus("成果生成与回传提示词已复制。", "success");
    render();
  } catch {
    setStatus("复制失败，请手动选中文本复制。", "danger");
    render();
  }
}

async function copySignedLink(path: string): Promise<void> {
  try {
    const data = await signedDownload(path);
    await writeClipboard(data.url);
    setStatus("短时成果链接已复制。", "success");
    render();
  } catch (error) {
    showError(error);
    render();
  }
}

async function downloadFile(path: string): Promise<void> {
  try {
    const data = await signedDownload(path);
    window.location.href = data.url;
  } catch (error) {
    showError(error);
    render();
  }
}

async function openPreview(path: string): Promise<void> {
  const file = findFileByPath(path);
  if (!file) {
    setStatus("找不到要预览的文件。", "danger");
    render();
    return;
  }
  const kind = previewKindForFile(file);
  if (kind === "none") {
    await downloadFile(path);
    return;
  }
  state.preview = { file, kind, title: file.name, loading: true };
  render();

  try {
    const data = await signedDownload(path);
    if (kind === "markdown" || kind === "text") {
      const response = await fetch(data.url);
      if (!response.ok) {
        throw new Error(`预览读取失败：${response.status}`);
      }
      const text = await response.text();
      const rawHtml = kind === "markdown" ? markdown.render(text) : `<pre>${escapeHtml(text)}</pre>`;
      state.preview = {
        file,
        kind,
        title: file.name,
        html: DOMPurify.sanitize(rawHtml),
        loading: false,
      };
    } else {
      state.preview = { file, kind, title: file.name, url: data.url, loading: false };
    }
    render();
  } catch (error) {
    showError(error);
    state.preview = null;
    render();
  }
}

function openDelete(target: AppState["pendingDelete"]): void {
  state.pendingDelete = target;
  state.deleteConfirmText = "";
  render();
  window.setTimeout(() => {
    document.querySelector<HTMLInputElement>("[data-delete-confirm-input]")?.focus();
  }, 0);
}

function closeDeleteDialog(): void {
  const dialog = document.querySelector<HTMLElement & { open: boolean }>("[data-delete-dialog]");
  if (dialog) {
    dialog.open = false;
  }
  state.pendingDelete = null;
  state.deleteConfirmText = "";
  render();
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
      await api("/object", {
        method: "DELETE",
        body: { path: target.path },
      });
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
    render();
  }
}

async function uploadFiles(files: File[], relativePathForFile: (file: File) => string): Promise<void> {
  if (!files.length || !state.topic) {
    return;
  }
  const prefix = state.topic.topic.prefix;
  const entries = files.map((file) => ({
    file,
    relativePath: normalizeClientRelativePath(relativePathForFile(file)),
  }));

  try {
    const conflicts = await findUploadConflicts(entries);
    if (conflicts.length && !window.confirm(`将覆盖 ${conflicts.length} 个同路径同名文件。是否继续上传？`)) {
      return;
    }
    state.upload = { active: true, name: "准备上传...", percent: 0, total: entries.length };
    render();

    const signedUploads = new Map<string, PresignedUpload>();
    const completed: Promise<UploadCompleteResponse>[] = [];
    const uppy = new Uppy<UppyMeta, UppyBody>({ autoProceed: false });
    uppy.use(XHRUpload, {
      endpoint: async (fileOrBundle: unknown) => {
        const file = (Array.isArray(fileOrBundle) ? fileOrBundle[0] : fileOrBundle) as DriveUppyFile;
        const relativePath = String(file.meta.relativePath || file.name);
        const fileData = file.data as Blob | undefined;
        const upload = await api<PresignedUpload>("/upload-url", {
          method: "POST",
          body: {
            prefix,
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
      headers: (file: DriveUppyFile) => ({
        "content-type": file.type || "application/octet-stream",
      }),
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
      renderUploadProgress();
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
            kind: upload.path.startsWith(`${prefix}outputs/`) ? "output" : "material",
          },
        }),
      );
    });

    for (const entry of entries) {
      uppy.addFile({
        name: entry.file.name,
        type: entry.file.type || "application/octet-stream",
        data: entry.file,
        meta: { relativePath: entry.relativePath },
      });
    }
    const result = await uppy.upload();
    await Promise.all(completed);
    uppy.destroy();
    if (result?.failed?.length) {
      throw new Error(`${result.failed.length} 个文件上传失败。`);
    }
    state.upload = { active: false, name: "", percent: 0, total: 0 };
    setStatus(`上传完成，已登记 ${entries.length} 个文件。`, "success");
    await openTopic(prefix, state.activeTab);
  } catch (error) {
    state.upload = { active: false, name: "", percent: 0, total: 0 };
    showError(error);
    render();
  }
}

async function findUploadConflicts(entries: Array<{ relativePath: string }>): Promise<Array<{ relativePath: string }>> {
  if (!state.topic) {
    return [];
  }
  const directories = Array.from(new Set(entries.map((entry) => directoryPrefix(entry.relativePath))));
  const existingByDirectory = new Map<string, Set<string>>();
  await Promise.all(
    directories.map(async (directory) => {
      try {
        const prefix = `${state.topic?.topic.prefix || ""}${directory}`;
        const data = await api<DriveListResult>(`/list?${new URLSearchParams({ prefix }).toString()}`);
        existingByDirectory.set(directory, new Set(data.files.map((file) => file.name)));
      } catch {
        existingByDirectory.set(directory, new Set());
      }
    }),
  );
  return entries.filter((entry) => existingByDirectory.get(directoryPrefix(entry.relativePath))?.has(fileNameFromPath(entry.relativePath)));
}

async function signedDownload(path: string): Promise<{ url: string; path: string }> {
  return api<{ url: string; path: string }>("/download-url", {
    method: "POST",
    body: { path },
  });
}

async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const init: RequestInit = {
    method: options.method || "GET",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
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

function render(): void {
  root.innerHTML = `
    <div class="drive-workspace">
      ${renderTopbar()}
      <main class="drive-main" aria-live="polite">
        ${renderStatus()}
        ${state.mode === "login" ? renderLogin() : ""}
        ${state.mode === "overview" ? renderOverview() : ""}
        ${state.mode === "create" ? renderCreateTopic() : ""}
        ${state.mode === "topic" ? renderTopic() : ""}
      </main>
      ${renderPreviewDrawer()}
      ${renderDeleteDialogMarkup()}
    </div>
  `;
}

function renderTopbar(): string {
  return `
    <header class="drive-topbar">
      <div class="drive-brand-actions">
        <a class="drive-brand" href="/drive" aria-label="返回嘉合杉升专题资料库">
          <img src="./assets/jhss-logo-cropped.png" alt="" aria-hidden="true" />
          <span>嘉合杉升专题资料库</span>
        </a>
        ${state.mode !== "login" ? controlButton("退出登录", "ph-sign-out", "logout", false, "", "drive-logout-button") : ""}
      </div>
      <nav class="drive-nav" aria-label="专题资料库导航">
        <a href="./index.html">返回首页</a>
      </nav>
    </header>
  `;
}

function renderStatus(): string {
  if (!state.status && !state.upload.active && !state.loading) {
    return "";
  }
  return `
    <section class="drive-system-row" aria-live="polite">
      <div class="drive-status-line ${state.statusTone === "danger" ? "is-danger" : ""} ${state.statusTone === "success" ? "is-success" : ""}">
        ${state.loading ? '<i class="ph ph-circle-notch drive-spin" aria-hidden="true"></i>' : '<i class="ph ph-info" aria-hidden="true"></i>'}
        <span>${escapeHtml(state.status || "正在处理...")}</span>
      </div>
      ${renderUploadProgress()}
    </section>
  `;
}

function renderLogin(): string {
  return `
    <section class="drive-login-panel" aria-labelledby="drive-login-title">
      <div>
        <p class="drive-kicker">专题资料库</p>
        <h1 id="drive-login-title">专题资料库</h1>
        <p>登录后查看专题成果、站内预览、复制短时链接，并把资料交给本地 agent 继续分析。</p>
      </div>
      <form class="drive-form drive-login-card" data-login-form>
        <label class="drive-field">
          <span>登录姓名</span>
          <input name="displayName" type="text" autocomplete="name" required />
          <small>上传和设置记录会显示该姓名。</small>
        </label>
        <label class="drive-field">
          <span>访问码</span>
          <input name="accessCode" type="password" autocomplete="current-password" required />
          <small>登录态会定时失效，请勿在公共设备保存访问码。</small>
        </label>
        <button class="drive-control drive-control-primary" type="submit">
          <i class="ph ph-arrow-right" aria-hidden="true"></i>
          进入资料库
        </button>
      </form>
    </section>
  `;
}

function renderOverview(): string {
  if (state.loading && !state.overview) {
    return renderOverviewSkeleton();
  }
  const topics = state.overview?.topics || [];
  const totalOutputs = topics.reduce((sum, topic) => sum + topic.outputCount, 0);
  const emptyTopics = topics.filter((topic) => topic.outputCount === 0).length;
  const latest = topics.flatMap((topic) => (topic.latestOutput ? [{ topic, output: topic.latestOutput }] : [])).slice(0, 5);

  return `
    <section class="drive-dashboard">
      <div class="drive-page-head">
        <div>
          <h1>专题资料库</h1>
        </div>
        <div class="drive-head-actions">
          ${controlButton("刷新", "ph-arrow-clockwise", "refresh")}
          ${controlButton("新建专题", "ph-folder-plus", "create-view", true)}
        </div>
      </div>

      <div class="drive-metrics" aria-label="专题资料库概览">
        ${metricCard("专题", String(topics.length), "已建专题数")}
        ${metricCard("成果", String(totalOutputs), "outputs 目录文件")}
        ${metricCard("待交付", String(emptyTopics), "还没有成果的专题")}
      </div>

      <div class="drive-two-column">
        <section class="drive-panel">
          <div class="drive-panel-head">
            <h2>最近成果</h2>
            <span>${latest.length ? "可预览或复制短时链接" : "暂无成果"}</span>
          </div>
          ${latest.length ? latest.map(({ topic, output }) => renderLatestOutput(topic, output)).join("") : renderEmpty("ph-tray", "还没有可交付成果", "进入专题后上传资料，让 agent 生成并回传到 outputs/。")}
        </section>
        <section class="drive-panel">
          <div class="drive-panel-head">
            <h2>专题队列</h2>
            <span>${topics.length ? "按最近交付排序" : "等待创建"}</span>
          </div>
          ${topics.length ? topics.map(renderTopicCard).join("") : renderEmpty("ph-folder-plus", "还没有专题", "创建第一个专题后，系统会准备成果目录和默认提示词。")}
        </section>
      </div>
    </section>
  `;
}

function renderCreateTopic(): string {
  return `
    <section class="drive-create-layout">
      <div class="drive-page-head">
        <div>
          <p class="drive-kicker">New topic</p>
          <h1>创建专题</h1>
          <p>专题创建后会自动准备 outputs 目录和成果生成提示词。</p>
        </div>
        ${controlButton("返回", "ph-arrow-left", "back-overview")}
      </div>
      <form class="drive-form drive-create-card" data-create-form>
        <label class="drive-field">
          <span>专题名称</span>
          <input name="topicName" type="text" autocomplete="off" required />
        </label>
        <label class="drive-field">
          <span>专题说明</span>
          <textarea name="topicDescription" rows="6" placeholder="可选：记录研究范围、资料口径或成果要求。"></textarea>
        </label>
        <div class="drive-form-actions">
          <button class="drive-control" type="button" data-action="cancel-create">取消</button>
          <button class="drive-control drive-control-primary" type="submit">
            <i class="ph ph-check" aria-hidden="true"></i>
            创建专题
          </button>
        </div>
      </form>
    </section>
  `;
}

function renderTopic(): string {
  if (state.loading || !state.topic) {
    return renderTopicSkeleton();
  }
  const topic = state.topic.topic;
  return `
    <section class="drive-topic-workbench">
      <div class="drive-topic-headline">
        <button class="drive-link-button" type="button" data-action="back-overview">
          <i class="ph ph-arrow-left" aria-hidden="true"></i>
          成果概览
        </button>
        <div class="drive-topic-title-row">
          <div>
            <h1>${escapeHtml(topic.name)}</h1>
            <p>${escapeHtml(topic.description || "暂无专题说明。")}</p>
          </div>
          <div class="drive-topic-meta">
            <span>创建人 ${escapeHtml(topic.createdBy || "-")}</span>
            <span>更新 ${escapeHtml(formatDate(topic.updatedAt))}</span>
            <span>${escapeHtml(topic.prefix)}</span>
          </div>
        </div>
      </div>

      <div class="drive-tabs" role="tablist" aria-label="专题工作区">
        ${tabButton("outputs", "成果", "ph-package")}
        ${tabButton("materials", "资料", "ph-files")}
        ${tabButton("agent", "Agent", "ph-terminal-window")}
        ${tabButton("settings", "设置", "ph-sliders-horizontal")}
      </div>

      ${state.activeTab === "outputs" ? renderOutputsTab() : ""}
      ${state.activeTab === "materials" ? renderMaterialsTab() : ""}
      ${state.activeTab === "agent" ? renderAgentTab() : ""}
      ${state.activeTab === "settings" ? renderSettingsTab() : ""}
    </section>
  `;
}

function renderOutputsTab(): string {
  const outputs = sortFilesByFreshness(state.topic?.outputs || []);
  return `
    <section class="drive-tab-panel">
      <div class="drive-panel-head">
        <h2>专题成果</h2>
        <span>${outputs.length} 个文件</span>
      </div>
      ${outputs.length ? renderFileTable(outputs, { outputMode: true, empty: "" }) : renderEmpty("ph-package", "这个专题还没有成果", "复制 agent 提示词生成成果，并把 Markdown、HTML 或 PDF 回传到 outputs/。")}
    </section>
  `;
}

function renderMaterialsTab(): string {
  const listing = state.materialList;
  const topicPrefix = state.topic?.topic.prefix || "";
  const folders = listing?.folders.filter((folder) => folder.name !== "outputs") || [];
  const files = visibleMaterialFiles(listing?.files || []);
  return `
    <section class="drive-tab-panel">
      <div class="drive-material-toolbar">
        <div>
          <h2>资料库</h2>
          ${renderBreadcrumbs(state.materialPrefix || topicPrefix)}
        </div>
        <div class="drive-upload-actions">
          <label class="drive-control drive-control-primary drive-upload-trigger">
            <i class="ph ph-upload-simple" aria-hidden="true"></i>
            上传文件
            <input data-file-input type="file" multiple />
          </label>
          <label class="drive-control drive-upload-trigger">
            <i class="ph ph-folder-simple-plus" aria-hidden="true"></i>
            上传文件夹
            <input data-folder-input type="file" webkitdirectory multiple />
          </label>
        </div>
      </div>
      ${listing ? renderFolderList(folders) + renderFileTable(files, { outputMode: false, empty: "当前目录没有资料。" }) : renderInlineSkeleton()}
    </section>
  `;
}

function renderAgentTab(): string {
  const prompt = state.topic?.generatePrompt || "";
  const outputPrefix = `${state.topic?.topic.prefix || ""}outputs/`;
  return `
    <section class="drive-agent-grid">
      <div class="drive-agent-card">
        <h2>交给本地 agent 分析</h2>
        <p>系统会生成一个短时 manifest 链接，agent 不需要登录即可读取资料。链接过期后重新生成即可。</p>
        <button class="drive-control drive-control-primary" type="button" data-action="agent-manifest">
          <i class="ph ph-clipboard-text" aria-hidden="true"></i>
          复制分析提示词
        </button>
      </div>
      <div class="drive-agent-card">
        <h2>成果回传路径</h2>
        <p><code>${escapeHtml(outputPrefix)}</code></p>
        <p>生成 Markdown、HTML 或 PDF 后回传到该目录，成果页会自动聚合展示。</p>
      </div>
      <section class="drive-prompt-panel">
        <div class="drive-panel-head">
          <h2>成果生成与回传提示词</h2>
          ${controlButton("复制", "ph-copy", "copy-generate-prompt")}
        </div>
        <textarea readonly>${escapeHtml(prompt)}</textarea>
      </section>
    </section>
  `;
}

function renderSettingsTab(): string {
  if (!state.topic) {
    return "";
  }
  return `
    <section class="drive-tab-panel">
      <form class="drive-form drive-settings-form" data-settings-form>
        <label class="drive-field">
          <span>专题说明</span>
          <textarea name="topicDescription" rows="5">${escapeHtml(state.topic.topic.description || "")}</textarea>
        </label>
        <label class="drive-field">
          <span>成果生成与回传提示词</span>
          <textarea name="generatePrompt" rows="14">${escapeHtml(state.topic.generatePrompt || "")}</textarea>
        </label>
        <div class="drive-form-actions">
          <button class="drive-control drive-control-primary" type="submit">
            <i class="ph ph-floppy-disk" aria-hidden="true"></i>
            保存设置
          </button>
          <button class="drive-control drive-control-danger" type="button" data-action="delete-topic">
            <i class="ph ph-trash" aria-hidden="true"></i>
            删除专题
          </button>
        </div>
      </form>
    </section>
  `;
}

function renderLatestOutput(topic: DriveOverviewTopic, output: NonNullable<DriveOverviewTopic["latestOutput"]>): string {
  return `
    <article class="drive-output-card">
      <div class="drive-file-symbol"><i class="ph ${fileIconName(output)}" aria-hidden="true"></i></div>
      <div class="drive-output-main">
        <button class="drive-title-button" type="button" data-action="open-topic" data-prefix="${escapeAttr(topic.prefix)}">${escapeHtml(output.name)}</button>
        <p>${escapeHtml(topic.name)} · ${escapeHtml(formatDate(output.uploadedAt || output.lastModified))} · ${escapeHtml(formatBytes(output.size || 0))}</p>
      </div>
      <div class="drive-row-actions">
        ${canPreview(output) ? actionButton("预览", "preview", output.path) : ""}
        ${actionButton("链接", "copy-link", output.path)}
        ${actionButton("下载", "download", output.path)}
      </div>
    </article>
  `;
}

function renderTopicCard(topic: DriveOverviewTopic): string {
  return `
    <article class="drive-topic-card">
      <div>
        <button class="drive-title-button" type="button" data-action="open-topic" data-prefix="${escapeAttr(topic.prefix)}">${escapeHtml(topic.name)}</button>
        <p>${escapeHtml(topic.description || "暂无专题说明。")}</p>
      </div>
      <div class="drive-topic-card-meta">
        <span>${topic.outputCount} 个成果</span>
        <span>更新 ${escapeHtml(formatDateOnly(topic.updatedAt))}</span>
      </div>
    </article>
  `;
}

function renderFileTable(files: DriveFile[], options: { outputMode: boolean; empty: string }): string {
  if (!files.length) {
    return options.empty ? renderEmpty("ph-files", options.empty, "") : "";
  }
  return `
    <div class="drive-file-table" role="table">
      <div class="drive-file-row drive-file-row-head" role="row">
        <span>名称</span><span>类型</span><span>上传者</span><span>更新</span><span>操作</span>
      </div>
      ${files.map((file) => renderFileRow(file, options.outputMode)).join("")}
    </div>
  `;
}

function renderFileRow(file: DriveFile, outputMode: boolean): string {
  return `
    <div class="drive-file-row" role="row">
      <span class="drive-file-name">
        <i class="ph ${fileIconName(file)}" aria-hidden="true"></i>
        <span>${escapeHtml(file.name)}</span>
      </span>
      <span>${escapeHtml(fileKindLabel(file))}</span>
      <span>${escapeHtml(file.uploadedBy || "-")}</span>
      <span>${escapeHtml(formatDate(file.uploadedAt || file.lastModified))}</span>
      <span class="drive-row-actions">
        ${canPreview(file) ? actionButton("预览", "preview", file.path) : ""}
        ${outputMode ? actionButton("链接", "copy-link", file.path) : ""}
        ${actionButton("下载", "download", file.path)}
        ${actionButton("删除", "delete-file", file.path, file.name, true)}
      </span>
    </div>
  `;
}

function renderFolderList(folders: DriveFolder[]): string {
  if (!folders.length) {
    return "";
  }
  return `
    <div class="drive-folder-grid">
      ${folders
        .map(
          (folder) => `
            <button class="drive-folder-tile" type="button" data-action="open-folder" data-path="${escapeAttr(folder.path)}">
              <i class="ph ph-folder" aria-hidden="true"></i>
              <span>${escapeHtml(folder.name)}</span>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderBreadcrumbs(prefix: string): string {
  const topicPrefix = state.topic?.topic.prefix || "";
  const segments = prefix.split("/").filter(Boolean);
  const parts: string[] = [
    `<button type="button" data-action="open-folder" data-path="${escapeAttr(topicPrefix)}">${escapeHtml(state.topic?.topic.name || "专题")}</button>`,
  ];
  let current = "";
  for (const segment of segments) {
    current += `${segment}/`;
    if (current === topicPrefix) {
      continue;
    }
    parts.push(`<button type="button" data-action="open-folder" data-path="${escapeAttr(current)}">${escapeHtml(segment)}</button>`);
  }
  return `<nav class="drive-breadcrumbs" aria-label="当前资料目录">${parts.join("<span>/</span>")}</nav>`;
}

function renderPreviewDrawer(): string {
  if (!state.preview) {
    return "";
  }
  const preview = state.preview;
  const body = preview.loading
    ? renderInlineSkeleton()
    : preview.html
      ? `<article class="drive-preview-markdown">${preview.html}</article>`
      : preview.url
        ? `<iframe class="drive-preview-frame" src="${escapeAttr(preview.url)}" title="${escapeAttr(preview.title)}"></iframe>`
        : renderEmpty("ph-eye-slash", "无法预览", "请下载文件后查看。");
  return `
    <wa-drawer data-preview-drawer open placement="end" label="${escapeAttr(preview.title)}" style="--size: min(980px, 94vw);">
      <div class="drive-preview-body">${body}</div>
      <div slot="footer" class="drive-drawer-footer">
        ${controlButton("复制链接", "ph-link", "copy-link", false, preview.file.path)}
        ${controlButton("下载", "ph-download-simple", "download", true, preview.file.path)}
      </div>
    </wa-drawer>
  `;
}

function renderDeleteDialogMarkup(): string {
  if (!state.pendingDelete) {
    return "";
  }
  const target = state.pendingDelete;
  const title = target.type === "topic" ? "确认删除专题" : "确认删除文件";
  const message =
    target.type === "topic"
      ? `将永久删除专题「${target.name}」及其全部资料、提示词、成果和临时 manifest。此操作不可恢复。`
      : `将永久删除「${target.name}」。此操作不会删除其他文件，但无法从资料库恢复。`;
  const disabled = state.deleteConfirmText !== target.name ? "disabled" : "";
  return `
    <wa-dialog data-delete-dialog open label="${escapeAttr(title)}" style="--width: min(520px, 94vw);">
      <div class="drive-delete-body">
        <p>${escapeHtml(message)}</p>
        <label class="drive-field">
          <span>请输入完整${target.type === "topic" ? "专题名" : "文件名"}以确认删除</span>
          <input data-delete-confirm-input type="text" autocomplete="off" value="${escapeAttr(state.deleteConfirmText)}" />
        </label>
      </div>
      <div slot="footer" class="drive-dialog-actions">
        <button class="drive-control" type="button" data-action="cancel-delete">取消</button>
        <button class="drive-control drive-control-danger" type="button" data-action="confirm-delete" ${disabled}>永久删除</button>
      </div>
    </wa-dialog>
  `;
}

function renderUploadProgress(): string {
  if (!state.upload.active) {
    return "";
  }
  const progress = `
    <div class="drive-upload-progress" data-upload-progress>
      <span>${escapeHtml(state.upload.name)}</span>
      <strong>${state.upload.percent}%</strong>
      <wa-progress-bar value="${state.upload.percent}" max="100"></wa-progress-bar>
    </div>
  `;
  const target = document.querySelector("[data-upload-progress]");
  if (target) {
    target.outerHTML = progress;
  }
  return progress;
}

function renderOverviewSkeleton(): string {
  return `
    <section class="drive-dashboard">
      <div class="drive-skeleton-block is-head"></div>
      <div class="drive-metrics">
        <div class="drive-skeleton-block"></div>
        <div class="drive-skeleton-block"></div>
        <div class="drive-skeleton-block"></div>
      </div>
      <div class="drive-two-column">
        <div class="drive-skeleton-block is-panel"></div>
        <div class="drive-skeleton-block is-panel"></div>
      </div>
    </section>
  `;
}

function renderTopicSkeleton(): string {
  return `
    <section class="drive-topic-workbench">
      <div class="drive-skeleton-block is-head"></div>
      <div class="drive-skeleton-block is-tabs"></div>
      <div class="drive-skeleton-block is-panel"></div>
    </section>
  `;
}

function renderInlineSkeleton(): string {
  return `
    <div class="drive-inline-skeleton">
      <span></span><span></span><span></span>
    </div>
  `;
}

function renderEmpty(icon: string, title: string, body: string): string {
  return `
    <div class="drive-empty-state">
      <i class="ph ${icon}" aria-hidden="true"></i>
      <strong>${escapeHtml(title)}</strong>
      ${body ? `<p>${escapeHtml(body)}</p>` : ""}
    </div>
  `;
}

function metricCard(label: string, value: string, helper: string): string {
  return `
    <article class="drive-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(helper)}</p>
    </article>
  `;
}

function tabButton(tab: TopicTab, label: string, icon: string): string {
  const selected = state.activeTab === tab;
  return `
    <button type="button" role="tab" aria-selected="${selected}" class="${selected ? "is-active" : ""}" data-action="tab" data-tab="${tab}">
      <i class="ph ${icon}" aria-hidden="true"></i>
      ${escapeHtml(label)}
    </button>
  `;
}

function controlButton(label: string, icon: string, action: string, primary = false, path = "", extraClass = ""): string {
  return `
    <button class="drive-control ${primary ? "drive-control-primary" : ""} ${escapeAttr(extraClass)}" type="button" data-action="${escapeAttr(action)}" ${path ? `data-path="${escapeAttr(path)}"` : ""}>
      <i class="ph ${icon}" aria-hidden="true"></i>
      ${escapeHtml(label)}
    </button>
  `;
}

function iconButton(label: string, icon: string, action: string): string {
  return `
    <wa-tooltip content="${escapeAttr(label)}">
      <button class="drive-icon-button" type="button" data-action="${escapeAttr(action)}" aria-label="${escapeAttr(label)}">
        <i class="ph ${icon}" aria-hidden="true"></i>
      </button>
    </wa-tooltip>
  `;
}

function actionButton(label: string, action: string, path: string, name = "", danger = false): string {
  return `
    <button class="drive-table-action ${danger ? "is-danger" : ""}" type="button" data-action="${escapeAttr(action)}" data-path="${escapeAttr(path)}" ${name ? `data-name="${escapeAttr(name)}"` : ""}>
      ${escapeHtml(label)}
    </button>
  `;
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
  render();
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
  return [...outputs, ...materials].find((file) => file.path === path);
}

function isUnauthorized(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "status" in error && (error as { status?: number }).status === 401);
}

async function writeClipboard(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value: unknown): string {
  return escapeHtml(value);
}
