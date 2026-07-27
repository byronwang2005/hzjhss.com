import type { KnowledgeRole } from "../shared/contracts";
import { BYTES_PER_MEBIBYTE, FILE_LIMITS, filePolicyForUpload, isIgnoredUploadPath } from "../shared/policy";

declare const __PDF_WORKER_FILENAME__: string;

export function validateFileSizeAndType(file: File, path: string, knowledgeRole: KnowledgeRole = "evidence"): void {
  if (isIgnoredUploadPath(path)) throw new Error(`${file.name} 是系统文件，不会上传`);
  const policy = filePolicyForUpload(path, knowledgeRole);
  if (!policy) throw new Error(`${file.name} 的格式不受支持`);
  const max = policy.maxBytes;
  if (file.size <= 0 || file.size > max) {
    throw new Error(`${file.name} 不能超过 ${max / BYTES_PER_MEBIBYTE} MB`);
  }
}

export async function pdfPageCount(file: File): Promise<number> {
  const pdf = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdf.GlobalWorkerOptions.workerSrc = new URL(__PDF_WORKER_FILENAME__, import.meta.url).href;
  const task = pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const document = await task.promise;
    if (document.numPages > FILE_LIMITS.pdfPages) {
      throw new Error(`${file.name} 超过 ${FILE_LIMITS.pdfPages} 页`);
    }
    return document.numPages;
  } finally {
    await task.destroy();
  }
}
