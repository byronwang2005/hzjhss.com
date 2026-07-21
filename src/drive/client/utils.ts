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
