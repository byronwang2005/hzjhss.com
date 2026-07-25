import type { ProcessingState } from "./contracts";

export const DRIVE_API_ROOT = "/api/drive";

export const CLIENT_TIMING = {
  initialUnauthorizedRetryMs: 150,
  entrySlowMs: 8_000,
  entryTimeoutMs: 20_000,
  statusVisibleMs: 3_000,
  fileRefreshMs: 10_000,
  activeFileRefreshMs: 3_000,
} as const;

export const PROCESSING_STALE_AFTER_MS: Partial<Record<ProcessingState, number>> = {
  queued: 2 * 60_000,
  processing: 30 * 60_000,
  indexing: 10 * 60_000,
};
