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

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true,
});

export async function listObjects(config: DriveConfig, prefix: string, cursor?: string | null): Promise<DriveListResult> {
  const cosPrefix = makeObjectKey(config.rootPrefix, prefix);
  const url = new URL(config.endpoint);
  url.searchParams.set("list-type", "2");
  url.searchParams.set("delimiter", "/");
  url.searchParams.set("prefix", cosPrefix);
  url.searchParams.set("max-keys", "1000");
  if (cursor) {
    url.searchParams.set("continuation-token", cursor);
  }

  const response = await signedFetch(config, url.toString(), { method: "GET" });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`COS 列表请求失败: ${response.status}`);
  }
  return parseListObjectsXml(text, config.rootPrefix, prefix);
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
    throw new Error(`COS 文件夹创建失败: ${response.status}`);
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
    throw new Error(`COS 写入请求失败: ${response.status}`);
  }
}

export async function getObjectText(config: DriveConfig, relativePath: string): Promise<string | null> {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const response = await signedFetch(config, objectUrl(config, key), { method: "GET" });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`COS 读取请求失败: ${response.status}`);
  }
  return response.text();
}

export async function deleteObject(config: DriveConfig, relativePath: string): Promise<void> {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const response = await signedFetch(config, objectUrl(config, key), { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`COS 删除请求失败: ${response.status}`);
  }
}

export async function presignObjectUrl(
  config: DriveConfig,
  method: "GET" | "PUT",
  relativePath: string,
  headers: HeadersInit = {},
): Promise<string> {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const client = createClient(config);
  const url = new URL(objectUrl(config, key));
  url.searchParams.set("X-Amz-Expires", String(config.signExpiresSeconds));
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
  const encodedPath = key.split("/").map(encodeURIComponent).join("/");
  return `${config.endpoint}/${encodedPath}`;
}

function toArray<T>(value: unknown): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? (value as T[]) : [value as T];
}
