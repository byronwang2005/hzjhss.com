import pLimit from "p-limit";
import pRetry from "p-retry";
import type { KnowledgeRole, UploadCompleteResponse } from "../shared/contracts";

export const PENDING_UPLOAD_STORAGE_KEY = "jhss-pending-upload-registrations-v1";
export const MAX_PENDING_UPLOADS = 1000;

export interface UploadRegistrationReceipt {
  version: 1;
  uploadId: string;
  topicId: string;
  relativePath: string;
  size: number;
  contentType: string;
  knowledgeRole: KnowledgeRole;
  pdfPages?: number;
  createdAt: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function readPendingUploads(storage: StorageLike = localStorage): UploadRegistrationReceipt[] {
  try {
    const parsed = JSON.parse(storage.getItem(PENDING_UPLOAD_STORAGE_KEY) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter(isUploadRegistrationReceipt).slice(-MAX_PENDING_UPLOADS) : [];
  } catch {
    return [];
  }
}

export function persistPendingUpload(receipt: UploadRegistrationReceipt, storage: StorageLike = localStorage): void {
  const pending = readPendingUploads(storage).filter((item) => item.uploadId !== receipt.uploadId);
  pending.push(receipt);
  storage.setItem(PENDING_UPLOAD_STORAGE_KEY, JSON.stringify(pending.slice(-MAX_PENDING_UPLOADS)));
}

export function removePendingUpload(uploadId: string, storage: StorageLike = localStorage): void {
  storage.setItem(
    PENDING_UPLOAD_STORAGE_KEY,
    JSON.stringify(readPendingUploads(storage).filter((item) => item.uploadId !== uploadId)),
  );
}

export function createUploadRegistrationScheduler(options: {
  concurrency: number;
  register: (receipt: UploadRegistrationReceipt) => Promise<UploadCompleteResponse>;
  onSuccess: (response: UploadCompleteResponse, receipt: UploadRegistrationReceipt) => Promise<void> | void;
  onFailure: (error: unknown, receipt: UploadRegistrationReceipt) => Promise<void> | void;
  storage?: StorageLike;
  retries?: number;
}): {
  enqueue(receipt: UploadRegistrationReceipt): Promise<void>;
  waitForIdle(): Promise<void>;
} {
  const storage = options.storage ?? localStorage;
  const limit = pLimit(Math.max(1, options.concurrency));
  const tasks = new Set<Promise<void>>();

  const enqueue = (receipt: UploadRegistrationReceipt): Promise<void> => {
    persistPendingUpload(receipt, storage);
    const task = limit(async () => {
      try {
        const response = await pRetry(async () => {
          const result = await options.register(receipt);
          if (!result.ok || result.failures.length || result.files.length !== 1) {
            throw new Error(result.failures[0]?.message || "文件登记失败，请重新上传该文件。");
          }
          return result;
        }, { retries: options.retries ?? 3, minTimeout: 500, maxTimeout: 4_000, factor: 2 });
        removePendingUpload(receipt.uploadId, storage);
        await options.onSuccess(response, receipt);
      } catch (error) {
        await options.onFailure(error, receipt);
      }
    });
    tasks.add(task);
    void task.finally(() => tasks.delete(task));
    return task;
  };

  return {
    enqueue,
    async waitForIdle() {
      await Promise.allSettled([...tasks]);
    },
  };
}

function isUploadRegistrationReceipt(value: unknown): value is UploadRegistrationReceipt {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const receipt = value as Partial<UploadRegistrationReceipt>;
  return receipt.version === 1
    && typeof receipt.uploadId === "string"
    && typeof receipt.topicId === "string"
    && typeof receipt.relativePath === "string"
    && typeof receipt.size === "number"
    && typeof receipt.contentType === "string"
    && ["reference", "methodology", "evidence"].includes(String(receipt.knowledgeRole))
    && typeof receipt.createdAt === "string";
}
