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
import type { KnowledgeRole, ProcessingState, ReportDateSource } from "../shared/contracts";
import {
  isReservedMethodologyPath,
  knowledgeRoleForPath,
  LEGACY_METHODOLOGY_PATH,
  METHODOLOGY_FILE_PREFIX,
  METHODOLOGY_FILE_SUFFIX,
} from "../shared/methodology";

export const IMAGE_MAX_BYTES = FILE_LIMITS.compactBytes;
export const DOCUMENT_MAX_BYTES = FILE_LIMITS.documentBytes;
export const MAX_PDF_PAGES = FILE_LIMITS.pdfPages;

const TOPIC_ID_PATTERN = /^t_[A-Za-z0-9_-]{12,32}$/;
export const METHODOLOGY_PATH = LEGACY_METHODOLOGY_PATH;
export type { ProcessingKind } from "../shared/policy";
export type { ProcessingState } from "../shared/contracts";

export interface TopicMetadata {
  version: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  indexVersion: number;
  methodologyPath?: string;
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
  knowledgeRole?: KnowledgeRole;
  reportDate?: string;
  reportDateSource?: ReportDateSource;
  incorporatedAt?: string;
  incorporatedBy?: string;
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
  knowledgeRole: KnowledgeRole;
  reportDate?: string;
  reportDateSource?: ReportDateSource;
  incorporatedAt?: string;
  incorporatedBy?: string;
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
  if (/[\\/]/.test(name)) throw new Error("专题名称不能包含 / 或 \\");
  return name;
}

export function brandedMethodologyPath(topicName: string): string {
  return `${METHODOLOGY_FILE_PREFIX}${normalizeTopicName(topicName)}${METHODOLOGY_FILE_SUFFIX}`;
}

export function methodologyPathForTopic(topic: Pick<TopicMetadata, "methodologyPath">): string {
  return topic.methodologyPath || METHODOLOGY_PATH;
}

export function filePolicy(path: string): FilePolicy {
  const normalized = normalizeRelativeFilePath(path);
  const extension = extensionFromPath(normalized);
  const policy = filePolicyForExtension(extension);
  if (policy) return policy;
  throw new Error("仅支持 PNG、JPG、JPEG、BMP、PDF、Word、PPT、Excel、Markdown、TXT 和 WPS 文件");
}

export function knowledgeRoleOf(
  metadata: Pick<FileMetadata, "knowledgeRole"> | null | undefined,
  relativePath?: string,
  methodologyPath = METHODOLOGY_PATH,
): KnowledgeRole {
  // The reserved path is an authorization boundary, not merely metadata. Fail
  // closed if metadata is missing or from an older schema.
  return knowledgeRoleForPath(metadata?.knowledgeRole, relativePath, methodologyPath);
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
  const name = normalizeTopicName(nameInput);
  const topic: TopicMetadata = {
    version: 1,
    id: createTopicId(),
    name,
    createdAt: now,
    updatedAt: now,
    indexVersion: 1,
    methodologyPath: brandedMethodologyPath(name),
  };
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
  if (parsed.methodologyPath !== undefined) {
    if (
      typeof parsed.methodologyPath !== "string"
      || normalizeRelativeFilePath(parsed.methodologyPath) !== parsed.methodologyPath
      || parsed.methodologyPath === METHODOLOGY_PATH
      || parsed.methodologyPath.includes("/")
      || !parsed.methodologyPath.startsWith(METHODOLOGY_FILE_PREFIX)
      || !parsed.methodologyPath.endsWith(METHODOLOGY_FILE_SUFFIX)
    ) {
      throw new Error("专题方法论路径无效");
    }
  }
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

export async function listKnowledgeFiles(
  config: DriveConfig,
  topicIdInput: unknown,
  relativePrefixInput: unknown,
  cursor?: string | null,
  options: { includeMethodology?: boolean } = {},
): Promise<{ prefix: string; folders: DriveFolder[]; files: KnowledgeFile[]; nextCursor: string | null }> {
  const topicId = normalizeTopicId(topicIdInput);
  const topic = await readKnowledgeTopic(config, topicId);
  const methodologyPath = methodologyPathForTopic(topic);
  const relativePrefix = relativePrefixInput ? normalizeDirectoryPrefix(relativePrefixInput) : "";
  const storagePrefix = `${topicPrefix(topicId)}files/${relativePrefix}`;
  const listed = await listObjects(config, storagePrefix, cursor);
  const files = (await Promise.all(listed.files.map(async (file): Promise<KnowledgeFile | null> => {
    const relativePath = file.path.slice(`${topicPrefix(topicId)}files/`.length);
    const [meta, processing] = await Promise.all([
      readJson<FileMetadata>(config, fileMetaPath(topicId, relativePath)),
      readJson<ProcessingStatus>(config, processingStatusPath(topicId, relativePath)),
    ]);
    const knowledgeRole = knowledgeRoleOf(meta, relativePath, methodologyPath);
    if (knowledgeRole === "methodology" && !options.includeMethodology) return null;
    return {
      ...file,
      name: relativePath.slice(relativePrefix.length),
      path: relativePath,
      relativePath,
      contentType: meta?.contentType,
      uploadedBy: meta?.uploadedBy,
      uploadedAt: meta?.uploadedAt,
      knowledgeRole,
      reportDate: meta?.reportDate,
      reportDateSource: meta?.reportDateSource,
      incorporatedAt: meta?.incorporatedAt,
      incorporatedBy: meta?.incorporatedBy,
      processing: processing?.sourceEtag === file.etag ? processing : undefined,
    };
  }))).filter((file): file is KnowledgeFile => Boolean(file));
  return {
    prefix: relativePrefix,
    folders: listed.folders.map((folder) => ({ name: folder.name, path: folder.path.slice(`${topicPrefix(topicId)}files/`.length) })),
    files,
    nextCursor: listed.nextCursor,
  };
}

export async function createUpload(config: DriveConfig, input: { topicId: unknown; relativePath: unknown; size: unknown; contentType: unknown; pdfPages?: unknown; knowledgeRole?: unknown }): Promise<{ url: string; uploadId: string; path: string; contentType: string; knowledgeRole: KnowledgeRole; maxFileBytes: number; requiredHeaders: Record<string, string>; expiresIn: number }> {
  const topicId = normalizeTopicId(input.topicId);
  const topic = await readKnowledgeTopic(config, topicId);
  const knowledgeRole = normalizeKnowledgeRole(input.knowledgeRole);
  const methodologyPath = methodologyPathForTopic(topic);
  const relativePath = knowledgeRole === "methodology" ? methodologyPath : normalizeRelativeFilePath(input.relativePath);
  if (knowledgeRole !== "methodology" && isReservedMethodologyPath(relativePath, methodologyPath)) throw new Error("该文件路径由专题方法论保留");
  const policy = filePolicy(relativePath);
  if (knowledgeRole === "methodology" && policy.extension !== "md") throw new Error("专题方法论只支持 Markdown 文件");
  const size = normalizePositiveSize(input.size);
  if (size > policy.maxBytes) throw sizeLimitError(policy.maxBytes);
  const pdfPages = knowledgeRole === "reference" ? undefined : normalizePdfPages(policy.extension, input.pdfPages);
  const contentType = normalizeContentType(input.contentType);
  const uploadId = createUploadId();
  const path = tempUploadPath(uploadId);
  const requiredHeaders = { "content-type": contentType };
  return {
    url: await presignObjectUrl(config, "PUT", path, requiredHeaders),
    uploadId,
    path: relativePath,
    contentType,
    knowledgeRole,
    maxFileBytes: policy.maxBytes,
    requiredHeaders,
    expiresIn: config.signExpiresSeconds,
    ...(pdfPages ? { pdfPages } : {}),
  };
}

export async function completeUpload(config: DriveConfig, input: { topicId: unknown; uploadId: unknown; relativePath: unknown; size: unknown; contentType: unknown; pdfPages?: unknown; knowledgeRole?: unknown; uploadedBy: string }): Promise<FileMetadata> {
  const topicId = normalizeTopicId(input.topicId);
  const topic = await readKnowledgeTopic(config, topicId);
  const knowledgeRole = normalizeKnowledgeRole(input.knowledgeRole);
  const methodologyPath = methodologyPathForTopic(topic);
  const relativePath = knowledgeRole === "methodology" ? methodologyPath : normalizeRelativeFilePath(input.relativePath);
  if (knowledgeRole !== "methodology" && isReservedMethodologyPath(relativePath, methodologyPath)) throw new Error("该文件路径由专题方法论保留");
  const policy = filePolicy(relativePath);
  if (knowledgeRole === "methodology" && policy.extension !== "md") throw new Error("专题方法论只支持 Markdown 文件");
  const declaredSize = normalizePositiveSize(input.size);
  const declaredContentType = normalizeContentType(input.contentType);
  const pdfPages = knowledgeRole === "reference" ? undefined : normalizePdfPages(policy.extension, input.pdfPages);
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
  const [previousMetadata, existingSource] = await Promise.all([
    readJson<FileMetadata>(config, fileMetaPath(topicId, relativePath)),
    headObject(config, sourcePath(topicId, relativePath)),
  ]);
  if (existingSource && !previousMetadata) {
    await deleteObject(config, temporaryPath);
    throw new Error("同名文件的元数据缺失，请先删除后再上传");
  }
  if (previousMetadata && knowledgeRoleOf(previousMetadata, relativePath, methodologyPath) !== knowledgeRole) {
    await deleteObject(config, temporaryPath);
    throw new Error("同名文件不能直接变更资料类型，请先删除后再上传");
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
    knowledgeRole,
    ...(knowledgeRole === "evidence" ? { reportDate: uploadedAt.slice(0, 10), reportDateSource: "upload" as const } : {}),
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
  const affectsIndex = knowledgeRole !== "reference";
  const nextTopic = { ...topic, updatedAt: uploadedAt, indexVersion: topic.indexVersion + (affectsIndex ? 1 : 0) };
  const registrations: Promise<unknown>[] = [
    putObjectText(config, `${topicPrefix(topicId)}topic.json`, JSON.stringify(nextTopic, null, 2), "application/json; charset=utf-8"),
    putObjectText(config, fileMetaPath(topicId, relativePath), JSON.stringify(metadata, null, 2), "application/json; charset=utf-8"),
  ];
  if (affectsIndex) {
    registrations.push(
      putObjectText(config, processingStatusPath(topicId, relativePath), JSON.stringify(status, null, 2), "application/json; charset=utf-8"),
      deleteObject(config, topicIndexPath(topicId)),
      deleteObject(config, topicIndexManifestPath(topicId)),
    );
  } else {
    registrations.push(deletePrefix(config, processedPrefix(topicId, relativePath)));
  }
  await Promise.all(registrations);
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

export async function deleteKnowledgeFile(config: DriveConfig, topicIdInput: unknown, relativePathInput: unknown): Promise<{ indexChanged: boolean }> {
  const topicId = normalizeTopicId(topicIdInput);
  const relativePath = normalizeRelativeFilePath(relativePathInput);
  const [topic, metadata] = await Promise.all([
    readKnowledgeTopic(config, topicId),
    readJson<FileMetadata>(config, fileMetaPath(topicId, relativePath)),
  ]);
  const affectsIndex = knowledgeRoleOf(metadata, relativePath, methodologyPathForTopic(topic)) !== "reference";
  const updatedAt = new Date().toISOString();
  await putObjectText(config, `${topicPrefix(topicId)}topic.json`, JSON.stringify({ ...topic, updatedAt, indexVersion: topic.indexVersion + (affectsIndex ? 1 : 0) }, null, 2), "application/json; charset=utf-8");
  const deletions: Promise<unknown>[] = [
    deleteObject(config, sourcePath(topicId, relativePath)),
    deleteObject(config, fileMetaPath(topicId, relativePath)),
    deletePrefix(config, processedPrefix(topicId, relativePath)),
  ];
  if (affectsIndex) {
    deletions.push(deleteObject(config, topicIndexPath(topicId)), deleteObject(config, topicIndexManifestPath(topicId)));
  }
  await Promise.all(deletions);
  return { indexChanged: affectsIndex };
}

export async function createDownloadUrl(config: DriveConfig, topicIdInput: unknown, relativePathInput: unknown, options: { includeMethodology?: boolean } = {}): Promise<{ url: string; name: string; expiresIn: number }> {
  const topicId = normalizeTopicId(topicIdInput);
  const relativePath = normalizeRelativeFilePath(relativePathInput);
  const [topic, metadata] = await Promise.all([
    readKnowledgeTopic(config, topicId),
    readJson<FileMetadata>(config, fileMetaPath(topicId, relativePath)),
  ]);
  if (knowledgeRoleOf(metadata, relativePath, methodologyPathForTopic(topic)) === "methodology" && !options.includeMethodology) {
    const error = new Error("无权下载专题方法论");
    error.name = "DriveForbiddenError";
    throw error;
  }
  if (!(await headObject(config, sourcePath(topicId, relativePath)))) throw new Error("文件不存在");
  return { url: await presignObjectUrl(config, "GET", sourcePath(topicId, relativePath)), name: relativePath.split("/").at(-1) || relativePath, expiresIn: config.signExpiresSeconds };
}

export async function patchKnowledgeFile(
  config: DriveConfig,
  input: { topicId: unknown; relativePath: unknown; incorporated?: unknown; reportDate?: unknown; updatedBy: string },
): Promise<{ metadata: FileMetadata; indexChanged: boolean }> {
  const topicId = normalizeTopicId(input.topicId);
  const relativePath = normalizeRelativeFilePath(input.relativePath);
  const metadata = await readJson<FileMetadata>(config, fileMetaPath(topicId, relativePath));
  if (!metadata) throw new Error("文件元数据不存在");
  const role = knowledgeRoleOf(metadata, relativePath);
  const now = new Date().toISOString();
  let next = { ...metadata, knowledgeRole: role };
  let indexChanged = false;
  if (input.incorporated !== undefined) {
    if (role !== "reference" || typeof input.incorporated !== "boolean") throw new Error("仅研报原件可以修改纳入状态");
    if (input.incorporated) {
      next = { ...next, incorporatedAt: now, incorporatedBy: input.updatedBy };
    } else {
      delete next.incorporatedAt;
      delete next.incorporatedBy;
    }
  }
  if (input.reportDate !== undefined) {
    if (role !== "evidence") throw new Error("仅时效资料可以修改资料日期");
    const reportDate = normalizeReportDate(input.reportDate);
    next = { ...next, reportDate, reportDateSource: "manual" };
    indexChanged = next.reportDate !== metadata.reportDate || metadata.reportDateSource !== "manual";
  }
  if (input.incorporated === undefined && input.reportDate === undefined) throw new Error("没有可更新的文件字段");
  if (indexChanged) {
    const topic = await readKnowledgeTopic(config, topicId);
    // Advance the version first. If a later write fails, readers will reject
    // the old manifest instead of serving an index with a stale report date.
    await putObjectText(config, `${topicPrefix(topicId)}topic.json`, JSON.stringify({ ...topic, updatedAt: now, indexVersion: topic.indexVersion + 1 }, null, 2), "application/json; charset=utf-8");
    await putObjectText(config, fileMetaPath(topicId, relativePath), JSON.stringify(next, null, 2), "application/json; charset=utf-8");
    await Promise.all([
      deleteObject(config, topicIndexPath(topicId)),
      deleteObject(config, topicIndexManifestPath(topicId)),
    ]);
  } else {
    await putObjectText(config, fileMetaPath(topicId, relativePath), JSON.stringify(next, null, 2), "application/json; charset=utf-8");
  }
  return { metadata: next, indexChanged };
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

function normalizeKnowledgeRole(input: unknown): KnowledgeRole {
  if (input === "reference" || input === "methodology" || input === "evidence") return input;
  if (input === undefined || input === null || input === "") return "evidence";
  throw new Error("资料类型无效");
}

function normalizeReportDate(input: unknown): string {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) throw new Error("资料日期必须为 YYYY-MM-DD");
  const date = new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) throw new Error("资料日期无效");
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
