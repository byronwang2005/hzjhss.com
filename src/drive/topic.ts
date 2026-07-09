import type { DriveConfig } from "./config";
import { type DriveFile, type DriveListResult, createFolder, getObjectText, listObjects, presignObjectUrl, putObjectText } from "./cos";
import { normalizeFolderName, normalizeObjectPath, normalizePrefix } from "./paths";

export const DRIVE_META_FILENAME = "._drive-meta.json";
export const TOPIC_META_FILENAME = "._topic.json";
export const READ_PROMPT_FILENAME = "01-读取专题资料.prompt.md";
export const GENERATE_PROMPT_FILENAME = "02-方法论生成与回传.prompt.md";
export const OUTPUTS_FOLDER_NAME = "outputs";
export const AGENT_MANIFEST_FOLDER_NAME = "._agent-manifests";

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
  version: 1;
  name: string;
  prefix: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface TopicDetail {
  topic: TopicMetadata;
  readPrompt: string;
  generatePrompt: string;
  outputs: DriveFile[];
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
  topic: Pick<TopicMetadata, "name" | "prefix" | "description">;
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
  input: { name: unknown; description?: unknown; displayName: string; origin: string },
): Promise<TopicDetail> {
  const name = normalizeTopicName(input.name);
  const prefix = topicPrefixFromName(name);
  const description = normalizeDescription(input.description);
  const now = new Date().toISOString();
  const topic: TopicMetadata = {
    version: 1,
    name,
    prefix,
    description,
    createdBy: input.displayName,
    createdAt: now,
    updatedBy: input.displayName,
    updatedAt: now,
  };
  const prompts = createDefaultPrompts({ origin: input.origin, name, prefix, description });
  const existing = await getObjectText(config, `${prefix}${TOPIC_META_FILENAME}`);
  if (existing) {
    throw new Error("同名专题已存在");
  }

  await createFolder(config, prefix);
  await createFolder(config, `${prefix}${OUTPUTS_FOLDER_NAME}/`);
  await putObjectText(config, `${prefix}${TOPIC_META_FILENAME}`, JSON.stringify(topic, null, 2), "application/json; charset=utf-8");
  await putObjectText(config, `${prefix}${READ_PROMPT_FILENAME}`, prompts.readPrompt, "text/markdown; charset=utf-8");
  await putObjectText(config, `${prefix}${GENERATE_PROMPT_FILENAME}`, prompts.generatePrompt, "text/markdown; charset=utf-8");
  await writeDriveMeta(config, prefix, {
    version: 1,
    files: {
      [READ_PROMPT_FILENAME]: fileMetadata(input.displayName, prompts.readPrompt, "text/markdown; charset=utf-8", "prompt", now),
      [GENERATE_PROMPT_FILENAME]: fileMetadata(input.displayName, prompts.generatePrompt, "text/markdown; charset=utf-8", "prompt", now),
      [TOPIC_META_FILENAME]: fileMetadata(input.displayName, JSON.stringify(topic), "application/json; charset=utf-8", "topic", now),
    },
  });
  await writeDriveMeta(config, `${prefix}${OUTPUTS_FOLDER_NAME}/`, { version: 1, files: {} });

  return {
    topic,
    readPrompt: prompts.readPrompt,
    generatePrompt: prompts.generatePrompt,
    outputs: [],
  };
}

export async function readTopic(config: DriveConfig, rawPrefix: unknown): Promise<TopicDetail> {
  const prefix = normalizeTopicPrefix(rawPrefix);
  const topic = await readTopicMetadata(config, prefix);
  const readPrompt = (await getObjectText(config, `${prefix}${READ_PROMPT_FILENAME}`)) ?? "";
  const generatePrompt = (await getObjectText(config, `${prefix}${GENERATE_PROMPT_FILENAME}`)) ?? "";
  const outputs = await listDirectoryWithMetadata(config, `${prefix}${OUTPUTS_FOLDER_NAME}/`);
  return { topic, readPrompt, generatePrompt, outputs: outputs.files };
}

export async function updateTopic(
  config: DriveConfig,
  input: {
    prefix: unknown;
    description?: unknown;
    readPrompt?: unknown;
    generatePrompt?: unknown;
    displayName: string;
  },
): Promise<TopicDetail> {
  const prefix = normalizeTopicPrefix(input.prefix);
  const topic = await readTopicMetadata(config, prefix);
  const description = input.description == null ? topic.description : normalizeDescription(input.description);
  const readPrompt = input.readPrompt == null ? ((await getObjectText(config, `${prefix}${READ_PROMPT_FILENAME}`)) ?? "") : normalizePrompt(input.readPrompt);
  const generatePrompt =
    input.generatePrompt == null
      ? ((await getObjectText(config, `${prefix}${GENERATE_PROMPT_FILENAME}`)) ?? "")
      : normalizePrompt(input.generatePrompt);
  const now = new Date().toISOString();
  const updatedTopic: TopicMetadata = {
    ...topic,
    description,
    updatedBy: input.displayName,
    updatedAt: now,
  };

  await putObjectText(config, `${prefix}${TOPIC_META_FILENAME}`, JSON.stringify(updatedTopic, null, 2), "application/json; charset=utf-8");
  await putObjectText(config, `${prefix}${READ_PROMPT_FILENAME}`, readPrompt, "text/markdown; charset=utf-8");
  await putObjectText(config, `${prefix}${GENERATE_PROMPT_FILENAME}`, generatePrompt, "text/markdown; charset=utf-8");
  await recordFileMetadata(config, `${prefix}${READ_PROMPT_FILENAME}`, {
    uploadedBy: input.displayName,
    uploadedAt: now,
    contentType: "text/markdown; charset=utf-8",
    size: byteLength(readPrompt),
    kind: "prompt",
  });
  await recordFileMetadata(config, `${prefix}${GENERATE_PROMPT_FILENAME}`, {
    uploadedBy: input.displayName,
    uploadedAt: now,
    contentType: "text/markdown; charset=utf-8",
    size: byteLength(generatePrompt),
    kind: "prompt",
  });

  const outputs = await listDirectoryWithMetadata(config, `${prefix}${OUTPUTS_FOLDER_NAME}/`);
  return { topic: updatedTopic, readPrompt, generatePrompt, outputs: outputs.files };
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
  input: { prefix: unknown },
): Promise<AgentManifestResult> {
  const prefix = normalizeTopicPrefix(input.prefix);
  const topic = await readTopicMetadata(config, prefix);
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
      description: topic.description,
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
  topic: Pick<TopicMetadata, "name" | "prefix" | "description">;
  generatedAt: string;
  expiresAt: string;
  expiresIn: number;
  fileCount: number;
  manifestUrl: string;
}): string {
  return `# ${input.topic.name}：Agent 资料分析任务

你是本地 AI agent。你不需要登录网盘，也不需要携带 cookie。

请先下载这一个 manifest JSON：
${input.manifestUrl}

链接信息：
- 专题路径：${input.topic.prefix}
- 专题说明：${input.topic.description || "暂无专题说明。"}
- 生成时间：${input.generatedAt}
- 过期时间：${input.expiresAt}
- 有效期：${input.expiresIn} 秒
- 资料数量：${input.fileCount}

读取方法：
1. 下载 manifest JSON。
2. 遍历 manifest.files，使用每个文件的 signedUrl 下载资料。
3. 分析 PDF、HTML、Markdown、Word、Excel、PPT、图片等资料；无法解析时记录原因和文件 path。
4. 输出资料索引和结构化分析，至少包含：来源 path、资料类型、作者或机构、发布日期、核心观点、关键数据、待核验问题。
5. 每个重要判断必须标注来源 path。链接过期后停止读取，并提示用户重新生成 agent 分析提示词。
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

export function isAgentReadableFolder(topicPrefix: string, folderPath: string): boolean {
  return folderPath !== `${topicPrefix}${OUTPUTS_FOLDER_NAME}/` && !hasSystemPathSegment(folderPath);
}

export function isAgentReadableFile(topicPrefix: string, file: Pick<DriveFile, "path" | "name">): boolean {
  return (
    !file.path.startsWith(`${topicPrefix}${OUTPUTS_FOLDER_NAME}/`) &&
    !hasSystemPathSegment(file.path) &&
    file.name !== READ_PROMPT_FILENAME &&
    file.name !== GENERATE_PROMPT_FILENAME
  );
}

export function createDefaultPrompts(input: {
  origin: string;
  name: string;
  prefix: string;
  description: string;
}): { readPrompt: string; generatePrompt: string } {
  const description = input.description || "暂无专题说明。";
  const readPrompt = `# ${input.name}：读取专题资料

你是本地 AI agent。请读取云盘专题 \`${input.prefix}\` 下除系统隐藏文件和 \`outputs/\` 外的研报、周报和补充资料。

专题说明：
${description}

从网盘读取资料的方法：
1. 在专题资料库页面点击“获取 agent 分析提示词”。
2. 页面会生成一份只包含一个 manifest 下载链接的短时提示词。
3. 将该提示词交给本地 AI agent；agent 不需要登录，不需要 cookie。
4. agent 先下载 manifest JSON，再按 manifest.files 中的 signedUrl 下载资料。
5. manifest 和其中的资料链接会过期，过期后回到页面重新生成。
6. 解析资料：按文件类型解析 PDF、HTML、Markdown、Word、Excel、PPT、图片等资料；无法解析时记录原因和文件名。

工作规则：
1. 保留来源路径、文件名、作者或机构、发布日期、核心观点和关键数据。
2. 不要改写原始资料，不要删除文件，不要把临时过程文件回传到专题。
3. 输出给下一步 agent 的材料索引，至少包含：文件路径、资料类型、主题标签、核心结论、可引用数据、待核验问题。
`;

  const generatePrompt = `# ${input.name}：方法论生成与成果回传

你是本地 AI agent。请基于专题 \`${input.prefix}\` 的资料，按固定方法论生成结构化文本，并回传 HTML/PDF/Markdown 到 \`${input.prefix}${OUTPUTS_FOLDER_NAME}/\`。

专题说明：
${description}

推荐方法论：
1. 资料分层：区分事实、观点、预测、数据、风险提示。
2. 证据归纳：每个重要判断必须标注来源文件名；冲突观点并列呈现。
3. 结构化输出：先给摘要，再给方法论框架、关键发现、数据表、风险与待办。
4. 固定产物：生成 Markdown 原稿、可直接预览的 HTML，以及需要归档时的 PDF。
5. 命名规则：\`outputs/YYYY-MM-DD-${input.name}-专题总结.md\`、\`outputs/YYYY-MM-DD-${input.name}-专题总结.html\`、\`outputs/YYYY-MM-DD-${input.name}-专题总结.pdf\`。

回传流程：
1. 调用 \`${input.origin}/api/drive/upload-url\`，body 包含 \`prefix: "${input.prefix}${OUTPUTS_FOLDER_NAME}/"\`、\`filename\`、\`size\`、\`contentType\`。
2. 用返回的短时 PUT URL 上传文件。
3. 上传成功后调用 \`${input.origin}/api/drive/upload-complete\`，body 包含 \`path\`、\`size\`、\`contentType\`、\`kind: "output"\`。
4. 回传完成后，确认专题成果区能预览 HTML/PDF/Markdown。
`;

  return { readPrompt, generatePrompt };
}

async function readTopicMetadata(config: DriveConfig, prefix: string): Promise<TopicMetadata> {
  const text = await getObjectText(config, `${prefix}${TOPIC_META_FILENAME}`);
  if (!text) {
    throw new Error("专题元数据不存在");
  }
  const parsed = JSON.parse(text) as Partial<TopicMetadata>;
  if (parsed.version !== 1 || typeof parsed.name !== "string" || typeof parsed.prefix !== "string") {
    throw new Error("专题元数据无效");
  }
  return {
    version: 1,
    name: parsed.name,
    prefix,
    description: typeof parsed.description === "string" ? parsed.description : "",
    createdBy: typeof parsed.createdBy === "string" ? parsed.createdBy : "-",
    createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : "",
    updatedBy: typeof parsed.updatedBy === "string" ? parsed.updatedBy : "-",
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
  };
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

function normalizeDescription(input: unknown): string {
  if (input == null) {
    return "";
  }
  if (typeof input !== "string") {
    throw new Error("专题说明无效");
  }
  if (input.length > 3000) {
    throw new Error("专题说明过长");
  }
  return input.trim();
}

function normalizePrompt(input: unknown): string {
  if (typeof input !== "string") {
    throw new Error("提示词内容无效");
  }
  if (input.length > 120000) {
    throw new Error("提示词内容过长");
  }
  return input;
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
