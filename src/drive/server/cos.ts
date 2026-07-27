import { AwsClient } from "aws4fetch";
import { XMLParser } from "fast-xml-parser";
import type { DriveConfig } from "./config";
import { makeObjectKey, trimRootPrefix } from "./paths";

export interface DriveFolder {
  name: string;
  path: string;
}

export interface DriveFile {
  name: string;
  path: string;
  size: number;
  lastModified: string;
  etag: string;
  uploadedBy?: string;
  uploadedAt?: string;
  contentType?: string;
  kind?: string;
}

export interface DriveListResult {
  prefix: string;
  folders: DriveFolder[];
  files: DriveFile[];
  nextCursor: string | null;
}

export interface DriveObjectPathList {
  paths: string[];
  nextCursor: string | null;
}

export interface DriveObjectMetadata {
  size: number;
  contentType: string;
  etag: string;
}

export type CosOperation =
  | "list-objects"
  | "put-object"
  | "get-object"
  | "head-object"
  | "delete-object"
  | "copy-object";

export class CosRequestError extends Error {
  constructor(readonly operation: CosOperation, readonly status: number) {
    super(cosRequestErrorMessage(operation, status));
    this.name = "CosRequestError";
  }
}

function cosRequestErrorMessage(operation: CosOperation, status: number): string {
  if (operation === "list-objects") return `COS 列表请求失败: ${status}`;
  if (operation === "put-object") return `COS 写入请求失败: ${status}`;
  if (operation === "get-object") return `COS 读取请求失败: ${status}`;
  if (operation === "head-object") return `COS 文件检查失败: ${status}`;
  if (operation === "delete-object") return `COS 删除请求失败: ${status}`;
  return `COS 文件转存失败: ${status}`;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true,
});

export async function listObjects(config: DriveConfig, prefix: string, cursor?: string | null, maxKeys = 1000): Promise<DriveListResult> {
  const cosPrefix = makeObjectKey(config.rootPrefix, prefix);
  const url = new URL(config.endpoint);
  url.searchParams.set("list-type", "2");
  url.searchParams.set("delimiter", "/");
  url.searchParams.set("prefix", cosPrefix);
  url.searchParams.set("max-keys", String(normalizeMaxKeys(maxKeys)));
  if (cursor) {
    url.searchParams.set("continuation-token", cursor);
  }

  const response = await signedFetch(config, url.toString(), { method: "GET" });
  const text = await response.text();
  if (!response.ok) {
    throw new CosRequestError("list-objects", response.status);
  }
  return parseListObjectsXml(text, config.rootPrefix, prefix);
}

export async function listObjectPaths(config: DriveConfig, prefix: string, cursor?: string | null, maxKeys = 1000): Promise<DriveObjectPathList> {
  const cosPrefix = makeObjectKey(config.rootPrefix, prefix);
  const url = new URL(config.endpoint);
  url.searchParams.set("list-type", "2");
  url.searchParams.set("prefix", cosPrefix);
  url.searchParams.set("max-keys", String(normalizeMaxKeys(maxKeys)));
  if (cursor) {
    url.searchParams.set("continuation-token", cursor);
  }

  const response = await signedFetch(config, url.toString(), { method: "GET" });
  const text = await response.text();
  if (!response.ok) {
    throw new CosRequestError("list-objects", response.status);
  }
  return parseObjectPathsXml(text, config.rootPrefix);
}

function normalizeMaxKeys(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 1000) throw new Error("COS 列表分页大小无效");
  return value;
}

export async function createFolder(config: DriveConfig, relativeFolderPath: string): Promise<void> {
  const key = makeObjectKey(config.rootPrefix, relativeFolderPath);
  const response = await signedFetch(config, objectUrl(config, key), {
    method: "PUT",
    headers: {
      "content-type": "application/x-directory",
    },
    body: "",
  });
  if (!response.ok) {
    throw new CosRequestError("put-object", response.status);
  }
}

export async function putObjectText(
  config: DriveConfig,
  relativePath: string,
  text: string,
  contentType = "text/plain; charset=utf-8",
): Promise<void> {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const response = await signedFetch(config, objectUrl(config, key), {
    method: "PUT",
    headers: {
      "content-type": contentType,
    },
    body: text,
  });
  if (!response.ok) {
    throw new CosRequestError("put-object", response.status);
  }
}

export async function getObjectText(config: DriveConfig, relativePath: string): Promise<string | null> {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const response = await signedFetch(config, objectUrl(config, key), { method: "GET" });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new CosRequestError("get-object", response.status);
  }
  return response.text();
}

export async function headObject(config: DriveConfig, relativePath: string): Promise<DriveObjectMetadata | null> {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const response = await signedFetch(config, objectUrl(config, key), { method: "HEAD" });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    try {
      return await listExactObject(config, key);
    } catch {
      throw new CosRequestError("head-object", response.status);
    }
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength === null || !/^\d+$/.test(contentLength)) {
    throw new Error("COS 文件大小元数据无效");
  }
  const size = Number(contentLength);
  return {
    size,
    contentType: response.headers.get("content-type") || "",
    etag: (response.headers.get("etag") || "").replace(/^"|"$/g, ""),
  };
}

async function listExactObject(config: DriveConfig, key: string): Promise<DriveObjectMetadata | null> {
  const url = new URL(config.endpoint);
  url.searchParams.set("list-type", "2");
  url.searchParams.set("prefix", key);
  url.searchParams.set("max-keys", "1");
  const response = await signedFetch(config, url.toString(), { method: "GET" });
  const text = await response.text();
  if (!response.ok) {
    throw new CosRequestError("list-objects", response.status);
  }
  const parsed = parser.parse(text) as { ListBucketResult?: { Contents?: unknown } };
  const entry = toArray<Record<string, unknown>>(parsed.ListBucketResult?.Contents)
    .find((item) => String(item.Key ?? "") === key);
  if (!entry) return null;
  const size = Number(entry.Size);
  const etag = String(entry.ETag ?? "").replace(/^"|"$/g, "");
  if (!Number.isSafeInteger(size) || size < 0 || !etag) {
    throw new Error("COS 精确文件元数据无效");
  }
  return { size, contentType: "", etag };
}

export async function deleteObject(config: DriveConfig, relativePath: string): Promise<void> {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const response = await signedFetch(config, objectUrl(config, key), { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new CosRequestError("delete-object", response.status);
  }
}

export async function copyObject(config: DriveConfig, sourceRelativePath: string, targetRelativePath: string, sourceEtag: string): Promise<void> {
  const sourceKey = makeObjectKey(config.rootPrefix, sourceRelativePath);
  const targetKey = makeObjectKey(config.rootPrefix, targetRelativePath);
  const sourceUrl = new URL(objectUrl(config, sourceKey));
  const response = await signedFetch(config, objectUrl(config, targetKey), {
    method: "PUT",
    headers: {
      "x-cos-copy-source": `${sourceUrl.host}/${encodeCosObjectKey(sourceKey)}`,
      "x-cos-copy-source-if-match": sourceEtag,
    },
  });
  const body = await response.text();
  if (!response.ok || /<Error(?:\s|>)/i.test(body)) {
    throw new CosRequestError("copy-object", response.status);
  }
}

export async function deleteObjects(config: DriveConfig, relativePaths: string[]): Promise<void> {
  const chunkSize = 20;
  for (let index = 0; index < relativePaths.length; index += chunkSize) {
    await Promise.all(relativePaths.slice(index, index + chunkSize).map((path) => deleteObject(config, path)));
  }
}

export async function presignObjectUrl(
  config: DriveConfig,
  method: "GET" | "PUT",
  relativePath: string,
  headers: HeadersInit = {},
  options: { expiresSeconds?: number; responseContentDisposition?: string } = {},
): Promise<string> {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const client = createClient(config);
  const url = new URL(objectUrl(config, key));
  if (options.responseContentDisposition) {
    url.searchParams.set("response-content-disposition", options.responseContentDisposition);
  }
  const expiresSeconds = Math.max(1, Math.min(options.expiresSeconds ?? config.signExpiresSeconds, config.signExpiresSeconds));
  url.searchParams.set("X-Amz-Expires", String(expiresSeconds));
  const signedRequest = await client.sign(url.toString(), {
    method,
    headers,
    aws: {
      signQuery: true,
    },
  });
  return signedRequest.url;
}

export function parseListObjectsXml(xml: string, rootPrefix: string, currentPrefix: string): DriveListResult {
  const parsed = parser.parse(xml) as { ListBucketResult?: Record<string, unknown> };
  const result = parsed.ListBucketResult ?? {};
  const folders = toArray<Record<string, unknown>>(result.CommonPrefixes)
    .map((entry) => String(entry.Prefix ?? ""))
    .filter(Boolean)
    .map((key) => trimRootPrefix(rootPrefix, key))
    .filter((path) => path.startsWith(currentPrefix) && path !== currentPrefix)
    .map((path) => {
      const name = path.slice(currentPrefix.length).replace(/\/$/, "");
      return { name, path };
    })
    .filter((folder) => folder.name && !folder.name.includes("/") && !isSystemFile(folder.name));

  const files = toArray<Record<string, unknown>>(result.Contents)
    .map((entry) => ({
      key: String(entry.Key ?? ""),
      size: Number(entry.Size ?? 0),
      lastModified: String(entry.LastModified ?? ""),
      etag: String(entry.ETag ?? "").replace(/^"|"$/g, ""),
    }))
    .filter((entry) => entry.key && entry.key !== makeObjectKey(rootPrefix, currentPrefix) && !entry.key.endsWith("/"))
    .map((entry) => {
      const path = trimRootPrefix(rootPrefix, entry.key);
      const name = path.slice(currentPrefix.length);
      return {
        name,
        path,
        size: entry.size,
        lastModified: entry.lastModified,
        etag: entry.etag,
      };
    })
    .filter((file) => file.name && !file.name.includes("/") && !isSystemFile(file.name));

  const nextCursor = result.NextContinuationToken ? String(result.NextContinuationToken) : null;
  return { prefix: currentPrefix, folders, files, nextCursor };
}

export function parseObjectPathsXml(xml: string, rootPrefix: string): DriveObjectPathList {
  const parsed = parser.parse(xml) as { ListBucketResult?: Record<string, unknown> };
  const result = parsed.ListBucketResult ?? {};
  const paths = toArray<Record<string, unknown>>(result.Contents)
    .map((entry) => String(entry.Key ?? ""))
    .filter(Boolean)
    .map((key) => trimRootPrefix(rootPrefix, key));
  const nextCursor = result.NextContinuationToken ? String(result.NextContinuationToken) : null;
  return { paths, nextCursor };
}

function isSystemFile(name: string): boolean {
  return name.startsWith("._");
}

function createClient(config: DriveConfig): AwsClient {
  return new AwsClient({
    accessKeyId: config.cosSecretId,
    secretAccessKey: config.cosSecretKey,
    region: config.region,
    service: "s3",
  });
}

async function signedFetch(config: DriveConfig, input: string, init: RequestInit): Promise<Response> {
  const client = createClient(config);
  const request = await client.sign(input, init);
  return fetch(request);
}

function objectUrl(config: DriveConfig, key: string): string {
  const encodedPath = encodeCosObjectKey(key);
  return `${config.endpoint}/${encodedPath}`;
}

export function encodeCosObjectKey(key: string): string {
  return key.split("/").map(encodeRfc3986Segment).join("/");
}

function encodeRfc3986Segment(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (character) => (
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  ));
}

function toArray<T>(value: unknown): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? (value as T[]) : [value as T];
}
