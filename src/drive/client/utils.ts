import type { DriveFile, PreviewKind, TopicTab } from "./types";

const markdownExtensions = new Set(["md", "markdown"]);
const textExtensions = new Set(["txt"]);
const htmlExtensions = new Set(["html", "htm"]);

export function extension(name: string): string {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index + 1).toLowerCase();
}

export function previewKindForFile(file: Pick<DriveFile, "name" | "contentType">): PreviewKind {
  const ext = extension(file.name);
  const contentType = (file.contentType || "").toLowerCase();
  if (htmlExtensions.has(ext) || contentType.includes("text/html")) {
    return "html";
  }
  if (ext === "pdf" || contentType.includes("application/pdf")) {
    return "pdf";
  }
  if (markdownExtensions.has(ext) || contentType.includes("markdown")) {
    return "markdown";
  }
  if (textExtensions.has(ext) || contentType.startsWith("text/plain")) {
    return "text";
  }
  return "none";
}

export function canPreview(file: Pick<DriveFile, "name" | "contentType">): boolean {
  return previewKindForFile(file) !== "none";
}

export function fileKindLabel(file: Pick<DriveFile, "name" | "kind" | "contentType" | "size">): string {
  if (file.kind === "output") {
    return "成果";
  }
  if (file.kind === "prompt") {
    return "提示词";
  }
  const ext = extension(file.name);
  if (ext) {
    return ext.toUpperCase();
  }
  return formatBytes(file.size);
}

export function fileIconName(file: Pick<DriveFile, "name" | "contentType">): string {
  const kind = previewKindForFile(file);
  if (kind === "pdf") {
    return "ph-file-pdf";
  }
  if (kind === "html") {
    return "ph-file-html";
  }
  if (kind === "markdown" || kind === "text") {
    return "ph-file-text";
  }
  const ext = extension(file.name);
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return "ph-file-xls";
  }
  if (["ppt", "pptx"].includes(ext)) {
    return "ph-file-ppt";
  }
  if (["doc", "docx"].includes(ext)) {
    return "ph-file-doc";
  }
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
    return "ph-file-image";
  }
  return "ph-file";
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "-";
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDateOnly(value?: string): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function normalizeClientRelativePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter(Boolean).join("/");
}

export function directoryPrefix(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index + 1);
}

export function fileNameFromPath(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? path : path.slice(index + 1);
}

export function shouldRefreshAfterMutation(tab: TopicTab, targetPath: string, topicPrefix: string): "overview" | "topic" | "directory" {
  if (!targetPath.startsWith(topicPrefix)) {
    return "overview";
  }
  if (targetPath.startsWith(`${topicPrefix}outputs/`) || tab === "outputs") {
    return "topic";
  }
  return "directory";
}

export function sortFilesByFreshness(files: DriveFile[]): DriveFile[] {
  return [...files].sort((a, b) => timestampForFile(b) - timestampForFile(a) || a.name.localeCompare(b.name, "zh-Hans-CN"));
}

export function visibleMaterialFiles(files: DriveFile[]): DriveFile[] {
  return files.filter((file) => file.name !== "成果生成与回传.prompt.md");
}

function timestampForFile(file: Pick<DriveFile, "uploadedAt" | "lastModified">): number {
  return Date.parse(file.uploadedAt || file.lastModified) || 0;
}
