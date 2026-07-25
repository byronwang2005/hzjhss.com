import type { FileListResponse } from "../shared/contracts";

export function mergeFileListPages(current: FileListResponse, page: FileListResponse): FileListResponse {
  if (page.role !== current.role || page.prefix !== current.prefix) {
    throw new Error("COS 目录分页范围不一致，请重新加载。");
  }
  const folders = new Map(current.folders.map((folder) => [folder.path, folder]));
  const files = new Map(current.files.map((file) => [file.path, file]));
  page.folders.forEach((folder) => folders.set(folder.path, folder));
  page.files.forEach((file) => files.set(file.path, file));
  return {
    role: current.role,
    prefix: current.prefix,
    folders: [...folders.values()],
    files: [...files.values()],
    nextCursor: page.nextCursor,
  };
}

export async function loadRemainingFilePages(
  firstPage: FileListResponse,
  options: {
    fetchPage: (cursor: string) => Promise<FileListResponse>;
    isCurrent: () => boolean;
    onPage: (listing: FileListResponse) => void;
  },
): Promise<FileListResponse | null> {
  let listing = firstPage;
  const seenCursors = new Set<string>();
  while (listing.nextCursor) {
    const cursor = listing.nextCursor;
    if (seenCursors.has(cursor)) throw new Error("COS 目录分页游标重复，请重新加载。");
    seenCursors.add(cursor);
    const page = await options.fetchPage(cursor);
    if (!options.isCurrent()) return null;
    listing = mergeFileListPages(listing, page);
    options.onPage(listing);
  }
  return listing;
}
