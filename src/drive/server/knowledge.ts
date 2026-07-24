import type { DriveConfig } from "./config";
import {
  copyObject,
  deleteObject,
  deleteObjects,
  getObjectText,
  headObject,
  listObjectPaths,
  listObjects,
  presignObjectUrl,
  putObjectText,
  type DriveFile,
  type DriveFolder,
} from "./cos";
import { normalizeRelativeFilePath } from "./paths";
import type { SerializedSearchIndex } from "./search";
import {
  FILE_LIMITS,
  extensionFromPath,
  filePolicyForExtension,
  type ProcessingKind,
} from "../shared/policy";
import type { ProcessingState } from "../shared/contracts";

export const IMAGE_MAX_BYTES = FILE_LIMITS.compactBytes;
export const DOCUMENT_MAX_BYTES = FILE_LIMITS.documentBytes;
export const MAX_PDF_PAGES = FILE_LIMITS.pdfPages;

const TOPIC_ID_PATTERN = /^t_[A-Za-z0-9_-]{12,32}$/;
export type { ProcessingKind } from "../shared/policy";
export type { ProcessingState } from "../shared/contracts";

export interface TopicMetadata {
  version: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  indexVersion: number;
}

export interface TopicSummary extends TopicMetadata {
  ready: boolean;
}

export interface FileMetadata {
  version: 1;
  topicId: string;
  path: string;
  name: string;
  size: number;
  contentType: string;
  etag: string;
  uploadedBy: string;
  uploadedAt: string;
  processingKind: ProcessingKind;
  pdfPages?: number;
}

export interface ProcessingStatus {
  version: 1;
  topicId: string;
  path: string;
  sourceEtag: string;
  state: ProcessingState;
  processingKind: ProcessingKind;
  updatedAt: string;
  requestId?: string;
  error?: string;
}

export interface KnowledgeFile extends DriveFile {
  relativePath: string;
  uploadedBy?: string;
  uploadedAt?: string;
  processing?: ProcessingStatus;
}

export interface FilePolicy {
  extension: string;
  maxBytes: number;
  processingKind: ProcessingKind;
}

export function normalizeTopicId(input: unknown): string {
  if (typeof input !== "string" || !TOPIC_ID_PATTERN.test(input)) throw new Error("专题 ID 无效");
  return input;
}

export function normalizeTopicName(input: unknown): string {
  if (typeof input !== "string") throw new Error("请填写专题名称");
  const name = input.trim();
  if (!name) throw new Error("请填写专题名称");
  if (name.length > 80) throw new Error("专题名称过长");
  if (/[\u0000-\u001f\u007f]/.test(name)) throw new Error("专题名称包含非法字符");
  return name;
}

export function filePolicy(path: string): FilePolicy {
  const normalized = normalizeRelativeFilePath(path);
  const extension = extensionFromPath(normalized);
  const policy = filePolicyForExtension(extension);
  if (policy) return policy;
  throw new Error("仅支持 PNG、JPG、JPEG、BMP、PDF、Word、PPT、Excel、Markdown、TXT 和 WPS 文件");
}

export function topicPrefix(topicId: string): string {
  return `topics/${normalizeTopicId(topicId)}/`;
}

export function sourcePath(topicId: string, relativePath: string): string {
  return `${topicPrefix(topicId)}files/${normalizeRelativeFilePath(relativePath)}`;
}

export function fileMetaPath(topicId: string, relativePath: string): string {
  return `${topicPrefix(topicId)}file-meta/${normalizeRelativeFilePath(relativePath)}.json`;
}

export function processedPrefix(topicId: string, relativePath: string): string {
  return `${topicPrefix(topicId)}processed/${normalizeRelativeFilePath(relativePath)}.__file__/`;
}

export function tempUploadPath(uploadIdInput: unknown): string {
  return `system/temp/${normalizeUploadId(uploadIdInput)}/source`;
}

export function processingStatusPath(topicId: string, relativePath: string): string {
  return `${processedPrefix(topicId, relativePath)}status.json`;
}

export function topicIndexPath(topicId: string): string {
  return `${topicPrefix(topicId)}index/search-index.json`;
}

export function topicIndexManifestPath(topicId: string): string {
  return `${topicPrefix(topicId)}index/manifest.json`;
}

export async function createKnowledgeTopic(config: DriveConfig, nameInput: unknown): Promise<TopicMetadata> {
  const now = new Date().toISOString();
  const topic: TopicMetadata = { version: 1, id: createTopicId(), name: normalizeTopicName(nameInput), createdAt: now, updatedAt: now, indexVersion: 1 };
  await putObjectText(config, `${topicPrefix(topic.id)}topic.json`, JSON.stringify(topic, null, 2), "application/json; charset=utf-8");
  return topic;
}

export async function updateKnowledgeTopic(config: DriveConfig, topicId: unknown, nameInput: unknown): Promise<TopicMetadata> {
  const current = await readKnowledgeTopic(config, topicId);
  const topic = { ...current, name: normalizeTopicName(nameInput), updatedAt: new Date().toISOString(), indexVersion: current.indexVersion + 1 };
  await putObjectText(config, `${topicPrefix(topic.id)}topic.json`, JSON.stringify(topic, null, 2), "application/json; charset=utf-8");
  return topic;
}

export async function readKnowledgeTopic(config: DriveConfig, topicIdInput: unknown): Promise<TopicMetadata> {
  const topicId = normalizeTopicId(topicIdInput);
  const text = await getObjectText(config, `${topicPrefix(topicId)}topic.json`);
  if (!text) throw new Error("专题不存在");
  const parsed = JSON.parse(text) as Partial<TopicMetadata>;
  if (parsed.version !== 1 || parsed.id !== topicId || typeof parsed.name !== "string") throw new Error("专题元数据无效");
  return parsed as TopicMetadata;
}

export async function listKnowledgeTopics(config: DriveConfig): Promise<TopicSummary[]> {
  const root = await listObjects(config, "topics/");
  const topics = await Promise.all(root.folders.map(async (folder) => {
    const id = folder.name;
    if (!TOPIC_ID_PATTERN.test(id)) return null;
    try {
      const topic = await readKnowledgeTopic(config, id);
      const manifest = await readJson<{ chunkCount?: number; indexVersion?: number }>(config, topicIndexManifestPath(id));
      return { ...topic, ready: Boolean(manifest?.chunkCount && manifest.indexVersion === topic.indexVersion) };
    } catch {
      return null;
    }
  }));
  return topics.filter((topic): topic is TopicSummary => Boolean(topic)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteKnowledgeTopic(config: DriveConfig, topicIdInput: unknown, confirmName: unknown): Promise<{ deletedCount: number }> {
  const topic = await readKnowledgeTopic(config, topicIdInput);
  if (confirmName !== topic.name) throw new Error("专题名称确认不匹配");
  return { deletedCount: await deletePrefix(config, topicPrefix(topic.id)) };
}

export async function listKnowledgeFiles(config: DriveConfig, topicIdInput: unknown, relativePrefixInput: unknown, cursor?: string | null): Promise<{ prefix: string; folders: DriveFolder[]; files: KnowledgeFile[]; nextCursor: string | null }> {
  const topicId = normalizeTopicId(topicIdInput);
  await readKnowledgeTopic(config, topicId);
  const relativePrefix = relativePrefixInput ? normalizeDirectoryPrefix(relativePrefixInput) : "";
  const storagePrefix = `${topicPrefix(topicId)}files/${relativePrefix}`;
  const listed = await listObjects(config, storagePrefix, cursor);
  const files = await Promise.all(listed.files.map(async (file): Promise<KnowledgeFile> => {
    const relativePath = file.path.slice(`${topicPrefix(topicId)}files/`.length);
    const [meta, processing] = await Promise.all([
      readJson<FileMetadata>(config, fileMetaPath(topicId, relativePath)),
      readJson<ProcessingStatus>(config, processingStatusPath(topicId, relativePath)),
    ]);
    return {
      ...file,
      name: relativePath.slice(relativePrefix.length),
      path: relativePath,
      relativePath,
      contentType: meta?.contentType,
      uploadedBy: meta?.uploadedBy,
      uploadedAt: meta?.uploadedAt,
      processing: processing?.sourceEtag === file.etag ? processing : undefined,
    };
  }));
  return {
    prefix: relativePrefix,
    folders: listed.folders.map((folder) => ({ name: folder.name, path: folder.path.slice(`${topicPrefix(topicId)}files/`.length) })),
    files,
    nextCursor: listed.nextCursor,
  };
}

export async function createUpload(config: DriveConfig, input: { topicId: unknown; relativePath: unknown; size: unknown; contentType: unknown; pdfPages?: unknown }): Promise<{ url: string; uploadId: string; path: string; contentType: string; maxFileBytes: number; requiredHeaders: Record<string, string>; expiresIn: number }> {
  const topicId = normalizeTopicId(input.topicId);
  await readKnowledgeTopic(config, topicId);
  const relativePath = normalizeRelativeFilePath(input.relativePath);
  const policy = filePolicy(relativePath);
  const size = normalizePositiveSize(input.size);
  if (size > policy.maxBytes) throw sizeLimitError(policy.maxBytes);
  const pdfPages = normalizePdfPages(policy.extension, input.pdfPages);
  const contentType = normalizeContentType(input.contentType);
  const uploadId = createUploadId();
  const path = tempUploadPath(uploadId);
  const requiredHeaders = { "content-type": contentType };
  return {
    url: await presignObjectUrl(config, "PUT", path, requiredHeaders),
    uploadId,
    path: relativePath,
    contentType,
    maxFileBytes: policy.maxBytes,
    requiredHeaders,
    expiresIn: config.signExpiresSeconds,
    ...(pdfPages ? { pdfPages } : {}),
  };
}

export async function completeUpload(config: DriveConfig, input: { topicId: unknown; uploadId: unknown; relativePath: unknown; size: unknown; contentType: unknown; pdfPages?: unknown; uploadedBy: string }): Promise<FileMetadata> {
  const topicId = normalizeTopicId(input.topicId);
  const topic = await readKnowledgeTopic(config, topicId);
  const relativePath = normalizeRelativeFilePath(input.relativePath);
  const policy = filePolicy(relativePath);
  const declaredSize = normalizePositiveSize(input.size);
  const declaredContentType = normalizeContentType(input.contentType);
  const pdfPages = normalizePdfPages(policy.extension, input.pdfPages);
  const temporaryPath = tempUploadPath(input.uploadId);
  const actual = await headObject(config, temporaryPath);
  if (!actual) throw new Error("COS 中未找到已上传文件");
  if (actual.size !== declaredSize) {
    await deleteObject(config, temporaryPath);
    throw new Error("COS 文件实际大小与上传登记不一致");
  }
  if (actual.size > policy.maxBytes) {
    await deleteObject(config, temporaryPath);
    throw sizeLimitError(policy.maxBytes);
  }
  if (baseContentType(actual.contentType) !== baseContentType(declaredContentType)) {
    await deleteObject(config, temporaryPath);
    throw new Error("COS 文件实际 Content-Type 与上传登记不一致");
  }
  const uploadedAt = new Date().toISOString();
  const metadata: FileMetadata = {
    version: 1,
    topicId,
    path: relativePath,
    name: relativePath.split("/").at(-1) || relativePath,
    size: actual.size,
    contentType: declaredContentType,
    etag: actual.etag,
    uploadedBy: input.uploadedBy,
    uploadedAt,
    processingKind: policy.processingKind,
    ...(pdfPages ? { pdfPages } : {}),
  };
  const status: ProcessingStatus = {
    version: 1,
    topicId,
    path: relativePath,
    sourceEtag: actual.etag,
    state: "queued",
    processingKind: policy.processingKind,
    updatedAt: uploadedAt,
  };
  const nextTopic = { ...topic, updatedAt: uploadedAt, indexVersion: topic.indexVersion + 1 };
  await Promise.all([
    putObjectText(config, `${topicPrefix(topicId)}topic.json`, JSON.stringify(nextTopic, null, 2), "application/json; charset=utf-8"),
    putObjectText(config, fileMetaPath(topicId, relativePath), JSON.stringify(metadata, null, 2), "application/json; charset=utf-8"),
    putObjectText(config, processingStatusPath(topicId, relativePath), JSON.stringify(status, null, 2), "application/json; charset=utf-8"),
    deleteObject(config, topicIndexPath(topicId)),
    deleteObject(config, topicIndexManifestPath(topicId)),
  ]);
  try {
    // The COS ObjectCreated event must not become visible before its processing metadata.
    await copyObject(config, temporaryPath, sourcePath(topicId, relativePath), actual.etag);
    const copied = await headObject(config, sourcePath(topicId, relativePath));
    if (!copied || copied.size !== actual.size || copied.etag !== actual.etag) throw new Error("COS 文件转存校验失败");
  } catch (error) {
    await Promise.all([
      deleteObject(config, sourcePath(topicId, relativePath)),
      deleteObject(config, fileMetaPath(topicId, relativePath)),
      deleteObject(config, processingStatusPath(topicId, relativePath)),
    ]);
    throw error;
  }
  await deleteObject(config, temporaryPath);
  return metadata;
}

export async function deleteKnowledgeFile(config: DriveConfig, topicIdInput: unknown, relativePathInput: unknown): Promise<void> {
  const topicId = normalizeTopicId(topicIdInput);
  const relativePath = normalizeRelativeFilePath(relativePathInput);
  const topic = await readKnowledgeTopic(config, topicId);
  const updatedAt = new Date().toISOString();
  await putObjectText(config, `${topicPrefix(topicId)}topic.json`, JSON.stringify({ ...topic, updatedAt, indexVersion: topic.indexVersion + 1 }, null, 2), "application/json; charset=utf-8");
  await Promise.all([
    deleteObject(config, sourcePath(topicId, relativePath)),
    deleteObject(config, fileMetaPath(topicId, relativePath)),
    deletePrefix(config, processedPrefix(topicId, relativePath)),
    deleteObject(config, topicIndexPath(topicId)),
    deleteObject(config, topicIndexManifestPath(topicId)),
  ]);
}

export async function createDownloadUrl(config: DriveConfig, topicIdInput: unknown, relativePathInput: unknown): Promise<{ url: string; name: string; expiresIn: number }> {
  const topicId = normalizeTopicId(topicIdInput);
  const relativePath = normalizeRelativeFilePath(relativePathInput);
  if (!(await headObject(config, sourcePath(topicId, relativePath)))) throw new Error("文件不存在");
  return { url: await presignObjectUrl(config, "GET", sourcePath(topicId, relativePath)), name: relativePath.split("/").at(-1) || relativePath, expiresIn: config.signExpiresSeconds };
}

export async function readTopicSearchIndex(config: DriveConfig, topicIdInput: unknown): Promise<SerializedSearchIndex | null> {
  const topicId = normalizeTopicId(topicIdInput);
  return readJson<SerializedSearchIndex>(config, topicIndexPath(topicId));
}

export async function deletePrefix(config: DriveConfig, prefix: string): Promise<number> {
  let cursor: string | null = null;
  let deleted = 0;
  do {
    const page = await listObjectPaths(config, prefix, cursor);
    if (page.paths.length) {
      await deleteObjects(config, page.paths);
      deleted += page.paths.length;
    }
    cursor = page.nextCursor;
  } while (cursor);
  return deleted;
}

function createTopicId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const value = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `t_${value}`;
}

function createUploadId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function normalizeUploadId(input: unknown): string {
  if (typeof input !== "string" || !/^[A-Za-z0-9_-]{24}$/.test(input)) throw new Error("上传任务 ID 无效");
  return input;
}

async function readJson<T>(config: DriveConfig, path: string): Promise<T | null> {
  const text = await getObjectText(config, path);
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

function normalizeDirectoryPrefix(input: unknown): string {
  const normalized = normalizeRelativeFilePath(input);
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function normalizePositiveSize(input: unknown): number {
  const size = typeof input === "number" ? input : Number(input);
  if (!Number.isSafeInteger(size) || size <= 0) throw new Error("文件大小无效");
  return size;
}

function normalizeContentType(input: unknown): string {
  const value = typeof input === "string" && input.trim() ? input.trim() : "application/octet-stream";
  if (value.length > 160 || /[\u0000-\u001f\u007f]/.test(value)) throw new Error("Content-Type 无效");
  return value;
}

function normalizePdfPages(extension: string, input: unknown): number | undefined {
  if (extension !== "pdf") return undefined;
  const pages = typeof input === "number" ? input : Number(input);
  if (!Number.isInteger(pages) || pages < 1 || pages > MAX_PDF_PAGES) throw new Error(`PDF 最多支持 ${MAX_PDF_PAGES} 页`);
  return pages;
}

function baseContentType(value: string): string {
  return value.split(";", 1)[0].trim().toLowerCase();
}

function sizeLimitError(maxBytes: number): Error {
  return new Error(`文件不能超过 ${Math.round(maxBytes / 1024 / 1024)} MB`);
}
