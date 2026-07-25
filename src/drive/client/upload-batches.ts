export const UPLOAD_REGISTRATION_BATCH_SIZE = 5;

export function splitUploadBatches<T>(items: readonly T[], batchSize = UPLOAD_REGISTRATION_BATCH_SIZE): T[][] {
  if (!Number.isSafeInteger(batchSize) || batchSize <= 0) {
    throw new Error("上传登记批次大小必须为正整数");
  }
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }
  return batches;
}

export async function processUploadBatches<T, R>(
  items: readonly T[],
  registerBatch: (batch: T[]) => Promise<R>,
  onSuccess: (result: R, batch: T[]) => Promise<void> | void,
  onFailure: (error: unknown, batch: T[]) => Promise<void> | void,
  batchSize = UPLOAD_REGISTRATION_BATCH_SIZE,
): Promise<{ successfulBatches: number; failedBatches: number }> {
  let successfulBatches = 0;
  let failedBatches = 0;
  for (const batch of splitUploadBatches(items, batchSize)) {
    try {
      const result = await registerBatch(batch);
      await onSuccess(result, batch);
      successfulBatches += 1;
    } catch (error) {
      failedBatches += 1;
      await onFailure(error, batch);
    }
  }
  return { successfulBatches, failedBatches };
}
