import type { DriveConfig } from "./config";
import pLimit from "p-limit";
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
import { normalizePrefix, normalizeRelativeFilePath } from "./paths";
import type { SerializedSearchIndex } from "./search";
import {
  FILE_LIMITS,
  extensionFromPath,
  filePolicyForExtension,
  type ProcessingKind,
} from "../shared/policy";
import type {
  FileListProgressStage,
  FileListProgressState,
  KnowledgeRole,
  FolderIncorporationResult,
  FolderSummaryPage,
  ProcessingState,
  ReportDateSource,
} from "../shared/contracts";
import {
  knowledgeRoleForPath,
  LEGACY_METHODOLOGY_PATH,
  METHODOLOGY_FILE_PREFIX,
  METHODOLOGY_FILE_SUFFIX,
} from "../shared/methodology";

export const IMAGE_MAX_BYTES = FILE_LIMITS.compactBytes;
export const DOCUMENT_MAX_BYTES = FILE_LIMITS.documentBytes;
export const MAX_PDF_PAGES = FILE_LIMITS.pdfPages;
export const KNOWLEDGE_LIST_PAGE_SIZE = 10;
export const KNOWLEDGE_FOLDER_SUMMARY_PAGE_SIZE = 10;
export const KNOWLEDGE_FOLDER_UPDATE_PAGE_SIZE = 10;

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
  storageLayout?: "role-trees-v1";
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
  uploadId?: string;
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
  failureCode?: "PROCESSING_FAILED";
  retryable?: boolean;
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

export interface FileListProgressUpdate {
  stage: FileListProgressStage;
  state: FileListProgressState;
  completed?: number;
  total?: number;
}

interface ReferenceMetadataEntry {
  relativePath: string;
  metadata: FileMetadata;
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

export function roleFilesPrefix(topicId: string, knowledgeRole: KnowledgeRole): string {
  return `${topicPrefix(topicId)}files/${normalizeKnowledgeRole(knowledgeRole)}/`;
}

export function sourcePath(topicId: string, knowledgeRole: KnowledgeRole, relativePath: string): string {
  return `${roleFilesPrefix(topicId, knowledgeRole)}${normalizeRelativeFilePath(relativePath)}`;
}

export function fileMetaPath(topicId: string, knowledgeRole: KnowledgeRole, relativePath: string): string {
  return `${topicPrefix(topicId)}file-meta/${normalizeKnowledgeRole(knowledgeRole)}/${normalizeRelativeFilePath(relativePath)}.json`;
}

export function processedPrefix(topicId: string, knowledgeRole: KnowledgeRole, relativePath: string): string {
  return `${topicPrefix(topicId)}processed/${normalizeKnowledgeRole(knowledgeRole)}/${normalizeRelativeFilePath(relativePath)}.__file__/`;
}

export function tempUploadPath(uploadIdInput: unknown): string {
  return `system/temp/${normalizeUploadId(uploadIdInput)}/source`;
}

export function processingStatusPath(topicId: string, knowledgeRole: KnowledgeRole, relativePath: string): string {
  return `${processedPrefix(topicId, knowledgeRole, relativePath)}status.json`;
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
    storageLayout: "role-trees-v1",
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
      if (topic.storageLayout !== "role-trees-v1") return null;
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
  knowledgeRoleInput: unknown,
  relativePrefixInput: unknown,
  cursor?: string | null,
  options: {
    includeMethodology?: boolean;
    onProgress?: (update: FileListProgressUpdate) => void;
    metadataConcurrency?: number;
    requestId?: string;
  } = {},
): Promise<{ role: KnowledgeRole; prefix: string; folders: DriveFolder[]; files: KnowledgeFile[]; nextCursor: string | null }> {
  const topicId = normalizeTopicId(topicIdInput);
  const knowledgeRole = normalizeRequiredKnowledgeRole(knowledgeRoleInput);
  options.onProgress?.({ stage: "topic", state: "active" });
  const topic = await readKnowledgeTopic(config, topicId);
  options.onProgress?.({ stage: "topic", state: "complete" });
  const relativePrefix = relativePrefixInput ? normalizeDirectoryPrefix(relativePrefixInput) : "";
  const filesPrefix = roleFilesPrefix(topicId, knowledgeRole);
  const storagePrefix = `${filesPrefix}${relativePrefix}`;
  options.onProgress?.({ stage: "objects", state: "active" });
  const listed = await listObjects(config, storagePrefix, cursor, KNOWLEDGE_LIST_PAGE_SIZE);
  options.onProgress?.({ stage: "objects", state: "complete", total: listed.files.length });
  const total = listed.files.length;
  let completed = 0;
  options.onProgress?.({ stage: "metadata", state: "active", completed, total });
  const limit = pLimit(Math.max(1, options.metadataConcurrency || 8));
  const enriched = await Promise.all(listed.files.map((file) => limit(async (): Promise<KnowledgeFile | null> => {
    const relativePath = file.path.slice(filesPrefix.length);
    try {
      if (knowledgeRole === "methodology" && !options.includeMethodology) return null;
      let meta: FileMetadata | null = null;
      let processing: ProcessingStatus | null = null;
      try {
        [meta, processing] = await Promise.all([
          readJson<FileMetadata>(config, fileMetaPath(topicId, knowledgeRole, relativePath)),
          knowledgeRole === "reference"
            ? Promise.resolve(null)
            : readJson<ProcessingStatus>(config, processingStatusPath(topicId, knowledgeRole, relativePath)),
        ]);
      } catch (error) {
        console.error("Knowledge file metadata read failed", {
          code: "FILE_METADATA_READ_FAILED",
          requestId: options.requestId,
          topicId,
          knowledgeRole,
          path: relativePath,
          error: serverErrorDetails(error),
        });
      }
      let publicProcessing: ProcessingStatus | undefined;
      if (processing?.sourceEtag === file.etag) {
        const { error: _internalError, ...safeProcessing } = processing;
        publicProcessing = {
          ...safeProcessing,
          ...(processing.state === "failed"
            ? { failureCode: "PROCESSING_FAILED" as const, retryable: true }
            : {}),
        };
      }
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
        processing: publicProcessing,
      };
    } finally {
      completed += 1;
      options.onProgress?.({ stage: "metadata", state: "active", completed, total });
    }
  })));
  options.onProgress?.({ stage: "metadata", state: "complete", completed, total });
  options.onProgress?.({ stage: "assembling", state: "active" });
  const response = {
    role: knowledgeRole,
    prefix: relativePrefix,
    folders: listed.folders.map((folder) => ({ name: folder.name, path: folder.path.slice(filesPrefix.length) })),
    files: enriched.filter((file): file is KnowledgeFile => Boolean(file)),
    nextCursor: listed.nextCursor,
  };
  options.onProgress?.({ stage: "assembling", state: "complete" });
  return response;
}

export async function patchKnowledgeFolderIncorporation(
  config: DriveConfig,
  input: { topicId: unknown; prefix: unknown; incorporated: unknown; cursor?: string | null; updatedBy: string; requestId?: string; concurrency?: number },
): Promise<FolderIncorporationResult> {
  const topicId = normalizeTopicId(input.topicId);
  const prefix = normalizeDirectoryPrefix(input.prefix);
  if (!prefix) throw new Error("文件夹路径无效");
  if (typeof input.incorporated !== "boolean") throw new Error("纳入状态无效");
  await readKnowledgeTopic(config, topicId);
  const page = await listReferenceMetadataPage(config, topicId, prefix, input.cursor, KNOWLEDGE_FOLDER_UPDATE_PAGE_SIZE);
  const entries = page.entries;
  const changed = entries.filter(({ metadata }) => Boolean(metadata.incorporatedAt) !== input.incorporated);
  const failures: FolderIncorporationResult["failures"] = [];
  let changedCount = 0;
  const limit = pLimit(Math.max(1, input.concurrency || 8));
  await Promise.all(changed.map((entry) => limit(async () => {
    try {
      const next = { ...entry.metadata, knowledgeRole: "reference" as const };
      if (input.incorporated) {
        next.incorporatedAt = new Date().toISOString();
        next.incorporatedBy = input.updatedBy;
      } else {
        delete next.incorporatedAt;
        delete next.incorporatedBy;
      }
      await putObjectText(
        config,
        fileMetaPath(topicId, "reference", entry.relativePath),
        JSON.stringify(next, null, 2),
        "application/json; charset=utf-8",
      );
      changedCount += 1;
    } catch (error) {
      console.error("Folder incorporation item failed", {
        code: "FOLDER_ITEM_UPDATE_FAILED",
        requestId: input.requestId,
        path: entry.relativePath,
        error,
      });
      failures.push({
        path: entry.relativePath,
        code: "FOLDER_ITEM_UPDATE_FAILED",
        requestId: input.requestId || "unknown",
        retryable: true,
        message: "文件夹内部分研报更新失败，请重试。",
      });
    }
  })));
  return {
    matchedCount: entries.length,
    changedCount,
    skippedCount: entries.length - changed.length,
    failedCount: failures.length,
    failures,
    nextCursor: page.nextCursor,
  };
}

export async function readKnowledgeFolderSummaryPage(
  config: DriveConfig,
  input: { topicId: unknown; prefix: unknown; cursor?: string | null },
): Promise<FolderSummaryPage> {
  const topicId = normalizeTopicId(input.topicId);
  const prefix = normalizeDirectoryPrefix(input.prefix);
  if (!prefix) throw new Error("文件夹路径无效");
  await readKnowledgeTopic(config, topicId);
  const page = await listReferenceMetadataPage(config, topicId, prefix, input.cursor, KNOWLEDGE_FOLDER_SUMMARY_PAGE_SIZE);
  return {
    scannedCount: page.scannedCount,
    referenceCount: page.entries.length,
    incorporatedCount: page.entries.filter((entry) => Boolean(entry.metadata.incorporatedAt)).length,
    nextCursor: page.nextCursor,
  };
}

async function listReferenceMetadataPage(
  config: DriveConfig,
  topicId: string,
  relativePrefix: string,
  cursor?: string | null,
  pageSize = KNOWLEDGE_FOLDER_SUMMARY_PAGE_SIZE,
): Promise<{ entries: ReferenceMetadataEntry[]; scannedCount: number; nextCursor: string | null }> {
  const filesPrefix = roleFilesPrefix(topicId, "reference");
  const storagePrefix = `${filesPrefix}${relativePrefix}`;
  const page = await listObjectPaths(config, storagePrefix, cursor, pageSize);
  const paths = page.paths.filter((path) => !path.endsWith("/"));
  const limit = pLimit(8);
  const entries = await Promise.all(paths.map((path) => limit(async (): Promise<ReferenceMetadataEntry | null> => {
    const relativePath = path.slice(filesPrefix.length);
    const metadata = await readJson<FileMetadata>(config, fileMetaPath(topicId, "reference", relativePath));
    if (!metadata) return null;
    return { relativePath, metadata };
  })));
  return {
    entries: entries.filter((entry): entry is ReferenceMetadataEntry => Boolean(entry)),
    scannedCount: paths.length,
    nextCursor: page.nextCursor,
  };
}

export async function createUpload(config: DriveConfig, input: { topicId: unknown; relativePath: unknown; size: unknown; contentType: unknown; pdfPages?: unknown; knowledgeRole?: unknown }): Promise<{ url: string; uploadId: string; path: string; contentType: string; knowledgeRole: KnowledgeRole; maxFileBytes: number; requiredHeaders: Record<string, string>; expiresIn: number }> {
  const topicId = normalizeTopicId(input.topicId);
  const topic = await readKnowledgeTopic(config, topicId);
  const knowledgeRole = normalizeKnowledgeRole(input.knowledgeRole);
  const methodologyPath = methodologyPathForTopic(topic);
  const relativePath = knowledgeRole === "methodology" ? methodologyPath : normalizeRelativeFilePath(input.relativePath);
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
  const policy = filePolicy(relativePath);
  if (knowledgeRole === "methodology" && policy.extension !== "md") throw new Error("专题方法论只支持 Markdown 文件");
  const declaredSize = normalizePositiveSize(input.size);
  const declaredContentType = normalizeContentType(input.contentType);
  const pdfPages = knowledgeRole === "reference" ? undefined : normalizePdfPages(policy.extension, input.pdfPages);
  const temporaryPath = tempUploadPath(input.uploadId);
  const actual = await headObject(config, temporaryPath);
  if (!actual) {
    const [existingMetadata, existingSource] = await Promise.all([
      readJson<FileMetadata>(config, fileMetaPath(topicId, knowledgeRole, relativePath)),
      headObject(config, sourcePath(topicId, knowledgeRole, relativePath)),
    ]);
    if (
      existingMetadata
      && existingMetadata.uploadId === input.uploadId
      && existingMetadata.size === declaredSize
      && baseContentType(existingMetadata.contentType) === baseContentType(declaredContentType)
      && existingMetadata.knowledgeRole === knowledgeRole
      && existingSource?.etag === existingMetadata.etag
      && existingSource.size === existingMetadata.size
    ) {
      return existingMetadata;
    }
    throw new Error("COS 中未找到已上传文件");
  }
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
    readJson<FileMetadata>(config, fileMetaPath(topicId, knowledgeRole, relativePath)),
    headObject(config, sourcePath(topicId, knowledgeRole, relativePath)),
  ]);
  if (existingSource && !previousMetadata) {
    await deleteObject(config, temporaryPath);
    throw new Error("同名文件的元数据缺失，请先删除后再上传");
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
    uploadId: String(input.uploadId),
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
    putObjectText(config, fileMetaPath(topicId, knowledgeRole, relativePath), JSON.stringify(metadata, null, 2), "application/json; charset=utf-8"),
  ];
  if (affectsIndex) {
    registrations.push(
      putObjectText(config, `${topicPrefix(topicId)}topic.json`, JSON.stringify(nextTopic, null, 2), "application/json; charset=utf-8"),
      putObjectText(config, processingStatusPath(topicId, knowledgeRole, relativePath), JSON.stringify(status, null, 2), "application/json; charset=utf-8"),
      deleteObject(config, topicIndexPath(topicId)),
      deleteObject(config, topicIndexManifestPath(topicId)),
    );
  } else {
    registrations.push(deletePrefix(config, processedPrefix(topicId, knowledgeRole, relativePath)));
  }
  await Promise.all(registrations);
  try {
    // The COS ObjectCreated event must not become visible before its processing metadata.
    await copyObject(config, temporaryPath, sourcePath(topicId, knowledgeRole, relativePath), actual.etag);
    const copied = await headObject(config, sourcePath(topicId, knowledgeRole, relativePath));
    if (!copied || copied.size !== actual.size || copied.etag !== actual.etag) throw new Error("COS 文件转存校验失败");
  } catch (error) {
    await Promise.all([
      deleteObject(config, sourcePath(topicId, knowledgeRole, relativePath)),
      deleteObject(config, fileMetaPath(topicId, knowledgeRole, relativePath)),
      deleteObject(config, processingStatusPath(topicId, knowledgeRole, relativePath)),
    ]);
    throw error;
  }
  await deleteObject(config, temporaryPath);
  return metadata;
}

export async function deleteKnowledgeFile(config: DriveConfig, topicIdInput: unknown, knowledgeRoleInput: unknown, relativePathInput: unknown, confirmName: unknown): Promise<{ indexChanged: boolean }> {
  const topicId = normalizeTopicId(topicIdInput);
  const knowledgeRole = normalizeRequiredKnowledgeRole(knowledgeRoleInput);
  const relativePath = normalizeRelativeFilePath(relativePathInput);
  const expectedName = relativePath.split("/").at(-1) || relativePath;
  if (confirmName !== expectedName) throw new Error("文件名称确认不匹配");
  const [topic, metadata] = await Promise.all([
    readKnowledgeTopic(config, topicId),
    readJson<FileMetadata>(config, fileMetaPath(topicId, knowledgeRole, relativePath)),
  ]);
  if (!metadata || metadata.knowledgeRole !== knowledgeRole) throw new Error("文件元数据不存在");
  const affectsIndex = knowledgeRole !== "reference";
  const updatedAt = new Date().toISOString();
  if (affectsIndex) {
    await putObjectText(config, `${topicPrefix(topicId)}topic.json`, JSON.stringify({ ...topic, updatedAt, indexVersion: topic.indexVersion + 1 }, null, 2), "application/json; charset=utf-8");
  }
  const deletions: Promise<unknown>[] = [
    deleteObject(config, sourcePath(topicId, knowledgeRole, relativePath)),
    deleteObject(config, fileMetaPath(topicId, knowledgeRole, relativePath)),
    deletePrefix(config, processedPrefix(topicId, knowledgeRole, relativePath)),
  ];
  if (affectsIndex) {
    deletions.push(deleteObject(config, topicIndexPath(topicId)), deleteObject(config, topicIndexManifestPath(topicId)));
  }
  await Promise.all(deletions);
  return { indexChanged: affectsIndex };
}

export async function createDownloadUrl(config: DriveConfig, topicIdInput: unknown, knowledgeRoleInput: unknown, relativePathInput: unknown, options: { includeMethodology?: boolean } = {}): Promise<{ url: string; name: string; expiresIn: number }> {
  const topicId = normalizeTopicId(topicIdInput);
  const knowledgeRole = normalizeRequiredKnowledgeRole(knowledgeRoleInput);
  const relativePath = normalizeRelativeFilePath(relativePathInput);
  if (knowledgeRole === "methodology" && !options.includeMethodology) {
    const error = new Error("无权下载专题方法论");
    error.name = "DriveForbiddenError";
    throw error;
  }
  const [topic, metadata] = await Promise.all([
    readKnowledgeTopic(config, topicId),
    readJson<FileMetadata>(config, fileMetaPath(topicId, knowledgeRole, relativePath)),
  ]);
  if (!metadata || metadata.knowledgeRole !== knowledgeRole) throw new Error("文件元数据不存在");
  if (!(await headObject(config, sourcePath(topicId, knowledgeRole, relativePath)))) throw new Error("文件不存在");
  return { url: await presignObjectUrl(config, "GET", sourcePath(topicId, knowledgeRole, relativePath)), name: relativePath.split("/").at(-1) || relativePath, expiresIn: config.signExpiresSeconds };
}

export async function patchKnowledgeFile(
  config: DriveConfig,
  input: { topicId: unknown; knowledgeRole: unknown; relativePath: unknown; incorporated?: unknown; reportDate?: unknown; updatedBy: string },
): Promise<{ metadata: FileMetadata; indexChanged: boolean }> {
  const topicId = normalizeTopicId(input.topicId);
  const role = normalizeRequiredKnowledgeRole(input.knowledgeRole);
  const relativePath = normalizeRelativeFilePath(input.relativePath);
  const metadata = await readJson<FileMetadata>(config, fileMetaPath(topicId, role, relativePath));
  if (!metadata) throw new Error("文件元数据不存在");
  if (metadata.knowledgeRole !== role) throw new Error("资料类型不匹配");
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
    await putObjectText(config, fileMetaPath(topicId, role, relativePath), JSON.stringify(next, null, 2), "application/json; charset=utf-8");
    await Promise.all([
      deleteObject(config, topicIndexPath(topicId)),
      deleteObject(config, topicIndexManifestPath(topicId)),
    ]);
  } else {
    await putObjectText(config, fileMetaPath(topicId, role, relativePath), JSON.stringify(next, null, 2), "application/json; charset=utf-8");
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

export function normalizeKnowledgeRole(input: unknown): KnowledgeRole {
  if (input === "reference" || input === "methodology" || input === "evidence") return input;
  if (input === undefined || input === null || input === "") return "evidence";
  throw new Error("资料类型无效");
}

function normalizeRequiredKnowledgeRole(input: unknown): KnowledgeRole {
  if (input === undefined || input === null || input === "") throw new Error("请指定资料类型");
  return normalizeKnowledgeRole(input);
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
  return normalizePrefix(input);
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

function serverErrorDetails(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack };
  return { name: "UnknownError", message: String(error) };
}

function sizeLimitError(maxBytes: number): Error {
  return new Error(`文件不能超过 ${Math.round(maxBytes / 1024 / 1024)} MB`);
}
