import type { DriveEnv } from "./config";

export async function notifyProcessor(env: DriveEnv, payload: { topicId: string; path: string }): Promise<void> {
  await notify(env.PROCESSOR_WEBHOOK_URL, env.PROCESSOR_WEBHOOK_SECRET, payload);
}

export async function notifyIndexer(env: DriveEnv, payload: { topicId: string }): Promise<void> {
  await notify(env.INDEXER_WEBHOOK_URL, env.INDEXER_WEBHOOK_SECRET, payload);
}

async function notify(urlValue: string | undefined, secret: string | undefined, payload: unknown): Promise<void> {
  if (!urlValue || !secret) return;
  const url = new URL(urlValue);
  if (url.protocol !== "https:") throw new Error("SCF webhook 必须使用 HTTPS");
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-jhss-webhook-secret": secret },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`SCF webhook 调用失败: ${response.status}`);
}
