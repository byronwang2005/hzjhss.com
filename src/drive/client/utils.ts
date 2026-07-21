export function normalizeClientRelativePath(input: string): string {
  const path = input.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  const parts = path.split("/");
  if (!path || path.endsWith("/") || parts.some((part) => !part || part === "." || part === "..")) throw new Error("文件路径无效");
  return parts.join("/");
}

export function directoryPrefix(path: string): string {
  const clean = path.replace(/\/$/, "");
  const index = clean.lastIndexOf("/");
  return index < 0 ? "" : path.slice(0, index + 1);
}

export function fileNameFromPath(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function fileIconName(name: string): string {
  const extension = name.split(".").at(-1)?.toLowerCase();
  if (extension === "pdf") return "file-pdf";
  if (["png", "jpg", "jpeg", "bmp"].includes(extension || "")) return "file-image";
  if (["xls", "xlsx"].includes(extension || "")) return "file-xls";
  if (["doc", "docx", "wps"].includes(extension || "")) return "file-doc";
  if (["ppt", "pptx"].includes(extension || "")) return "file-ppt";
  return "file-text";
}

export interface ProcessingDisplay {
  label: string;
  retryable: boolean;
  poll: boolean;
}

const PROCESSING_LABELS: Record<ProcessingState, string> = {
  queued: "等待云处理",
  processing: "处理中",
  indexing: "建索引",
  ready: "可问答",
  failed: "失败",
};

const STALE_AFTER_MS: Partial<Record<ProcessingState, number>> = {
  queued: 2 * 60 * 1000,
  processing: 30 * 60 * 1000,
  indexing: 10 * 60 * 1000,
};

export function processingDisplay(file: KnowledgeFile, now = Date.now()): ProcessingDisplay {
  const processing = file.processing;
  if (!processing) return { label: "未开始处理", retryable: true, poll: false };
  const staleAfter = STALE_AFTER_MS[processing.state];
  const updatedAt = Date.parse(processing.updatedAt);
  if (staleAfter && (!Number.isFinite(updatedAt) || now - updatedAt > staleAfter)) {
    return {
      label: processing.state === "queued" ? "处理未启动" : "处理超时",
      retryable: true,
      poll: false,
    };
  }
  return {
    label: PROCESSING_LABELS[processing.state],
    retryable: processing.state === "failed",
    poll: processing.state === "queued" || processing.state === "processing" || processing.state === "indexing",
  };
}
import type { KnowledgeFile, ProcessingState } from "./types";
