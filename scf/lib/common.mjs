import COS from "cos-nodejs-sdk-v5";
import pRetry from "p-retry";
import { timingSafeEqual } from "node:crypto";

export const ROOT_PREFIX = "ai-knowledge-base/";
export const cos = new COS({ SecretId: required("TENCENT_SECRET_ID"), SecretKey: required("TENCENT_SECRET_KEY") });
export const bucket = required("COS_BUCKET");
export const region = required("COS_REGION");

export function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function cosCall(method, params) {
  return pRetry(() => new Promise((resolve, reject) => {
    cos[method](params, (error, data) => error ? reject(error) : resolve(data));
  }), { retries: 3, minTimeout: 500, maxTimeout: 5000 });
}

export async function getJson(key) {
  try {
    const data = await cosCall("getObject", { Bucket: bucket, Region: region, Key: key });
    return JSON.parse(Buffer.from(data.Body).toString("utf8"));
  } catch (error) {
    if (error?.statusCode === 404) return null;
    throw error;
  }
}

export async function putJson(key, value) {
  await cosCall("putObject", { Bucket: bucket, Region: region, Key: key, Body: JSON.stringify(value, null, 2), ContentType: "application/json; charset=utf-8" });
}

export async function putText(key, value, contentType = "text/markdown; charset=utf-8") {
  await cosCall("putObject", { Bucket: bucket, Region: region, Key: key, Body: value, ContentType: contentType });
}

export async function head(key) {
  try {
    const data = await cosCall("headObject", { Bucket: bucket, Region: region, Key: key });
    return { etag: String(data.headers?.etag || data.ETag || "").replace(/^\"|\"$/g, ""), contentType: data.headers?.["content-type"] || "", size: Number(data.headers?.["content-length"] || 0) };
  } catch (error) {
    if (error?.statusCode === 404) return null;
    throw error;
  }
}

export function signedUrl(key) {
  return cos.getObjectUrl({ Bucket: bucket, Region: region, Key: key, Sign: true, Expires: 1800 });
}

export async function listAll(prefix) {
  const keys = [];
  let marker;
  do {
    const data = await cosCall("getBucket", { Bucket: bucket, Region: region, Prefix: prefix, Marker: marker, MaxKeys: 1000 });
    for (const item of data.Contents || []) keys.push(item.Key);
    marker = data.IsTruncated === "true" || data.IsTruncated === true ? data.NextMarker : undefined;
  } while (marker);
  return keys;
}

export function parseSourceKey(key) {
  if (!key.startsWith(ROOT_PREFIX)) return null;
  const relative = key.slice(ROOT_PREFIX.length);
  const match = /^topics\/(t_[A-Za-z0-9_-]{12,32})\/files\/(.+)$/.exec(relative);
  if (!match) return null;
  return { topicId: match[1], path: match[2], sourceKey: key };
}

export function extension(path) {
  return path.split(".").at(-1)?.toLowerCase() || "";
}

export function processedBase(topicId, path) {
  return `${ROOT_PREFIX}topics/${topicId}/processed/${path}.__file__/`;
}

export function fileMetaKey(topicId, path) {
  return `${ROOT_PREFIX}topics/${topicId}/file-meta/${path}.json`;
}

export function sourceKey(topicId, path) {
  return `${ROOT_PREFIX}topics/${topicId}/files/${path}`;
}

export function safeError(error) {
  return String(error?.message || error || "处理失败").replace(/[\r\n]+/g, " ").slice(0, 1000);
}

export function assertWebhook(event) {
  if (typeof event?.body !== "string") return;
  const expected = required("WEBHOOK_SECRET");
  const headers = event.headers || event.Headers || {};
  const provided = headers["x-jhss-webhook-secret"] || headers["X-Jhss-Webhook-Secret"] || "";
  const left = Buffer.from(String(provided));
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error("Webhook 鉴权失败");
}
