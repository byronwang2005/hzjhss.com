import { BYTES_PER_MEBIBYTE, FILE_LIMITS, SUPPORTED_FILE_EXTENSIONS, filePolicyForExtension } from "../shared/policy";

declare const __PDF_WORKER_FILENAME__: string;

const supportedExtensions = new Set<string>(SUPPORTED_FILE_EXTENSIONS);

export function validateFileSizeAndType(file: File, path: string): void {
  const extension = path.split(".").at(-1)?.toLowerCase() || "";
  if (!supportedExtensions.has(extension)) throw new Error(`${file.name} 的格式不受支持`);
  const max = filePolicyForExtension(extension)?.maxBytes ?? FILE_LIMITS.compactBytes;
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
