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

export interface SharedFilePolicy {
  extension: string;
  maxBytes: number;
  processingKind: ProcessingKind;
}

export function extensionFromPath(path: string): string {
  return path.split(".").at(-1)?.toLowerCase() || "";
}

export function filePolicyForExtension(extension: string): SharedFilePolicy | null {
  if (!supportedExtensions.has(extension)) return null;
  return {
    extension,
    maxBytes: largeDocumentExtensions.has(extension) ? FILE_LIMITS.documentBytes : FILE_LIMITS.compactBytes,
    processingKind: imageExtensions.has(extension) ? "image-ocr" : "document-parse",
  };
}
