import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/drawer/drawer.js";
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "pdfjs-dist/web/pdf_viewer.css";
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
import { renderIcon as renderDriveIcon } from "./icons";
import type {
  DriveFile,
  DriveFolder,
  DriveListResult,
  DriveOverview,
  DriveOverviewTopic,
  OwnerCandidatesResponse,
  PreviewKind,
  TopicDetail,
  TopicTab,
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
  isMaterialDirectoryEmpty,
  normalizeClientRelativePath,
  previewKindForFile,
  shouldRefreshAfterMutation,
  sortFilesByFreshness,
  visibleMaterialFiles,
  visibleMaterialFolders,
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
  qaQuestion: string;
  owner: string;
  ownerConfirmName: string;
}

interface QaChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  error?: boolean;
  excludeFromHistory?: boolean;
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
  upload: { active: boolean; name: string; percent: number; overallPercent: number; total: number };
  preview: PreviewState | null;
  pendingDelete: { type: "file" | "topic"; path?: string; prefix?: string; name: string } | null;
  pendingSettingsPublish: boolean;
  pendingUploadSelection: "file" | "folder" | null;
  deleteConfirmText: string;
  busyAction: "agent-context-task" | null;
  qaMessages: QaChatMessage[];
  qaStreaming: boolean;
  ownerCandidates: OwnerCandidatesResponse | null;
  drafts: DraftState;
}

interface PresignedUpload {
  url: string;
  path: string;
  contentType: string;
}

interface UploadCompletion {
  path: string;
  size: number;
  contentType: string;
  kind: "material" | "output";
}

interface UploadCompleteBatchResponse {
  ok: true;
  files: DriveFile[];
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
  activeTab: "qa",
  overview: null,
  topic: null,
  materialList: null,
  materialPrefix: "",
  status: "",
  statusTone: "neutral",
  loading: false,
  upload: { active: false, name: "", percent: 0, overallPercent: 0, total: 0 },
  preview: null,
  pendingDelete: null,
  pendingSettingsPublish: false,
  pendingUploadSelection: null,
  deleteConfirmText: "",
  busyAction: null,
  qaMessages: [],
  qaStreaming: false,
  ownerCandidates: null,
  drafts: {
    loginName: "",
    accessCode: "",
    topicName: "",
    createKeywords: "",
    settingsKeywords: "",
    qaQuestion: "",
    owner: "",
    ownerConfirmName: "",
  },
};

let previewVersion = 0;
let previewReturnFocus: HTMLElement | null = null;
let featuredIndex = 0;
let featuredTimer: number | null = null;
let featuredPaused = false;
let qaAbortController: AbortController | null = null;

if (!rootElement) {
  throw new Error("Missing [data-drive-root] mount element.");
}

const root = rootElement;

root.replaceChildren();
root.addEventListener("click", (event) => void handleClick(event));
root.addEventListener("submit", (event) => void handleSubmit(event));
root.addEventListener("change", (event) => void handleChange(event));
root.addEventListener("input", handleInput);
root.addEventListener("pointerover", (event) => setFeaturedPaused(Boolean((event.target as HTMLElement).closest("[data-featured-carousel]"))));
root.addEventListener("pointerout", (event) => {
  const carousel = (event.target as HTMLElement).closest("[data-featured-carousel]");
  if (carousel && !carousel.contains(event.relatedTarget as Node | null)) setFeaturedPaused(false);
});
root.addEventListener("focusin", (event) => { if ((event.target as HTMLElement).closest("[data-featured-carousel]")) setFeaturedPaused(true); });
root.addEventListener("focusout", (event) => {
  const carousel = (event.target as HTMLElement).closest("[data-featured-carousel]");
  if (carousel && !carousel.contains(event.relatedTarget as Node | null)) setFeaturedPaused(false);
});
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
  if (target.matches("[data-settings-confirm-dialog]")) {
    state.pendingSettingsPublish = false;
    renderApp();
  }
  if (target.matches("[data-upload-reminder-dialog]")) {
    state.pendingUploadSelection = null;
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
  if (!form.matches("[data-login-form], [data-create-form], [data-settings-form], [data-qa-form]")) {
    return;
  }
  event.preventDefault();
  if (form.matches("[data-login-form]")) {
    await submitLogin();
  } else if (form.matches("[data-create-form]")) {
    await submitCreateTopic();
  } else if (form.matches("[data-qa-form]")) {
    await submitQa();
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
    await openTopic(prefix || path, "qa");
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
  } else if (action === "confirm-settings-publish") {
    await publishTopicSettings();
  } else if (action === "cancel-settings-publish") {
    closeSettingsPublishDialog();
  } else if (action === "request-file-upload") {
    openUploadReminder("file");
  } else if (action === "request-folder-upload") {
    openUploadReminder("folder");
  } else if (action === "continue-upload") {
    continueUploadSelection();
  } else if (action === "cancel-upload") {
    closeUploadReminder();
  } else if (action === "agent-context-task") {
    await copyAgentContextTask();
  } else if (action === "qa-stop") {
    stopQa();
  } else if (action === "qa-clear") {
    clearQa();
  } else if (action === "qa-retry") {
    await retryQa(target.dataset.messageId || "");
  } else if (action === "refresh") {
    await refreshCurrent();
  } else if (action === "set-featured") {
    await setFeaturedOutput(path);
  } else if (action === "transfer-owner") {
    await transferTopicOwner();
  } else if (action === "remove-owner-candidate") {
    await removeOwnerCandidate(name);
  } else if (action === "featured-prev") {
    await showFeatured(featuredIndex - 1, target);
  } else if (action === "featured-next") {
    await showFeatured(featuredIndex + 1, target);
  } else if (action === "featured-go") {
    await showFeatured(Number(target.dataset.index || 0), target);
  }
}

async function handleChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement | HTMLSelectElement;
  const draft = input.dataset.draft as keyof DraftState | undefined;
  if (draft) {
    state.drafts[draft] = input.value;
  }
  if (input.matches("[data-file-input]")) {
    const fileInput = input as HTMLInputElement;
    const files = Array.from(fileInput.files || []);
    fileInput.value = "";
    await uploadFiles(files, (file) => file.name);
  } else if (input.matches("[data-folder-input]")) {
    const fileInput = input as HTMLInputElement;
    const files = Array.from(fileInput.files || []);
    fileInput.value = "";
    await uploadFiles(files, (file) => file.webkitRelativePath || file.name);
  }
}

function handleInput(event: Event): void {
  const input = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
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
    setStatus("专题已创建，分析口径已发布并展示给所有人。", "success");
    await openTopic(detail.topic.prefix, "qa");
  } catch (error) {
    showError(error);
    renderApp();
  } finally {
    setLoading(false);
  }
}

async function submitTopicSettings(): Promise<void> {
  if (!state.topic || !state.topic.canEditAnalysisScope) {
    return;
  }
  state.pendingSettingsPublish = true;
  renderApp();
}

async function publishTopicSettings(): Promise<void> {
  if (!state.topic || !state.topic.canEditAnalysisScope || !state.pendingSettingsPublish) return;
  try {
    state.pendingSettingsPublish = false;
    setLoading(true, "正在发布分析口径...");
    state.topic = await api<TopicDetail>("/topic", {
      method: "PUT",
      body: {
        prefix: state.topic.topic.prefix,
        analysisKeywords: state.drafts.settingsKeywords,
      },
    });
    state.drafts.settingsKeywords = state.topic.topic.analysisKeywords;
    setStatus("分析口径已发布并展示给所有人。", "success");
    renderApp();
  } catch (error) {
    showError(error);
    renderApp();
  } finally {
    setLoading(false);
  }
}

function closeSettingsPublishDialog(): void {
  state.pendingSettingsPublish = false;
  renderApp();
}

function openUploadReminder(kind: "file" | "folder"): void {
  state.pendingUploadSelection = kind;
  renderApp();
}

function closeUploadReminder(): void {
  state.pendingUploadSelection = null;
  renderApp();
}

function continueUploadSelection(): void {
  const kind = state.pendingUploadSelection;
  if (!kind) {
    return;
  }
  state.pendingUploadSelection = null;
  renderApp();
  root.querySelector<HTMLInputElement>(kind === "file" ? "[data-file-input]" : "[data-folder-input]")?.click();
}

async function transferTopicOwner(): Promise<void> {
  if (!state.topic?.canTransferTopicOwner) return;
  const owner = state.drafts.owner;
  if (!owner || owner === state.topic.topic.owner) {
    setStatus("请选择不同的新负责人。", "danger");
    renderApp();
    return;
  }
  if (state.drafts.ownerConfirmName.trim() !== state.topic.topic.name) {
    setStatus("请输入完整专题名以确认转交。", "danger");
    renderApp();
    return;
  }
  try {
    setLoading(true, "正在转交专题负责人...");
    state.topic = await api<TopicDetail>("/topic", {
      method: "PUT",
      body: { prefix: state.topic.topic.prefix, owner, confirmName: state.drafts.ownerConfirmName },
    });
    if (!canViewSettings()) {
      state.activeTab = "qa";
    }
    state.drafts.owner = state.topic.topic.owner;
    state.drafts.ownerConfirmName = "";
    setStatus(`专题负责人已转交给 ${state.topic.topic.owner}。`, "success");
    renderApp();
  } catch (error) {
    showError(error);
    renderApp();
  } finally {
    setLoading(false);
  }
}

async function removeOwnerCandidate(displayName: string): Promise<void> {
  if (!state.ownerCandidates?.canManage || !window.confirm(`确认从负责人候选名单中移除“${displayName}”吗？`)) return;
  try {
    setLoading(true, "正在更新负责人候选名单...");
    const result = await api<{ ok: true; candidates: string[] }>("/owner-candidates", {
      method: "DELETE",
      body: { displayName },
    });
    state.ownerCandidates = { ...state.ownerCandidates, candidates: result.candidates };
    setStatus(`已移除负责人候选 ${displayName}。`, "success");
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
  clearQa(false);
  try {
    state.mode = "overview";
    state.loading = true;
    state.topic = null;
    state.pendingSettingsPublish = false;
    state.materialList = null;
    state.materialPrefix = "";
    renderApp();
    const overview = await api<DriveOverview>("/overview", { signal });
    if (signal.aborted) {
      return;
    }
    state.overview = overview;
    featuredIndex = 0;
    state.loading = false;
    setStatus(successMessage || overviewStatus(overview), successMessage ? "success" : "neutral");
    renderApp();
    const first = featuredItems()[0];
    const trigger = root.querySelector<HTMLElement>("[data-featured-carousel]");
    if (first && trigger) await openPreview(first.output.path, trigger);
    scheduleFeaturedRotation();
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

async function openTopic(prefix: string, tab: TopicTab = "qa"): Promise<void> {
  const signal = beginRequest("topic");
  cancelRequest("materials");
  closePreview(false);
  try {
    state.mode = "topic";
    state.activeTab = tab;
    state.loading = true;
    state.materialPrefix = prefix;
    if (state.topic?.topic.prefix !== prefix) {
      clearQa(false);
    }
    renderApp();
    const [topic, materialList, ownerCandidates] = await Promise.all([
      api<TopicDetail>(`/topic?${new URLSearchParams({ prefix }).toString()}`, { signal }),
      listAllDirectory(prefix, signal),
      api<OwnerCandidatesResponse>("/owner-candidates", { signal }),
    ]);
    if (signal.aborted) {
      return;
    }
    state.topic = topic;
    if (state.activeTab === "settings" && !canViewSettings(topic)) {
      state.activeTab = "qa";
    }
    if (state.activeTab === "agent" && !topic.canGenerateContext) {
      state.activeTab = "qa";
    }
    state.ownerCandidates = ownerCandidates;
    state.materialList = materialList;
    state.materialPrefix = materialList.prefix;
    state.drafts.settingsKeywords = topic.topic.analysisKeywords;
    state.drafts.owner = topic.topic.owner;
    state.drafts.ownerConfirmName = "";
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
  if (!["qa", "outputs", "materials", "agent", "settings"].includes(tab)) {
    return;
  }
  if (tab === "settings" && !canViewSettings()) {
    return;
  }
  if (tab === "agent" && !state.topic?.canGenerateContext) {
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
  clearQa(false);
  closePreview(false);
  state.mode = "login";
  state.overview = null;
  state.topic = null;
  state.pendingSettingsPublish = false;
  state.ownerCandidates = null;
  setStatus("已退出登录。");
  renderApp();
}

function showCreateTopic(): void {
  closePreview(false);
  state.mode = "create";
  state.topic = null;
  state.pendingSettingsPublish = false;
  state.materialList = null;
  setStatus("填写专题名称和分析口径，系统会创建成果目录。");
  renderApp();
  queueMicrotask(() => document.querySelector<HTMLInputElement>('[name="topicName"]')?.focus());
}

async function copyAgentContextTask(): Promise<void> {
  if (!state.topic?.canGenerateContext) {
    return;
  }
  try {
    state.busyAction = "agent-context-task";
    setStatus("正在生成完整 Context 任务...");
    renderApp();
    const data = await api<{ prompt: string; fileCount: number; uploadExpiresIn: number }>("/agent-context-task", {
      method: "POST",
      body: { prefix: state.topic.topic.prefix },
    });
    await writeClipboard(data.prompt);
    setStatus(`完整 Context 任务已复制。稳定资料 ${data.fileCount || 0} 个，回传授权 ${data.uploadExpiresIn || 0} 秒内有效。`, "success");
  } catch (error) {
    showError(error);
  } finally {
    state.busyAction = null;
    renderApp();
  }
}

async function submitQa(questionOverride?: string): Promise<void> {
  if (!state.topic?.hasCurrentContext || state.qaStreaming) {
    return;
  }
  const question = (questionOverride ?? state.drafts.qaQuestion).trim();
  if (!question) {
    setStatus("请输入问题。", "danger");
    renderApp();
    return;
  }
  if (question.length > 3000) {
    setStatus("问题不能超过 3000 字。", "danger");
    renderApp();
    return;
  }

  const completedHistory = completedQaHistory();
  const userMessage: QaChatMessage = { id: qaMessageId(), role: "user", content: question };
  const assistantMessage: QaChatMessage = { id: qaMessageId(), role: "assistant", content: "", pending: true };
  state.qaMessages.push(userMessage, assistantMessage);
  state.drafts.qaQuestion = "";
  state.qaStreaming = true;
  const controller = new AbortController();
  qaAbortController = controller;
  setStatus("正在生成回答...");
  renderApp();

  try {
    const response = await fetch(`${apiBase}/qa`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      signal: controller.signal,
      body: JSON.stringify({
        prefix: state.topic.topic.prefix,
        messages: [...completedHistory, userMessage].map(({ role, content }) => ({ role, content })),
      }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: unknown };
      throw new Error(typeof data.error === "string" ? data.error : `问答请求失败（${response.status}）`);
    }
    if (!response.body) {
      throw new Error("模型没有返回流式响应");
    }
    await consumeQaStream(response.body, assistantMessage);
    if (qaAbortController !== controller) {
      return;
    }
    if (!assistantMessage.content) {
      throw new Error("模型没有返回可显示的流式内容");
    }
    assistantMessage.pending = false;
    setStatus("回答完成。", "success");
  } catch (error) {
    if (qaAbortController !== controller) {
      return;
    }
    assistantMessage.pending = false;
    if (isAbort(error)) {
      if (!assistantMessage.content) {
        state.qaMessages = state.qaMessages.filter((message) => message.id !== assistantMessage.id && message.id !== userMessage.id);
      } else {
        assistantMessage.excludeFromHistory = true;
      }
      setStatus("已停止生成。", "neutral");
    } else {
      assistantMessage.error = true;
      setStatus(error instanceof Error ? error.message : "问答请求失败", "danger");
    }
  } finally {
    if (qaAbortController === controller) {
      qaAbortController = null;
      state.qaStreaming = false;
      renderApp();
    }
  }
}

async function consumeQaStream(stream: ReadableStream<Uint8Array>, assistantMessage: QaChatMessage): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = /^event:\s*(.+)$/m.exec(block)?.[1]?.trim();
      const dataText = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      const data = dataText ? (JSON.parse(dataText) as { content?: unknown; error?: unknown }) : {};
      if (event === "delta" && typeof data.content === "string") {
        assistantMessage.content += data.content;
        renderApp();
      } else if (event === "error") {
        throw new Error(typeof data.error === "string" ? data.error : "模型流式输出失败");
      }
      boundary = buffer.indexOf("\n\n");
    }
    if (done) {
      break;
    }
  }
}

function stopQa(): void {
  qaAbortController?.abort();
}

function clearQa(shouldRender = true): void {
  qaAbortController?.abort();
  qaAbortController = null;
  state.qaMessages = [];
  state.qaStreaming = false;
  state.drafts.qaQuestion = "";
  if (shouldRender) {
    setStatus("当前浏览器会话已清空。", "success");
    renderApp();
  }
}

async function retryQa(messageId: string): Promise<void> {
  if (state.qaStreaming) return;
  const failedIndex = state.qaMessages.findIndex((message) => message.id === messageId && message.role === "assistant" && message.error);
  if (failedIndex < 1) return;
  const question = state.qaMessages[failedIndex - 1];
  if (question.role !== "user") return;
  state.qaMessages.splice(failedIndex - 1, 2);
  await submitQa(question.content);
}

function completedQaHistory(): QaChatMessage[] {
  const completed: QaChatMessage[] = [];
  for (let index = 0; index + 1 < state.qaMessages.length; index += 2) {
    const user = state.qaMessages[index];
    const assistant = state.qaMessages[index + 1];
    if (user.role !== "user" || assistant.role !== "assistant" || assistant.pending || assistant.error || assistant.excludeFromHistory) {
      continue;
    }
    completed.push(user, assistant);
  }
  return completed.slice(-12);
}

function qaMessageId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
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
  if (!targetPrefix.startsWith(`${topicPrefix}资料/`) && !targetPrefix.startsWith(`${topicPrefix}周报/`)) {
    setStatus("请先进入“资料”或“周报”目录再上传。", "danger");
    renderApp();
    return;
  }
  const entries = files.map((file) => ({ file, relativePath: normalizeClientRelativePath(relativePathForFile(file)) }));
  let uppy: Uppy<UppyMeta, UppyBody> | null = null;

  try {
    const conflicts = await findUploadConflicts(entries, targetPrefix);
    if (conflicts.length && !window.confirm(`将覆盖 ${conflicts.length} 个同路径同名文件。是否继续上传？`)) {
      return;
    }
    state.upload = { active: true, name: "准备上传...", percent: 0, overallPercent: 0, total: entries.length };
    renderApp();

    const signedUploads = new Map<string, PresignedUpload>();
    const completed: UploadCompletion[] = [];
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
        ...state.upload,
        name: String(file.meta.relativePath || file.name),
        percent: Math.round((progress.bytesUploaded / progress.bytesTotal) * 100),
      };
      renderApp();
    });
    uppy.on("progress", (overallPercent) => {
      if (!state.upload.active) {
        return;
      }
      state.upload = { ...state.upload, overallPercent };
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
      completed.push({
        path: upload.path,
        size: fileData?.size || 0,
        contentType: upload.contentType,
        kind: upload.path.startsWith(`${topicPrefix}outputs/`) ? "output" : "material",
      });
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
    for (let index = 0; index < completed.length; index += 1000) {
      await api<UploadCompleteBatchResponse>("/upload-complete", {
        method: "POST",
        body: { files: completed.slice(index, index + 1000) },
      });
    }
    if (result?.failed?.length) {
      throw new Error(`${result.failed.length} 个文件上传失败。`);
    }
    state.upload = { active: false, name: "", percent: 0, overallPercent: 0, total: 0 };
    setStatus(`上传完成，已登记 ${entries.length} 个文件。`, "success");
    const currentTopicPrefix = state.topic?.topic.prefix;
    const currentMaterialPrefix = state.materialPrefix || currentTopicPrefix;
    if (currentTopicPrefix === topicPrefix && state.activeTab === "materials" && currentMaterialPrefix === targetPrefix) {
      await loadMaterialDirectory(targetPrefix);
    } else {
      renderApp();
    }
  } catch (error) {
    state.upload = { active: false, name: "", percent: 0, overallPercent: 0, total: 0 };
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
        ${renderPreviewDrawer()} ${renderDeleteDialogMarkup()} ${renderSettingsPublishDialogMarkup()} ${renderUploadReminderDialogMarkup()}
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
      <nav class="drive-nav" aria-label="专题资料库导航"><a href="./index.html">${renderDriveIcon("house")}返回首页</a></nav>
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
        ${renderDriveIcon(state.loading ? "circle-notch" : "info", "regular", state.loading ? "drive-spin" : "")}
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
          ${renderDriveIcon("arrow-right", "bold")}进入资料库
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
  const featured = featuredItems();
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
          <div class="drive-panel-head"><h2>精选成果</h2><span>${featured.length ? `${featuredIndex + 1} / ${featured.length}` : "暂无精选"}</span></div>
          ${featured.length
            ? renderFeaturedCarousel(featured[featuredIndex] || featured[0], featured.length)
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
          <span>全局分析口径（他人不可修改）</span>
          ${renderAnalysisScopeGuidance()}
          <textarea data-draft="createKeywords" name="analysisKeywords" rows="10" .value=${state.drafts.createKeywords} required></textarea>
        </label>
        <div class="drive-form-actions">
          <button class="drive-control" type="button" data-action="cancel-create">${renderDriveIcon("x-circle")}取消</button>
          <button class="drive-control drive-control-primary" type="submit" ?disabled=${state.loading}>
            ${renderDriveIcon("check", "bold")}创建专题
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
        <button class="drive-link-button" type="button" data-action="back-overview">${renderDriveIcon("arrow-left")}成果概览</button>
        <div class="drive-topic-title-row">
          <div><h1>${topic.name}</h1><p>${topic.analysisKeywords || "尚未填写分析口径。"}</p></div>
          <div class="drive-topic-meta">
            <span>专题负责人 ${topic.owner || "-"}</span><span>更新 ${formatDate(topic.updatedAt)}</span><span>${topic.prefix}</span>
          </div>
        </div>
      </div>
      <div class="drive-tabs" role="tablist" aria-label="专题工作区">
        ${tabButton("qa", "问答", "ph-chat-circle-dots")}${tabButton("materials", "资料", "ph-files")}${tabButton("outputs", "成果", "ph-package")}${state.topic.canGenerateContext ? tabButton("agent", "Agent", "ph-terminal-window") : nothing}${canViewSettings() ? tabButton("settings", "设置", "ph-sliders-horizontal") : nothing}
      </div>
      ${state.activeTab === "qa" ? renderQaTab() : nothing}
      ${state.activeTab === "agent" && state.topic.canGenerateContext ? renderAgentTab() : nothing}
      ${state.activeTab === "materials" ? renderMaterialsTab() : nothing}
      ${state.activeTab === "outputs" ? renderOutputsTab() : nothing}
      ${state.activeTab === "settings" && canViewSettings() ? renderSettingsTab() : nothing}
    </section>
  `;
}

function canViewSettings(topic: TopicDetail | null = state.topic): boolean {
  return Boolean(topic?.canEditAnalysisScope);
}

function renderOutputsTab(): TemplateResult {
  const outputs = sortFilesByFreshness(state.topic?.outputs || []);
  return html`
    <section class="drive-tab-panel" role="tabpanel" aria-label="成果">
      <div class="drive-panel-head"><h2>专题成果</h2><span>${outputs.length} 个文件</span></div>
      ${outputs.length
        ? renderFileTable(outputs, { outputMode: true, empty: "" })
        : renderEmpty("ph-package", "这个专题还没有成果", "专题负责人可在 Agent 中复制单一任务，生成 Markdown Context。")}
    </section>
  `;
}

function renderMaterialsTab(): TemplateResult {
  const listing = state.materialList;
  const topicPrefix = state.topic?.topic.prefix || "";
  const folders = visibleMaterialFolders(listing?.folders || []);
  const files = visibleMaterialFiles(listing?.files || []);
  const isEmpty = listing ? isMaterialDirectoryEmpty(listing.folders, listing.files) : false;
  const currentPrefix = state.materialPrefix || topicPrefix;
  const isRoot = currentPrefix === topicPrefix;
  const isMaterials = currentPrefix.startsWith(`${topicPrefix}资料/`);
  const isWeekly = currentPrefix.startsWith(`${topicPrefix}周报/`);
  const canUpload = isMaterials || isWeekly;
  return html`
    <section class="drive-tab-panel" role="tabpanel" aria-label="资料">
      <div class="drive-material-toolbar">
        <div><h2>资料库</h2>${renderBreadcrumbs(state.materialPrefix || topicPrefix)}</div>
        ${canUpload
          ? html`<div class="drive-upload-actions">
              <button class="drive-control drive-control-primary drive-upload-trigger" type="button" data-action="request-file-upload">
                ${renderDriveIcon("upload-simple", "bold")}上传文件
              </button>
              <button class="drive-control drive-upload-trigger" type="button" data-action="request-folder-upload">
                ${renderDriveIcon("folder-simple-plus")}上传文件夹
              </button>
              <input data-file-input type="file" multiple hidden />
              <input data-folder-input type="file" webkitdirectory multiple hidden />
            </div>`
          : nothing}
      </div>
      ${isRoot
        ? html`<div class="drive-category-grid">
            <button type="button" class="drive-category-card" data-action="open-folder" data-path=${`${topicPrefix}资料/`}>
              ${renderDriveIcon("books", "duotone", "ui-icon-lg")}<span><strong>资料</strong><small>稳定资料，纳入 Context 方法论生成</small></span>${renderDriveIcon("arrow-right")}
            </button>
            <button type="button" class="drive-category-card" data-action="open-folder" data-path=${`${topicPrefix}周报/`}>
              ${renderDriveIcon("calendar-dots", "duotone", "ui-icon-lg")}<span><strong>周报</strong><small>持续更新，首版不参与网页 AI 问答</small></span>${renderDriveIcon("arrow-right")}
            </button>
          </div>
          <wa-callout class="drive-agent-callout" variant="neutral"><span slot="icon">${renderDriveIcon("info")}</span>根目录历史文件继续按稳定资料兼容读取；新上传请先进入“资料”或“周报”。</wa-callout>`
        : nothing}
      ${isWeekly
        ? html`<wa-callout class="drive-agent-callout" variant="warning"><span slot="icon">${renderDriveIcon("warning")}</span>周报当前仅用于资料维护，暂未纳入网页 AI 问答。</wa-callout>`
        : nothing}
      ${listing
        ? isEmpty
          ? renderEmpty("ph-files", "当前目录没有资料。", "")
          : renderMaterialTable(folders, files)
        : renderInlineSkeleton()}
    </section>
  `;
}

function renderAgentTab(): TemplateResult {
  const hasKeywords = Boolean(state.topic?.topic.analysisKeywords.trim());
  return html`
    <section class="drive-tab-panel" role="tabpanel" aria-label="Agent">
      ${hasKeywords
        ? nothing
        : html`<wa-callout class="drive-agent-callout" variant="warning"><span slot="icon">${renderDriveIcon("warning")}</span>请先由专题负责人在设置中填写分析口径，再执行 Agent 流程。</wa-callout>`}
      <div class="drive-agent-grid drive-agent-grid-single">
        <div class="drive-agent-card">
          <h2>生成完整网页 Context</h2>
          <p>复制后交给本地 Agent。任务会读取全部稳定资料，直接生成、验证并回传一份详尽的 UTF-8 Markdown Context；周报不会进入本次分析。</p>
          <button class="drive-control drive-control-primary" type="button" data-action="agent-context-task" ?disabled=${!hasKeywords || state.busyAction !== null}>
            ${renderDriveIcon("clipboard-text", "bold")}${state.busyAction === "agent-context-task" ? "正在生成..." : "复制完整 Context 任务"}
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderQaTab(): TemplateResult {
  const ready = Boolean(state.topic?.hasCurrentContext);
  return html`
    <section class="drive-tab-panel drive-qa-panel" role="tabpanel" aria-label="问答">
      <div class="drive-panel-head">
        <div><h2>专题问答</h2><p>回答只依据当前最新版 Markdown Context；对话仅保存在本页面，刷新后清空。</p></div>
        ${state.qaMessages.length
          ? html`<button class="drive-control" type="button" data-action="qa-clear" ?disabled=${state.qaStreaming}>${renderDriveIcon("trash")}清空会话</button>`
          : nothing}
      </div>
      ${ready
        ? nothing
        : html`<wa-callout class="drive-agent-callout" variant="warning"><span slot="icon">${renderDriveIcon("warning")}</span>当前专题还没有可用的最新版 Context。请联系专题负责人生成并回传。</wa-callout>`}
      <div class="drive-qa-messages" aria-live="polite">
        ${state.qaMessages.length
          ? repeat(state.qaMessages, (message) => message.id, renderQaMessage)
          : renderEmpty("ph-chat-circle-dots", "可以开始提问", ready ? "答案将严格限定在当前 Context 内。" : "Context 准备完成后即可使用。")}
      </div>
      <form class="drive-qa-form" data-qa-form>
        <label class="drive-field">
          <span>您的问题</span>
          <textarea data-draft="qaQuestion" name="qaQuestion" rows="3" maxlength="3000" placeholder="请输入关于该专题的问题" .value=${state.drafts.qaQuestion} ?disabled=${!ready || state.qaStreaming}></textarea>
        </label>
        <div class="drive-form-actions">
          ${state.qaStreaming
            ? html`<button class="drive-control drive-control-danger" type="button" data-action="qa-stop">${renderDriveIcon("stop-circle")}停止生成</button>`
            : html`<button class="drive-control drive-control-primary" type="submit" ?disabled=${!ready || !state.drafts.qaQuestion.trim()}>${renderDriveIcon("paper-plane-tilt", "bold")}发送问题</button>`}
        </div>
      </form>
    </section>
  `;
}

function renderQaMessage(message: QaChatMessage): TemplateResult {
  const rendered = message.role === "assistant" && message.content
    ? DOMPurify.sanitize(markdown.render(message.content))
    : "";
  return html`
    <article class=${classMap({ "drive-qa-message": true, "is-user": message.role === "user", "is-error": Boolean(message.error) })}>
      <header>${message.role === "user" ? "您" : "AI"}${message.pending ? html`<span>生成中</span>` : nothing}</header>
      ${message.role === "assistant"
        ? message.content
          ? html`<div class="drive-preview-markdown">${unsafeHTML(rendered)}</div>`
          : message.pending
            ? renderInlineSkeleton()
            : nothing
        : html`<p>${message.content}</p>`}
      ${message.error
        ? html`<div class="drive-qa-error"><span>本次生成失败，可重试。</span><button class="drive-table-action" type="button" data-action="qa-retry" data-message-id=${message.id}>${renderDriveIcon("arrow-clockwise")}重试</button></div>`
        : nothing}
    </article>
  `;
}

function renderSettingsTab(): TemplateResult | typeof nothing {
  if (!state.topic) {
    return nothing;
  }
  const canEdit = state.topic.canEditAnalysisScope;
  const candidates = Array.from(new Set([state.topic.topic.owner, ...(state.ownerCandidates?.candidates || [])]));
  return html`
    <section class="drive-tab-panel" role="tabpanel" aria-label="设置">
      <form class="drive-form drive-settings-form" data-settings-form>
        <label class="drive-field">
          <span>全局分析口径（他人不可修改）</span>
          ${renderAnalysisScopeGuidance()}
          <textarea data-draft="settingsKeywords" name="analysisKeywords" rows="10" .value=${state.drafts.settingsKeywords} ?readonly=${!canEdit} required></textarea>
        </label>
        <div class="drive-form-actions">
          ${canEdit
            ? html`<button class="drive-control drive-control-primary" type="submit" ?disabled=${state.loading}>${renderDriveIcon("broadcast", "bold")}确认并发布分析口径</button>`
            : nothing}
          ${state.topic.canDeleteTopic
            ? html`<button class="drive-control drive-control-danger" type="button" data-action="delete-topic">${renderDriveIcon("trash")}删除专题</button>`
            : nothing}
        </div>
        <section class="drive-owner-settings" aria-label="专题负责人设置">
          <h3>专题负责人</h3>
          <p>当前负责人：<strong>${state.topic.topic.owner || "-"}</strong>。转交后管理权限立即生效，原负责人将失去专题管理权限。</p>
          ${state.topic.canTransferTopicOwner
            ? html`
                <label class="drive-field">
                  <span>新负责人</span>
                  <select data-draft="owner" .value=${state.drafts.owner}>
                    ${candidates.map((candidate) => html`<option value=${candidate}>${candidate}</option>`)}
                  </select>
                </label>
                <label class="drive-field">
                  <span>输入完整专题名确认</span>
                  <input data-draft="ownerConfirmName" .value=${state.drafts.ownerConfirmName} placeholder=${state.topic.topic.name} />
                </label>
                <button class="drive-control drive-control-primary" type="button" data-action="transfer-owner" ?disabled=${state.loading}>
                  ${renderDriveIcon("user-switch", "bold")}转交负责人
                </button>
              `
            : nothing}
        </section>
        ${state.ownerCandidates?.canManage
          ? html`
              <section class="drive-owner-settings" aria-label="负责人候选名单管理">
                <h3>负责人候选名单</h3>
                <p>候选姓名来自成功登录记录。正在负责专题的用户无法移除。</p>
                <div class="drive-owner-candidates">
                  ${candidates.map(
                    (candidate) => html`
                      <span class="drive-owner-candidate">
                        <span>${candidate}</span>
                        ${candidate !== "汪旭" && candidate !== state.topic?.topic.owner
                          ? html`<button class="drive-icon-button" type="button" data-action="remove-owner-candidate" data-name=${candidate} aria-label=${`移除候选 ${candidate}`}>${renderDriveIcon("x")}</button>`
                          : nothing}
                      </span>
                    `,
                  )}
                </div>
              </section>
            `
          : nothing}
      </form>
    </section>
  `;
}

function renderFeaturedCarousel(item: { topic: DriveOverviewTopic; output: NonNullable<DriveOverviewTopic["featuredOutput"]> }, count: number): TemplateResult {
  const { topic, output } = item;
  return html`
    <div class="drive-featured-carousel" data-featured-carousel aria-roledescription="carousel" aria-label="精选成果">
      <article class="drive-featured-card">
        <div class="drive-file-symbol">${renderDriveIcon(fileIconName(output))}</div>
        <div class="drive-output-main">
          <button class="drive-title-button" type="button" data-action="open-topic" data-prefix=${topic.prefix}>${output.name}</button>
          <p><strong>${topic.name}</strong> · 成果创建者 ${output.uploadedBy || "-"} · 专题负责人 ${topic.owner || "-"} · ${formatDate(output.uploadedAt || output.lastModified)}</p>
        </div>
        <div class="drive-row-actions">
          ${actionButton("链接", "copy-link", output.path)}${actionButton("下载", "download", output.path)}
        </div>
      </article>
      ${renderInlinePdf(output.path)}
      ${state.preview?.file.path === output.path && state.preview.kind !== "pdf" ? renderFeaturedNonPdfPreview() : nothing}
      <div class="drive-featured-controls">
        <button class="drive-icon-button" type="button" data-action="featured-prev" aria-label="上一个精选成果" ?disabled=${count < 2}>${renderDriveIcon("caret-left")}</button>
        <div class="drive-featured-dots" aria-label="选择精选成果">${Array.from({ length: count }, (_, index) => html`<button type="button" data-action="featured-go" data-index=${index} class=${index === featuredIndex ? "is-active" : ""} aria-label=${`第 ${index + 1} 项`} aria-current=${index === featuredIndex ? "true" : "false"}></button>`)}</div>
        <button class="drive-icon-button" type="button" data-action="featured-next" aria-label="下一个精选成果" ?disabled=${count < 2}>${renderDriveIcon("caret-right")}</button>
      </div>
    </div>
  `;
}

function renderFeaturedNonPdfPreview(): TemplateResult {
  const preview = state.preview!;
  const body = preview.loading ? renderInlineSkeleton() : preview.failed ? renderEmpty("ph-eye-slash", "无法预览", "可继续查看其他精选成果。") : preview.renderedHtml ? html`<article class="drive-preview-markdown">${unsafeHTML(preview.renderedHtml)}</article>` : preview.url ? html`<iframe class="drive-preview-frame" src=${preview.url} title=${preview.title} sandbox referrerpolicy="no-referrer"></iframe>` : nothing;
  return html`<div class="drive-featured-preview">${body}</div>`;
}

function renderTopicCard(topic: DriveOverviewTopic): TemplateResult {
  return html`
    <article class="drive-topic-card">
      <div><button class="drive-title-button" type="button" data-action="open-topic" data-prefix=${topic.prefix}>${topic.name}</button><p>${topic.analysisKeywords || "尚未填写分析口径。"}</p></div>
      <div class="drive-topic-card-meta"><span>专题负责人 ${topic.owner || "-"}</span><span>${topic.outputCount} 个成果</span><span>更新 ${formatDateOnly(topic.updatedAt)}</span></div>
    </article>
  `;
}

function renderFileTable(files: DriveFile[], options: { outputMode: boolean; empty: string }): TemplateResult | typeof nothing {
  if (!files.length) {
    return options.empty ? renderEmpty("ph-files", options.empty, "") : nothing;
  }
  return html`
    <div class="drive-file-table" role="table">
      <div class="drive-file-row drive-file-row-head" role="row"><span>名称</span><span>类型</span><span>成果创建者</span><span>更新</span><span>操作</span></div>
      ${repeat(
        files,
        (file) => file.path,
        (file) => html`${renderFileRow(file, options.outputMode)}${renderInlinePdf(file.path, true)}`,
      )}
    </div>
  `;
}

function renderMaterialTable(folders: DriveFolder[], files: DriveFile[]): TemplateResult | typeof nothing {
  if (!folders.length && !files.length) {
    return nothing;
  }
  return html`
    <div class="drive-file-table" role="table">
      <div class="drive-file-row drive-file-row-head" role="row"><span>名称</span><span>类型</span><span>上传者</span><span>更新</span><span>操作</span></div>
      ${repeat(folders, (folder) => folder.path, renderFolderRow)}
      ${repeat(
        files,
        (file) => file.path,
        (file) => html`${renderFileRow(file, false)}${renderInlinePdf(file.path, true)}`,
      )}
    </div>
  `;
}

function renderFolderRow(folder: DriveFolder): TemplateResult {
  return html`
    <div class="drive-file-row" role="row">
      <span class="drive-file-name" data-label="名称">${renderDriveIcon("folder")}<span>${folder.name}</span></span>
      <span data-label="类型">文件夹</span>
      <span data-label="上传者">-</span>
      <span data-label="更新">-</span>
      <span class="drive-row-actions" data-label="操作">${actionButton("打开", "open-folder", folder.path)}</span>
    </div>
  `;
}

function renderFileRow(file: DriveFile, outputMode: boolean): TemplateResult {
  return html`
    <div class="drive-file-row" role="row">
      <span class="drive-file-name" data-label="名称">${renderDriveIcon(fileIconName(file))}<span>${file.name}</span></span>
      <span data-label="类型">${fileKindLabel(file)}</span>
      <span data-label=${outputMode ? "成果创建者" : "上传者"}>${file.uploadedBy || "-"}</span>
      <span data-label="更新">${formatDate(file.uploadedAt || file.lastModified)}</span>
      <span class="drive-row-actions" data-label="操作">
        ${outputMode && state.topic?.topic.featuredOutputPath === file.path ? html`<span class="drive-featured-badge">${renderDriveIcon("star-fill")}精选</span>` : nothing}
        ${outputMode && state.topic?.canManageFeaturedOutput && canPreview(file) && state.topic.topic.featuredOutputPath !== file.path ? actionButton("设为精选", "set-featured", file.path) : nothing}
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
  if (!preview || preview.kind === "pdf" || state.mode === "overview") {
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
        <button class="drive-control" type="button" data-action="cancel-delete">${renderDriveIcon("x-circle")}取消</button>
        <button class="drive-control drive-control-danger" type="button" data-action="confirm-delete" ?disabled=${state.deleteConfirmText !== target.name}>${renderDriveIcon("trash", "bold")}永久删除</button>
      </div>
    </wa-dialog>
  `;
}

function renderSettingsPublishDialogMarkup(): TemplateResult | typeof nothing {
  if (!state.pendingSettingsPublish || !canViewSettings()) {
    return nothing;
  }
  return html`
    <wa-dialog data-settings-confirm-dialog open label="确认发布分析口径" style="--width: min(520px, 94vw);">
      <div class="drive-delete-body">
        <p>修改后的分析口径将立即推送并展示给所有人，同时用于后续 Agent 分析。保存前请确认内容准确。</p>
      </div>
      <div slot="footer" class="drive-dialog-actions">
        <button class="drive-control" type="button" data-action="cancel-settings-publish">${renderDriveIcon("x-circle")}取消</button>
        <button class="drive-control drive-control-primary" type="button" data-action="confirm-settings-publish">${renderDriveIcon("check", "bold")}确认发布</button>
      </div>
    </wa-dialog>
  `;
}

function renderUploadReminderDialogMarkup(): TemplateResult | typeof nothing {
  if (!state.pendingUploadSelection) {
    return nothing;
  }
  return html`
    <wa-dialog data-upload-reminder-dialog open label="上传提示" style="--width: min(520px, 94vw);">
      <div class="drive-delete-body">
        <p>如需上传大量文件，建议分多次上传，以提高上传成功率并便于确认进度。</p>
      </div>
      <div slot="footer" class="drive-dialog-actions">
        <button class="drive-control" type="button" data-action="cancel-upload">${renderDriveIcon("x-circle")}取消</button>
        <button class="drive-control drive-control-primary" type="button" data-action="continue-upload">${renderDriveIcon("check", "bold")}继续上传</button>
      </div>
    </wa-dialog>
  `;
}

function renderUploadProgress(): TemplateResult | typeof nothing {
  if (!state.upload.active) {
    return nothing;
  }
  return html`
    <div class="drive-upload-progress">
      <div class="drive-upload-progress-item">
        <div class="drive-upload-progress-label"><strong>当前文件 · ${state.upload.name}</strong><span>${state.upload.percent}%</span></div>
        <wa-progress-bar aria-label="当前文件上传进度" .value=${state.upload.percent}></wa-progress-bar>
      </div>
      ${state.upload.total > 1
        ? html`
            <div class="drive-upload-progress-item">
              <div class="drive-upload-progress-label"><strong>总体进度</strong><span>${state.upload.overallPercent}% · ${state.upload.total} 个文件</span></div>
              <wa-progress-bar aria-label="总体上传进度" .value=${state.upload.overallPercent}></wa-progress-bar>
            </div>
          `
        : nothing}
    </div>
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

function renderAnalysisScopeGuidance(): TemplateResult {
  return html`<small>应尽可能详细说明分析该专题的方法论</small>`;
}

function renderEmpty(icon: string, title: string, body: string): TemplateResult {
  return html`<div class="drive-empty">${renderDriveIcon(icon, "duotone", "ui-icon-lg")}<h3>${title}</h3>${body ? html`<p>${body}</p>` : nothing}</div>`;
}

function metricCard(label: string, value: string, detail: string): TemplateResult {
  return html`<article class="drive-metric"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`;
}

function tabButton(tab: TopicTab, label: string, icon: string): TemplateResult {
  const active = state.activeTab === tab;
  return html`<button class=${classMap({ "drive-tab": true, "is-active": active })} type="button" role="tab" aria-selected=${String(active)} tabindex=${active ? "0" : "-1"} data-action="tab" data-tab=${tab}>${renderDriveIcon(icon)}${label}</button>`;
}

function controlButton(label: string, icon: string, action: string, primary = false, path = "", extraClass = ""): TemplateResult {
  return html`<button class=${`drive-control ${primary ? "drive-control-primary" : ""} ${extraClass}`} type="button" data-action=${action} data-path=${path}>${renderDriveIcon(icon, primary ? "bold" : "regular")}${label}</button>`;
}

function actionButton(label: string, action: string, path: string, name = "", danger = false): TemplateResult {
  const icons: Record<string, string> = {
    "open-folder": "folder-open",
    preview: "eye",
    "copy-link": "link",
    download: "download-simple",
    "delete-file": "trash",
    "set-featured": "star",
  };
  return html`<button class=${classMap({ "drive-table-action": true, "is-danger": danger })} type="button" data-action=${action} data-path=${path} data-name=${name}>${renderDriveIcon(icons[action] || "arrow-right")}${label}</button>`;
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
  const overviewOutputs = (state.overview?.topics || []).flatMap((topic) => topic.featuredOutput ? [topic.featuredOutput] : []);
  return [...outputs, ...materials, ...overviewOutputs].find((file) => file.path === path);
}

function featuredItems(): Array<{ topic: DriveOverviewTopic; output: NonNullable<DriveOverviewTopic["featuredOutput"]> }> {
  return (state.overview?.topics || []).flatMap((topic) => topic.featuredOutput ? [{ topic, output: topic.featuredOutput }] : []);
}

async function setFeaturedOutput(path: string): Promise<void> {
  if (!state.topic?.canManageFeaturedOutput) return;
  try {
    setStatus("正在更新精选成果...");
    state.topic = await api<TopicDetail>("/topic", { method: "PUT", body: { prefix: state.topic.topic.prefix, featuredOutputPath: path } });
    setStatus("精选成果已更新。", "success");
    renderApp();
  } catch (error) {
    showError(error);
    renderApp();
  }
}

async function showFeatured(index: number, trigger?: HTMLElement): Promise<void> {
  const items = featuredItems();
  if (!items.length) return;
  featuredIndex = (index + items.length) % items.length;
  closePreview(false);
  renderApp();
  const carousel = trigger?.isConnected ? trigger : root.querySelector<HTMLElement>("[data-featured-carousel]");
  if (carousel) await openPreview(items[featuredIndex].output.path, carousel);
  scheduleFeaturedRotation();
}

function setFeaturedPaused(paused: boolean): void {
  featuredPaused = paused;
  scheduleFeaturedRotation();
}

function scheduleFeaturedRotation(): void {
  if (featuredTimer !== null) window.clearTimeout(featuredTimer);
  featuredTimer = null;
  if (state.mode !== "overview" || featuredPaused || featuredItems().length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  featuredTimer = window.setTimeout(() => void showFeatured(featuredIndex + 1), 8000);
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
