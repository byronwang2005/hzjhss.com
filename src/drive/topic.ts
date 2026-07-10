import type { DriveConfig } from "./config";
import {
  type DriveFile,
  type DriveListResult,
  createFolder,
  deleteObjects,
  getObjectText,
  listObjectPaths,
  listObjects,
  presignObjectUrl,
  putObjectText,
} from "./cos";
import { normalizeFolderName, normalizeObjectPath, normalizePrefix } from "./paths";

export const DRIVE_META_FILENAME = "._drive-meta.json";
export const TOPIC_META_FILENAME = "._topic.json";
export const GENERATE_PROMPT_FILENAME = "成果生成与回传.prompt.md";
export const OUTPUTS_FOLDER_NAME = "outputs";
export const AGENT_MANIFEST_FOLDER_NAME = "._agent-manifests";
export const AGENT_OUTPUT_FORMATS = [
  { extension: ".md", contentType: "text/markdown; charset=utf-8" },
  { extension: ".pdf", contentType: "application/pdf" },
] as const;

export interface DriveFileMetadata {
  uploadedBy: string;
  uploadedAt: string;
  contentType: string;
  size: number;
  kind: "material" | "output" | "prompt" | "topic";
}

export interface DriveDirectoryMetadata {
  version: 1;
  files: Record<string, DriveFileMetadata>;
}

export interface TopicMetadata {
  version: 2;
  instanceId: string;
  name: string;
  prefix: string;
  analysisKeywords: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface TopicDetail {
  topic: TopicMetadata;
  outputs: DriveFile[];
}

export interface DeleteTopicResult {
  ok: true;
  prefix: string;
  name: string;
  deletedCount: number;
}

export interface AgentManifestFile {
  path: string;
  name: string;
  size: number;
  lastModified: string;
  uploadedBy?: string;
  contentType?: string;
  signedUrl: string;
}

export interface AgentManifest {
  version: 1;
  topic: Pick<TopicMetadata, "name" | "prefix" | "analysisKeywords">;
  generatedAt: string;
  expiresAt: string;
  expiresIn: number;
  files: AgentManifestFile[];
  instructions: string[];
}

export interface AgentManifestResult {
  prompt: string;
  manifestUrl: string;
  manifestPath: string;
  expiresIn: number;
  generatedAt: string;
  fileCount: number;
}

export interface DriveOverviewOutput {
  name: string;
  path: string;
  uploadedAt?: string;
  lastModified: string;
  contentType?: string;
  size: number;
}

export interface DriveOverviewTopic {
  prefix: string;
  name: string;
  analysisKeywords: string;
  createdBy: string;
  updatedAt: string;
  outputCount: number;
  latestOutput?: DriveOverviewOutput;
}

export interface DriveOverview {
  topics: DriveOverviewTopic[];
}

export interface TopicScaffoldOptions {
  displayName: string;
  origin: string;
}

export function normalizeTopicName(input: unknown): string {
  return normalizeFolderName(input);
}

export function topicPrefixFromName(name: string): string {
  return `${normalizeTopicName(name)}/`;
}

export function normalizeTopicPrefix(input: unknown): string {
  const prefix = normalizePrefix(input);
  const segments = prefix.split("/").filter(Boolean);
  if (segments.length !== 1) {
    throw new Error("专题路径无效");
  }
  return prefix;
}

export function isSystemFileName(name: string): boolean {
  return name.startsWith("._");
}

export function hasSystemPathSegment(path: string): boolean {
  return path.split("/").some(isSystemFileName);
}

export async function createTopic(
  config: DriveConfig,
  input: { name: unknown; analysisKeywords?: unknown; description?: unknown; displayName: string; origin: string },
): Promise<TopicDetail> {
  const name = normalizeTopicName(input.name);
  const prefix = topicPrefixFromName(name);
  const analysisKeywords = normalizeAnalysisKeywords(input.analysisKeywords ?? input.description, true);
  const now = new Date().toISOString();
  const topic: TopicMetadata = {
    version: 2,
    instanceId: createNonce(),
    name,
    prefix,
    analysisKeywords,
    createdBy: input.displayName,
    createdAt: now,
    updatedBy: input.displayName,
    updatedAt: now,
  };
  const existing = await getObjectText(config, `${prefix}${TOPIC_META_FILENAME}`);
  if (existing) {
    throw new Error("同名专题已存在");
  }

  await createFolder(config, prefix);
  await createFolder(config, `${prefix}${OUTPUTS_FOLDER_NAME}/`);
  await putObjectText(config, `${prefix}${TOPIC_META_FILENAME}`, JSON.stringify(topic, null, 2), "application/json; charset=utf-8");
  await writeDriveMeta(config, prefix, {
    version: 1,
    files: {
      [TOPIC_META_FILENAME]: fileMetadata(input.displayName, JSON.stringify(topic), "application/json; charset=utf-8", "topic", now),
    },
  });
  await writeDriveMeta(config, `${prefix}${OUTPUTS_FOLDER_NAME}/`, { version: 1, files: {} });

  return {
    topic,
    outputs: [],
  };
}

export async function readTopic(config: DriveConfig, rawPrefix: unknown, options: TopicScaffoldOptions): Promise<TopicDetail> {
  const prefix = normalizeTopicPrefix(rawPrefix);
  const { topic } = await ensureTopicScaffold(config, prefix, options);
  return { topic, outputs: await listOutputsForTopicInstance(config, topic) };
}

export async function readExistingTopicMetadata(config: DriveConfig, rawPrefix: unknown): Promise<TopicMetadata | null> {
  return readTopicMetadataIfExists(config, normalizeTopicPrefix(rawPrefix));
}

export async function updateTopic(
  config: DriveConfig,
  input: {
    prefix: unknown;
    analysisKeywords?: unknown;
    description?: unknown;
    displayName: string;
    origin: string;
  },
): Promise<TopicDetail> {
  const prefix = normalizeTopicPrefix(input.prefix);
  const { topic } = await ensureTopicScaffold(config, prefix, {
    displayName: input.displayName,
    origin: input.origin,
  });
  const rawKeywords = input.analysisKeywords ?? input.description;
  const analysisKeywords = rawKeywords == null ? topic.analysisKeywords : normalizeAnalysisKeywords(rawKeywords, true);
  const now = new Date().toISOString();
  const updatedTopic: TopicMetadata = {
    ...topic,
    version: 2,
    analysisKeywords,
    updatedBy: input.displayName,
    updatedAt: now,
  };

  await putObjectText(config, `${prefix}${TOPIC_META_FILENAME}`, JSON.stringify(updatedTopic, null, 2), "application/json; charset=utf-8");
  await recordFileMetadata(
    config,
    `${prefix}${TOPIC_META_FILENAME}`,
    fileMetadata(input.displayName, JSON.stringify(updatedTopic), "application/json; charset=utf-8", "topic", now),
  );
  return { topic: updatedTopic, outputs: await listOutputsForTopicInstance(config, updatedTopic) };
}

export async function deleteTopic(
  config: DriveConfig,
  input: { prefix: unknown; confirmName: unknown; displayName: string; origin: string },
): Promise<DeleteTopicResult> {
  const prefix = normalizeTopicPrefix(input.prefix);
  const { topic } = await ensureTopicScaffold(config, prefix, {
    displayName: input.displayName,
    origin: input.origin,
  });
  if (typeof input.confirmName !== "string" || input.confirmName.trim() !== topic.name) {
    throw new Error("专题名称确认不一致");
  }
  const paths = await listAllObjectPaths(config, prefix);
  await deleteObjects(config, paths);
  return {
    ok: true,
    prefix,
    name: topic.name,
    deletedCount: paths.length,
  };
}

export async function readDriveOverview(config: DriveConfig, options: TopicScaffoldOptions): Promise<DriveOverview> {
  const root = await listDirectoryWithMetadata(config, "");
  const topics = await Promise.all(
    root.folders.map(async (folder): Promise<DriveOverviewTopic | null> => {
      try {
        const topic = await readTopicMetadataIfExists(config, folder.path);
        if (!topic) {
          return null;
        }
        const outputs = (await listOutputsForTopicInstance(config, topic)).sort((a, b) => timestampForFile(b) - timestampForFile(a));
        const latest = outputs[0];
        return {
          prefix: topic.prefix,
          name: topic.name,
          analysisKeywords: topic.analysisKeywords,
          createdBy: topic.createdBy,
          updatedAt: topic.updatedAt,
          outputCount: outputs.length,
          latestOutput: latest
            ? {
                name: latest.name,
                path: latest.path,
                uploadedAt: latest.uploadedAt,
                lastModified: latest.lastModified,
                contentType: latest.contentType,
                size: latest.size,
              }
            : undefined,
        };
      } catch {
        return null;
      }
    }),
  );

  return {
    topics: topics
      .filter((topic): topic is DriveOverviewTopic => Boolean(topic))
      .sort((a, b) => timestampForTopic(b) - timestampForTopic(a) || a.name.localeCompare(b.name, "zh-Hans-CN")),
  };
}

export async function listDirectoryWithMetadata(
  config: DriveConfig,
  prefix: string,
  cursor?: string | null,
): Promise<DriveListResult> {
  const result = await listObjects(config, prefix, cursor);
  const meta = await readDriveMeta(config, prefix);
  return mergeListMetadata(result, meta);
}

export function mergeListMetadata(result: DriveListResult, meta: DriveDirectoryMetadata): DriveListResult {
  return {
    ...result,
    files: result.files.map((file) => {
      const entry = meta.files[file.name];
      return entry
        ? {
            ...file,
            uploadedBy: entry.uploadedBy,
            uploadedAt: entry.uploadedAt,
            contentType: entry.contentType,
            kind: entry.kind,
          }
        : file;
    }),
  };
}

export async function recordUploadComplete(
  config: DriveConfig,
  input: { path: unknown; displayName: string; size?: unknown; contentType?: unknown; kind?: unknown },
): Promise<DriveFileMetadata & { path: string; name: string }> {
  const path = normalizeObjectPath(input.path);
  if (isSystemFileName(fileNameFromPath(path))) {
    throw new Error("不能登记系统文件");
  }
  const now = new Date().toISOString();
  const meta: DriveFileMetadata = {
    uploadedBy: input.displayName,
    uploadedAt: now,
    contentType: normalizeContentType(input.contentType),
    size: normalizeSize(input.size),
    kind: normalizeUploadKind(input.kind, path),
  };
  await recordFileMetadata(config, path, meta);
  return { ...meta, path, name: fileNameFromPath(path) };
}

export async function removeFileMetadata(config: DriveConfig, rawPath: unknown): Promise<void> {
  const path = normalizeObjectPath(rawPath);
  const prefix = directoryPrefixFromPath(path);
  const name = fileNameFromPath(path);
  const meta = await readDriveMeta(config, prefix);
  if (!meta.files[name]) {
    return;
  }
  delete meta.files[name];
  await writeDriveMeta(config, prefix, meta);
}

export async function createAgentManifest(
  config: DriveConfig,
  input: { prefix: unknown; displayName: string; origin: string },
): Promise<AgentManifestResult> {
  const prefix = normalizeTopicPrefix(input.prefix);
  const { topic } = await ensureTopicScaffold(config, prefix, {
    displayName: input.displayName,
    origin: input.origin,
  });
  requireAnalysisKeywords(topic.analysisKeywords);
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + config.signExpiresSeconds * 1000);
  const materialFiles = await listTopicMaterialFiles(config, prefix);
  const files: AgentManifestFile[] = await Promise.all(
    materialFiles.map(async (file) => ({
      path: file.path,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      uploadedBy: file.uploadedBy,
      contentType: file.contentType,
      signedUrl: await presignObjectUrl(config, "GET", file.path),
    })),
  );
  const manifest: AgentManifest = {
    version: 1,
    topic: {
      name: topic.name,
      prefix: topic.prefix,
      analysisKeywords: topic.analysisKeywords,
    },
    generatedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    expiresIn: config.signExpiresSeconds,
    files,
    instructions: [
      "不需要登录，不需要 cookie。",
      "先下载本 manifest JSON，再逐个读取 files[].signedUrl。",
      "保留每条结论的来源 path、文件名、作者或机构、发布日期和关键数据。",
      "跳过 outputs/、系统隐藏文件和提示词文件。",
      "链接过期后回到专题资料库重新生成 agent 分析提示词。",
    ],
  };
  const manifestPath = `${prefix}${AGENT_MANIFEST_FOLDER_NAME}/${compactTimestamp(generatedAt)}-${createNonce()}.json`;
  await putObjectText(config, manifestPath, JSON.stringify(manifest, null, 2), "application/json; charset=utf-8");
  const manifestUrl = await presignObjectUrl(config, "GET", manifestPath);
  return {
    prompt: createAgentManifestPrompt({
      topic,
      generatedAt: manifest.generatedAt,
      expiresAt: manifest.expiresAt,
      expiresIn: manifest.expiresIn,
      fileCount: files.length,
      manifestUrl,
    }),
    manifestUrl,
    manifestPath,
    expiresIn: config.signExpiresSeconds,
    generatedAt: manifest.generatedAt,
    fileCount: files.length,
  };
}

export function createAgentManifestPrompt(input: {
  topic: Pick<TopicMetadata, "name" | "prefix" | "analysisKeywords">;
  generatedAt: string;
  expiresAt: string;
  expiresIn: number;
  fileCount: number;
  manifestUrl: string;
}): string {
  return `# ${input.topic.name}：第一阶段 · 资料分析任务

你是本地 AI agent。你不需要登录网盘，也不需要携带 cookie。

请先下载这一个 manifest JSON：
${input.manifestUrl}

链接信息：
- 专题路径：${input.topic.prefix}
- 生成时间：${input.generatedAt}
- 过期时间：${input.expiresAt}
- 有效期：${input.expiresIn} 秒
- 资料数量：${input.fileCount}

分析关键词（本阶段的分析依据）：
${input.topic.analysisKeywords}

读取方法：
1. 下载 manifest JSON。
2. 遍历 manifest.files，使用每个文件的 signedUrl 下载资料。
3. 分析 PDF、HTML、Markdown、Word、Excel、PPT、图片等资料；无法解析时记录原因和文件 path。
4. 围绕分析关键词输出资料索引和结构化分析，至少包含：来源 path、资料类型、作者或机构、发布日期、核心观点、关键数据、冲突观点、风险和待核验问题。
5. 每个重要判断必须标注来源 path。此阶段只完成分析，不生成或上传成果文件。
6. 分析完成后等待用户校正判断和确认最终口径；链接过期后停止读取，并提示用户重新复制第一阶段提示词。
`;
}

export function createAgentOutputPaths(
  topic: Pick<TopicMetadata, "name" | "prefix" | "instanceId">,
  generatedAt = new Date(),
  taskId = createNonce().slice(0, 8),
): [string, string] {
  const timestamp = generatedAt.toISOString().slice(0, 16).replace("T", "-").replace(":", "");
  const safeTopicName = topic.name.slice(0, 110);
  const basePath = `${topic.prefix}${OUTPUTS_FOLDER_NAME}/agent-${topic.instanceId}-${timestamp}-${taskId}-${safeTopicName}-专题总结`;
  return [`${basePath}${AGENT_OUTPUT_FORMATS[0].extension}`, `${basePath}${AGENT_OUTPUT_FORMATS[1].extension}`];
}

export function isExpectedAgentOutputContentType(path: string, contentType: string): boolean {
  return AGENT_OUTPUT_FORMATS.some((format) => path.endsWith(format.extension) && contentType === format.contentType);
}

export function createAgentOutputPrompt(input: {
  topic: Pick<TopicMetadata, "name" | "prefix" | "instanceId">;
  origin: string;
  token: string;
  expiresAt: string;
  expiresIn: number;
  markdownPath: string;
  pdfPath: string;
}): string {
  return `# ${input.topic.name}：第二阶段 · 成果生成与回传

你是本地 AI agent。本阶段不再重新分析资料，也不要重新套用第一阶段的分析关键词。

先检查当前会话：必须已经完成第一阶段资料分析，并且用户已经对判断进行调整、明确确认最终口径。若尚未形成用户确认的最终口径，立即停止，要求用户先确认；不得擅自生成成果。

成果要求：
1. 仅把当前会话中用户最终确认的口径整理为正式成果，不自行增加、删除或改变结论。
2. 成果至少包含：摘要、分析框架、关键发现、证据引用、风险、待核验事项。
3. 每个重要判断保留第一阶段提供的来源 path；不要虚构引用。
4. 必须生成内容一致的 Markdown 和 PDF 两个文件：
   - ${input.markdownPath}
   - ${input.pdfPath}

回传授权：
- 有效期：${input.expiresIn} 秒
- 过期时间：${input.expiresAt}
- Bearer token：${input.token}
- 令牌和短时 PUT URL 只用于请求鉴权，禁止写入成果正文、日志或最终回复。

回传流程（两个文件分别执行）：
1. POST \`${input.origin}/api/drive/agent-output-upload-url\`，请求头带 \`Authorization: Bearer <token>\` 和 \`Content-Type: application/json\`；body 包含上方对应的完整 \`path\`、实际 \`size\` 与 \`contentType\`。该接口不使用 Cookie。
2. Markdown 使用 \`${AGENT_OUTPUT_FORMATS[0].contentType}\`，PDF 使用 \`${AGENT_OUTPUT_FORMATS[1].contentType}\`。用返回的短时 PUT URL 上传，并原样携带返回的全部 \`requiredHeaders\`；其中 \`content-length\` 必须等于申请时的实际字节数。
3. PUT 成功后 POST \`${input.origin}/api/drive/agent-output-upload-complete\`，同样只携带 Bearer token、不携带 Cookie；body 包含返回的 \`path\`、实际 \`size\` 与 \`contentType\`。
4. 两个文件都成功登记后，报告各自 path。授权过期、专题已删除或任一步失败时停止并报告具体错误，提示用户重新复制第二阶段提示词。
`;
}

export async function listTopicMaterialFiles(config: DriveConfig, topicPrefix: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  const pending = [topicPrefix];
  while (pending.length) {
    const currentPrefix = pending.shift() as string;
    const listing = await listAllDirectoryWithMetadata(config, currentPrefix);
    for (const folder of listing.folders) {
      if (isAgentReadableFolder(topicPrefix, folder.path)) {
        pending.push(folder.path);
      }
    }
    for (const file of listing.files) {
      if (isAgentReadableFile(topicPrefix, file)) {
        files.push(file);
      }
    }
  }
  return files;
}

async function listAllDirectoryWithMetadata(config: DriveConfig, prefix: string): Promise<DriveListResult> {
  const folders = new Map<string, { name: string; path: string }>();
  const files: DriveFile[] = [];
  let cursor: string | null = null;
  do {
    const result = await listDirectoryWithMetadata(config, prefix, cursor);
    for (const folder of result.folders) {
      folders.set(folder.path, folder);
    }
    files.push(...result.files);
    cursor = result.nextCursor;
  } while (cursor);

  return {
    prefix,
    folders: Array.from(folders.values()),
    files,
    nextCursor: null,
  };
}

async function listAllObjectPaths(config: DriveConfig, prefix: string): Promise<string[]> {
  const paths: string[] = [];
  let cursor: string | null = null;
  do {
    const result = await listObjectPaths(config, prefix, cursor);
    paths.push(...result.paths);
    cursor = result.nextCursor;
  } while (cursor);
  return paths;
}

export function isAgentReadableFolder(topicPrefix: string, folderPath: string): boolean {
  return folderPath !== `${topicPrefix}${OUTPUTS_FOLDER_NAME}/` && !hasSystemPathSegment(folderPath);
}

export function isAgentReadableFile(topicPrefix: string, file: Pick<DriveFile, "path" | "name">): boolean {
  return (
    !file.path.startsWith(`${topicPrefix}${OUTPUTS_FOLDER_NAME}/`) &&
    !hasSystemPathSegment(file.path) &&
    file.name !== GENERATE_PROMPT_FILENAME
  );
}

async function ensureTopicScaffold(
  config: DriveConfig,
  prefix: string,
  options: TopicScaffoldOptions,
): Promise<{ topic: TopicMetadata }> {
  const now = new Date().toISOString();
  let topic = await readTopicMetadataIfExists(config, prefix);
  if (!topic) {
    const name = topicNameFromPrefix(prefix);
    topic = {
      version: 2,
      instanceId: createNonce(),
      name,
      prefix,
      analysisKeywords: "",
      createdBy: options.displayName,
      createdAt: now,
      updatedBy: options.displayName,
      updatedAt: now,
    };
    await putObjectText(config, `${prefix}${TOPIC_META_FILENAME}`, JSON.stringify(topic, null, 2), "application/json; charset=utf-8");
  }

  const outputsPrefix = `${prefix}${OUTPUTS_FOLDER_NAME}/`;
  const outputsMarker = await getObjectText(config, outputsPrefix);
  if (outputsMarker === null) {
    await createFolder(config, outputsPrefix);
  }

  const rootMeta = await readDriveMeta(config, prefix);
  let rootMetaChanged = false;
  if (!rootMeta.files[TOPIC_META_FILENAME]) {
    rootMeta.files[TOPIC_META_FILENAME] = fileMetadata(
      options.displayName,
      JSON.stringify(topic),
      "application/json; charset=utf-8",
      "topic",
      now,
    );
    rootMetaChanged = true;
  }
  if (rootMetaChanged) {
    await writeDriveMeta(config, prefix, rootMeta);
  }

  const outputsMetaPath = `${outputsPrefix}${DRIVE_META_FILENAME}`;
  const outputsMeta = await getObjectText(config, outputsMetaPath);
  if (outputsMeta === null) {
    await writeDriveMeta(config, outputsPrefix, { version: 1, files: {} });
  }

  return { topic };
}

async function readTopicMetadataIfExists(config: DriveConfig, prefix: string): Promise<TopicMetadata | null> {
  const text = await getObjectText(config, `${prefix}${TOPIC_META_FILENAME}`);
  if (!text) {
    return null;
  }
  const parsed = JSON.parse(text) as Omit<Partial<TopicMetadata>, "version"> & { version?: number; description?: unknown };
  if ((parsed.version !== 1 && parsed.version !== 2) || typeof parsed.name !== "string" || typeof parsed.prefix !== "string") {
    throw new Error("专题元数据无效");
  }
  return {
    version: 2,
    instanceId:
      typeof parsed.instanceId === "string" && /^[a-z0-9]{8,32}$/.test(parsed.instanceId)
        ? parsed.instanceId
        : legacyTopicInstanceId(prefix, typeof parsed.createdAt === "string" ? parsed.createdAt : ""),
    name: parsed.name,
    prefix,
    analysisKeywords:
      typeof parsed.analysisKeywords === "string"
        ? parsed.analysisKeywords
        : typeof parsed.description === "string"
          ? parsed.description
          : "",
    createdBy: typeof parsed.createdBy === "string" ? parsed.createdBy : "-",
    createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : "",
    updatedBy: typeof parsed.updatedBy === "string" ? parsed.updatedBy : "-",
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
  };
}

function topicNameFromPrefix(prefix: string): string {
  return prefix.replace(/\/$/, "");
}

function isOutputForTopicInstance(fileName: string, instanceId: string): boolean {
  const match = /^agent-([a-z0-9]+)-/.exec(fileName);
  return !match || match[1] === instanceId;
}

async function listOutputsForTopicInstance(config: DriveConfig, topic: Pick<TopicMetadata, "prefix" | "instanceId">): Promise<DriveFile[]> {
  const outputList = await listDirectoryWithMetadata(config, `${topic.prefix}${OUTPUTS_FOLDER_NAME}/`);
  return outputList.files.filter((file) => isOutputForTopicInstance(file.name, topic.instanceId));
}

function legacyTopicInstanceId(prefix: string, createdAt: string): string {
  let hash = 2166136261;
  for (const character of `${prefix}:${createdAt}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `legacy${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function timestampForTopic(topic: Pick<DriveOverviewTopic, "updatedAt" | "latestOutput">): number {
  return Math.max(Date.parse(topic.latestOutput?.uploadedAt || topic.latestOutput?.lastModified || "") || 0, Date.parse(topic.updatedAt) || 0);
}

function timestampForFile(file: Pick<DriveFile, "uploadedAt" | "lastModified">): number {
  return Date.parse(file.uploadedAt || file.lastModified) || 0;
}

async function recordFileMetadata(config: DriveConfig, path: string, fileMeta: DriveFileMetadata): Promise<void> {
  const prefix = directoryPrefixFromPath(path);
  const name = fileNameFromPath(path);
  const meta = await readDriveMeta(config, prefix);
  meta.files[name] = fileMeta;
  await writeDriveMeta(config, prefix, meta);
}

async function readDriveMeta(config: DriveConfig, prefix: string): Promise<DriveDirectoryMetadata> {
  const text = await getObjectText(config, `${prefix}${DRIVE_META_FILENAME}`);
  if (!text) {
    return { version: 1, files: {} };
  }
  try {
    const parsed = JSON.parse(text) as Partial<DriveDirectoryMetadata>;
    return parsed.version === 1 && parsed.files && typeof parsed.files === "object"
      ? { version: 1, files: parsed.files as Record<string, DriveFileMetadata> }
      : { version: 1, files: {} };
  } catch {
    return { version: 1, files: {} };
  }
}

async function writeDriveMeta(config: DriveConfig, prefix: string, meta: DriveDirectoryMetadata): Promise<void> {
  await putObjectText(config, `${prefix}${DRIVE_META_FILENAME}`, JSON.stringify(meta, null, 2), "application/json; charset=utf-8");
}

function fileMetadata(
  displayName: string,
  text: string,
  contentType: string,
  kind: DriveFileMetadata["kind"],
  uploadedAt: string,
): DriveFileMetadata {
  return {
    uploadedBy: displayName,
    uploadedAt,
    contentType,
    size: byteLength(text),
    kind,
  };
}

function normalizeAnalysisKeywords(input: unknown, required = false): string {
  if (typeof input !== "string") {
    throw new Error("分析关键词无效");
  }
  if (input.length > 3000) {
    throw new Error("分析关键词过长");
  }
  const value = input.trim();
  if (required) {
    requireAnalysisKeywords(value);
  }
  return value;
}

function requireAnalysisKeywords(value: string): void {
  if (!value.trim()) {
    throw new Error("请填写分析关键词");
  }
}

function normalizeContentType(input: unknown): string {
  if (typeof input !== "string" || !input.trim()) {
    return "application/octet-stream";
  }
  const value = input.trim();
  if (value.length > 160 || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error("contentType 无效");
  }
  return value;
}

function normalizeSize(input: unknown): number {
  const size = typeof input === "number" ? input : Number(input ?? 0);
  return Number.isFinite(size) && size >= 0 ? Math.round(size) : 0;
}

function normalizeUploadKind(input: unknown, path: string): DriveFileMetadata["kind"] {
  if (input === "output" || path.includes(`/${OUTPUTS_FOLDER_NAME}/`)) {
    return "output";
  }
  if (input === "prompt") {
    return "prompt";
  }
  return "material";
}

function directoryPrefixFromPath(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index + 1);
}

function fileNameFromPath(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? path : path.slice(index + 1);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function compactTimestamp(value: Date): string {
  return value.toISOString().replace(/[-:.]/g, "").replace("T", "-").replace("Z", "Z");
}

function createNonce(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
