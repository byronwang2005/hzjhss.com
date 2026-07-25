export interface FilePaginationState {
  page: number;
  cursors: Array<string | null>;
  nextCursor: string | null;
}

export function createFilePagination(): FilePaginationState {
  return { page: 1, cursors: [null], nextCursor: null };
}

export function currentFilePageCursor(pagination: FilePaginationState): string | null {
  return pagination.cursors[pagination.page - 1] ?? null;
}

export function recordFilePageResult(pagination: FilePaginationState, nextCursor: string | null): FilePaginationState {
  return { ...pagination, nextCursor };
}

export function moveToNextFilePage(pagination: FilePaginationState): FilePaginationState | null {
  if (!pagination.nextCursor) return null;
  const cursors = [...pagination.cursors];
  cursors[pagination.page] = pagination.nextCursor;
  return { page: pagination.page + 1, cursors, nextCursor: null };
}

export function moveToPreviousFilePage(pagination: FilePaginationState): FilePaginationState | null {
  if (pagination.page <= 1) return null;
  return { ...pagination, page: pagination.page - 1, nextCursor: null };
}
