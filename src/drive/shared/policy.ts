import type { KnowledgeRole } from "./contracts";

export const BYTES_PER_MEBIBYTE = 1024 * 1024;

export const FILE_LIMITS = {
  compactBytes: 10 * BYTES_PER_MEBIBYTE,
  documentBytes: 100 * BYTES_PER_MEBIBYTE,
  pdfPages: 300,
} as const;

export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "bmp"] as const;
export const LARGE_DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx"] as const;
export const SMALL_DOCUMENT_EXTENSIONS = ["xls", "xlsx", "md", "txt", "wps"] as const;
export const SUPPORTED_FILE_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  ...LARGE_DOCUMENT_EXTENSIONS,
  ...SMALL_DOCUMENT_EXTENSIONS,
] as const;

const imageExtensions = new Set<string>(IMAGE_EXTENSIONS);
const largeDocumentExtensions = new Set<string>(LARGE_DOCUMENT_EXTENSIONS);
const supportedExtensions = new Set<string>(SUPPORTED_FILE_EXTENSIONS);

export type ProcessingKind = "image-ocr" | "document-parse";

export interface SharedProcessedFilePolicy {
  kind: "processed";
  extension: string;
  maxBytes: number;
  processingKind: ProcessingKind;
}

export interface SharedArchiveFilePolicy {
  kind: "archive";
  extension: string;
  maxBytes: number;
}

export type SharedFilePolicy = SharedProcessedFilePolicy | SharedArchiveFilePolicy;

export function extensionFromPath(path: string): string {
  return path.split(".").at(-1)?.toLowerCase() || "";
}

export function filePolicyForExtension(extension: string): SharedProcessedFilePolicy | null {
  if (!supportedExtensions.has(extension)) return null;
  return {
    kind: "processed",
    extension,
    maxBytes: largeDocumentExtensions.has(extension) ? FILE_LIMITS.documentBytes : FILE_LIMITS.compactBytes,
    processingKind: imageExtensions.has(extension) ? "image-ocr" : "document-parse",
  };
}

export function filePolicyForUpload(path: string, knowledgeRole: KnowledgeRole): SharedFilePolicy | null {
  const extension = extensionFromPath(path);
  if (knowledgeRole === "reference") {
    return { kind: "archive", extension, maxBytes: FILE_LIMITS.documentBytes };
  }
  return filePolicyForExtension(extension);
}

export function isIgnoredUploadPath(path: string): boolean {
  const name = path.split("/").at(-1)?.toLowerCase() || "";
  return name === ".ds_store"
    || name === "thumbs.db"
    || name === "desktop.ini"
    || name.startsWith("._");
}
