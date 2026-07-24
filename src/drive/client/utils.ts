import type { KnowledgeFile, KnowledgeRole, ProcessingState } from "../shared/contracts";
import { PROCESSING_STALE_AFTER_MS } from "../shared/runtime";

export interface FileRolePresentation {
  label: string;
  description: string;
  icon: string;
  emptyTitle: string;
  emptyDescription: string;
  uploadLabel: string;
  uploadAction: string;
}

export const FILE_ROLE_PRESENTATION: Record<KnowledgeRole, FileRolePresentation> = {
  reference: {
    label: "研报原件",
    description: "保留研究原文，并标记是否已经纳入专题方法论。",
    icon: "books",
    emptyTitle: "还没有研报原件",
    emptyDescription: "上传原始研报后，可在这里维护其方法论纳入状态。",
    uploadLabel: "上传研报原件",
    uploadAction: "pick-reference",
  },
  methodology: {
    label: "专题方法论",
    description: "定义专题的分析维度、研究步骤和判断框架。",
    icon: "database",
    emptyTitle: "还没有专题方法论",
    emptyDescription: "上传 Markdown 方法论，为专题问答提供稳定的分析框架。",
    uploadLabel: "上传专题方法论",
    uploadAction: "pick-methodology",
  },
  evidence: {
    label: "时效资料",
    description: "为事实、数据和当前结论提供带日期的可追溯依据。",
    icon: "calendar-dots",
    emptyTitle: "还没有时效资料",
    emptyDescription: "上传周报、公告或其他近期资料后，即可用于问答举证。",
    uploadLabel: "上传时效资料",
    uploadAction: "pick-evidence",
  },
};

export function filesForKnowledgeRole(files: KnowledgeFile[], role: KnowledgeRole): KnowledgeFile[] {
  return files.filter((file) => file.knowledgeRole === role);
}

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

export function processingDisplay(file: KnowledgeFile, now = Date.now()): ProcessingDisplay {
  const processing = file.processing;
  if (!processing) return { label: "未开始处理", retryable: true, poll: false };
  const staleAfter = PROCESSING_STALE_AFTER_MS[processing.state];
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
