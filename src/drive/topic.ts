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
import { isDriveAdmin, normalizeDisplayName } from "./session";
import { listDriveUserCandidates } from "./users";

export const DRIVE_META_FILENAME = "._drive-meta.json";
export const TOPIC_META_FILENAME = "._topic.json";
export const GENERATE_PROMPT_FILENAME = "成果生成与回传.prompt.md";
export const OUTPUTS_FOLDER_NAME = "outputs";
export const AGENT_MANIFEST_FOLDER_NAME = "._agent-manifests";
export const AGENT_OUTPUT_FORMAT = { extension: ".pdf", contentType: "application/pdf" } as const;
const MAX_AGENT_OUTPUT_FILENAME_LENGTH = 180;
const AGENT_OUTPUT_TIMESTAMP_PATTERN = /^\d{8}-\d{9}$/;
const SHANGHAI_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

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
  version: 4;
  instanceId: string;
  name: string;
  prefix: string;
  analysisKeywords: string;
  owner: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  featuredOutputPath: string | null;
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
  uploadedBy?: string;
}

export interface DriveOverviewTopic {
  prefix: string;
  name: string;
  analysisKeywords: string;
  owner: string;
  createdBy: string;
  updatedAt: string;
  outputCount: number;
  featuredOutput?: DriveOverviewOutput;
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
    version: 4,
    instanceId: createNonce(),
    name,
    prefix,
    analysisKeywords,
    owner: input.displayName,
    createdBy: input.displayName,
    createdAt: now,
    updatedBy: input.displayName,
    updatedAt: now,
    featuredOutputPath: null,
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
  if (topic.owner !== input.displayName && !isDriveAdmin(input.displayName)) {
    const error = new Error("只有专题负责人或管理员可以修改分析口径");
    error.name = "DriveForbiddenError";
    throw error;
  }
  const rawKeywords = input.analysisKeywords ?? input.description;
  const analysisKeywords = rawKeywords == null ? topic.analysisKeywords : normalizeAnalysisKeywords(rawKeywords, true);
  const now = new Date().toISOString();
  const updatedTopic: TopicMetadata = {
    ...topic,
    version: 4,
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

export async function updateFeaturedOutput(
  config: DriveConfig,
  input: { prefix: unknown; path: unknown; displayName: string; origin: string },
): Promise<TopicDetail> {
  const prefix = normalizeTopicPrefix(input.prefix);
  const { topic } = await ensureTopicScaffold(config, prefix, { displayName: input.displayName, origin: input.origin });
  if (topic.owner !== input.displayName && !isDriveAdmin(input.displayName)) {
    const error = new Error("只有专题负责人或管理员可以设置精选成果");
    error.name = "DriveForbiddenError";
    throw error;
  }
  const path = normalizeObjectPath(input.path);
  const outputs = await listOutputsForTopicInstance(config, topic);
  const selected = outputs.find((file) => file.path === path);
  if (!selected || !path.startsWith(`${prefix}${OUTPUTS_FOLDER_NAME}/`)) {
    throw new Error("精选成果不属于当前专题");
  }
  if (!isPreviewableOutput(selected)) {
    throw new Error("该成果格式不支持首页预览");
  }
  const updatedTopic = { ...topic, version: 4 as const, featuredOutputPath: path, updatedBy: input.displayName, updatedAt: new Date().toISOString() };
  await writeTopicMetadata(config, updatedTopic, input.displayName);
  return { topic: updatedTopic, outputs };
}

export async function transferTopicOwner(
  config: DriveConfig,
  input: { prefix: unknown; owner: unknown; confirmName: unknown; displayName: string; origin: string },
): Promise<TopicDetail> {
  const prefix = normalizeTopicPrefix(input.prefix);
  const { topic } = await ensureTopicScaffold(config, prefix, { displayName: input.displayName, origin: input.origin });
  if (topic.owner !== input.displayName && !isDriveAdmin(input.displayName)) {
    const error = new Error("只有专题负责人或管理员可以转交负责人");
    error.name = "DriveForbiddenError";
    throw error;
  }
  if (typeof input.confirmName !== "string" || input.confirmName.trim() !== topic.name) {
    throw new Error("专题名称确认不一致");
  }
  const owner = normalizeDisplayName(input.owner);
  const candidates = await listDriveUserCandidates(config);
  if (!candidates.includes(owner)) {
    throw new Error("新负责人不在候选名单中");
  }
  const updatedTopic: TopicMetadata = {
    ...topic,
    version: 4,
    owner,
    updatedBy: input.displayName,
    updatedAt: new Date().toISOString(),
  };
  await writeTopicMetadata(config, updatedTopic, input.displayName);
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
  if (!isDriveAdmin(input.displayName)) {
    const error = new Error("只有管理员汪旭可以删除专题");
    error.name = "DriveForbiddenError";
    throw error;
  }
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
  const root = await listAllDirectoryWithMetadata(config, "");
  const topics = await Promise.all(
    root.folders.map(async (folder): Promise<(DriveOverviewTopic & { sortTimestamp: number }) | null> => {
      try {
        const topic = await readTopicMetadataIfExists(config, folder.path);
        if (!topic) {
          return null;
        }
        const { topic: normalizedTopic, outputs } = await ensureFeaturedOutput(config, topic, options.displayName);
        const featured = outputs.find((file) => file.path === normalizedTopic.featuredOutputPath);
        return {
          prefix: topic.prefix,
          name: topic.name,
          analysisKeywords: topic.analysisKeywords,
          owner: topic.owner,
          createdBy: topic.createdBy,
          updatedAt: topic.updatedAt,
          outputCount: outputs.length,
          sortTimestamp: Math.max(timestampForFile(outputs[0] || { lastModified: "" }), Date.parse(topic.updatedAt) || 0),
          featuredOutput: featured
            ? {
                name: featured.name,
                path: featured.path,
                uploadedAt: featured.uploadedAt,
                lastModified: featured.lastModified,
                contentType: featured.contentType,
                size: featured.size,
                uploadedBy: featured.uploadedBy,
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
      .filter((topic): topic is DriveOverviewTopic & { sortTimestamp: number } => Boolean(topic))
      .sort((a, b) => b.sortTimestamp - a.sortTimestamp || a.name.localeCompare(b.name, "zh-Hans-CN"))
      .map(({ sortTimestamp: _sortTimestamp, ...topic }) => topic),
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
  if (meta.kind === "output") {
    const topicPrefix = path.split(`${OUTPUTS_FOLDER_NAME}/`, 1)[0];
    const topic = await readTopicMetadataIfExists(config, topicPrefix);
    if (topic && !topic.featuredOutputPath && isPreviewableOutput({ path, name: fileNameFromPath(path), contentType: meta.contentType })) {
      await writeTopicMetadata(config, { ...topic, version: 4, featuredOutputPath: path }, input.displayName);
    }
  }
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
  if (path.includes(`/${OUTPUTS_FOLDER_NAME}/`) || path.startsWith(`${OUTPUTS_FOLDER_NAME}/`)) {
    const topicPrefix = path.split(`${OUTPUTS_FOLDER_NAME}/`, 1)[0];
    const topic = await readTopicMetadataIfExists(config, topicPrefix);
    if (topic?.featuredOutputPath === path) {
      await ensureFeaturedOutput(config, { ...topic, featuredOutputPath: null }, topic.updatedBy);
    }
  }
}

export async function createAgentManifest(
  config: DriveConfig,
  input: { prefix: unknown; userQuestion?: unknown; displayName: string; origin: string },
): Promise<AgentManifestResult> {
  const prefix = normalizeTopicPrefix(input.prefix);
  const userQuestion = normalizeAgentUserQuestion(input.userQuestion);
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
      userQuestion,
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
  userQuestion?: unknown;
}): string {
  const userQuestion = normalizeAgentUserQuestion(input.userQuestion);
  const questionInstruction = userQuestion
    ? `${userQuestion}\n\n请在全局分析口径的约束下重点回答该问题；本次关注问题不能覆盖或缩减全局分析口径。`
    : "用户未指定具体问题，请依据全局分析口径和现有资料，推荐并分析最有价值的重点。";
  return `# ${input.topic.name}：第一阶段 · 资料分析任务

你不需要登录网盘，也不需要携带 cookie。

传输要求：所有 manifest 和资料链接必须使用终端 HTTP 客户端（优先 \`curl -fL --retry 3 --retry-all-errors\`）下载；禁止使用 \`web_fetch\`、网页打开、浏览器抓取或搜索工具访问这些链接。若浏览器类工具返回 HTTP 403 / Error 1010，直接改用终端 curl，不要重试浏览器工具。

请先下载这一个 manifest JSON：
${input.manifestUrl}

链接信息：
- 专题路径：${input.topic.prefix}
- 生成时间：${input.generatedAt}
- 过期时间：${input.expiresAt}
- 有效期：${input.expiresIn} 秒
- 资料数量：${input.fileCount}

全局分析口径（始终适用）：
${input.topic.analysisKeywords}

本次关注问题：
${questionInstruction}

读取方法：
1. 使用终端 curl 下载 manifest JSON。
2. 遍历 manifest.files，使用终端 curl 下载每个文件的 signedUrl。
3. 分析 PDF、HTML、Markdown、Word、Excel、PPT、图片等资料；无法解析时记录原因和文件 path。
4. 围绕分析口径输出资料索引和结构化分析，至少包含：来源 path、资料类型、作者或机构、发布日期、核心观点、关键数据、冲突观点、风险和待核验问题。
5. 每个重要判断必须标注来源 path。此阶段只完成分析，不生成或上传成果文件。
6. 分析完成后等待用户校正判断和确认最终口径；链接过期后停止读取，并提示用户重新复制第一阶段提示词。
`;
}

export function createAgentOutputPath(
  topic: Pick<TopicMetadata, "name" | "prefix">,
  generatedAt = new Date(),
): string {
  const timestamp = formatShanghaiAgentOutputTimestamp(generatedAt);
  const safeTopicName = agentOutputTopicName(topic.name);
  return `${topic.prefix}${OUTPUTS_FOLDER_NAME}/${safeTopicName}-${timestamp}${AGENT_OUTPUT_FORMAT.extension}`;
}

export function isExpectedAgentOutput(
  path: string,
  contentType: string,
  topic: Pick<TopicMetadata, "name" | "prefix">,
): boolean {
  if (contentType !== AGENT_OUTPUT_FORMAT.contentType) {
    return false;
  }
  const outputsPrefix = `${topic.prefix}${OUTPUTS_FOLDER_NAME}/`;
  if (!path.startsWith(outputsPrefix)) {
    return false;
  }
  const fileName = path.slice(outputsPrefix.length);
  const namePrefix = `${agentOutputTopicName(topic.name)}-`;
  if (!fileName.startsWith(namePrefix) || !fileName.endsWith(AGENT_OUTPUT_FORMAT.extension)) {
    return false;
  }
  const timestamp = fileName.slice(namePrefix.length, -AGENT_OUTPUT_FORMAT.extension.length);
  return AGENT_OUTPUT_TIMESTAMP_PATTERN.test(timestamp);
}

function formatShanghaiAgentOutputTimestamp(date: Date): string {
  if (!Number.isFinite(date.getTime())) {
    throw new Error("成果生成时间无效");
  }
  const parts = Object.fromEntries(
    SHANGHAI_DATE_TIME_FORMATTER.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}${milliseconds}`;
}

function agentOutputTopicName(topicName: string): string {
  const reservedLength = 1 + 8 + 1 + 9 + AGENT_OUTPUT_FORMAT.extension.length;
  return topicName.slice(0, MAX_AGENT_OUTPUT_FILENAME_LENGTH - reservedLength);
}

export function createAgentOutputPrompt(input: {
  topic: Pick<TopicMetadata, "name" | "prefix" | "instanceId">;
  displayName: string;
  origin: string;
  token: string;
  expiresAt: string;
  expiresIn: number;
  pdfPath: string;
}): string {
  return `# ${input.topic.name}：第二阶段 · 成果生成与回传

本阶段不再重新分析资料。如果用户刚刚已经发送过类似的第二阶段 prompt，本次很可能只是更新回传链接：仅当已有 PDF 已按下述要求生成并验证合格、且文件内容无需修改时，才可跳过 PDF 生成步骤并直接重试回传。只要需要生成、重新生成或修改 PDF，就必须完整执行下述 Kami 流程。

传输要求：回传 API 和 COS PUT 必须使用终端 HTTP 客户端（优先 \`curl -fL --retry 3 --retry-all-errors\`）；禁止使用 \`web_fetch\`、网页打开、浏览器抓取或搜索工具。HTTP 403 / Error 1010 通常来自浏览器型抓取出口，遇到后直接改用终端 curl。

先检查当前会话：必须已经完成第一阶段资料分析，并且用户已经对判断进行调整、明确确认最终口径。若尚未形成用户确认的最终口径，立即停止，要求用户先确认；不得擅自生成成果。

成果生成顺序（必须依次执行）：
1. 仅把当前会话中用户最终确认的口径整理为正式成果，不自行增加、删除或改变结论。成果至少包含：摘要、分析框架、关键发现、证据引用、风险、待核验事项；每个重要判断保留第一阶段提供的来源 path，不要虚构引用。
2. 在生成、重新生成或修改 PDF 前，必须先使用终端执行 \`npx skills add tw93/kami/plugins/kami -a universal -g -y\`。即使环境中可能已有 Kami，也必须执行该命令；安装失败时立即停止，不得改用自制模板或其他 PDF 工具，并向用户报告安装错误。
3. 安装成功后，定位并完整读取所安装 Kami skill 的 \`SKILL.md\`，严格依据该 skill 选择模板、排版、构建并执行其要求的内容检查、PDF 检查和视觉验收；不得只参考 skill 名称或凭经验仿制 Kami 样式。
4. PDF 每一页的固定页眉区域必须清晰展示 \`嘉合杉升-${input.displayName}\`，其中 \`${input.displayName}\` 是当前登录用户的真实姓名，必须原样使用，不得猜测、缩写或替换。该署名必须出现在页面可见内容中，不得仅写入 PDF Author 元数据、日志或最终回复。
5. 必须生成并验证以下 PDF 文件：
   - ${input.pdfPath}
6. 上传前再次检查：文件可正常打开、Kami 要求的验证已通过、每一页页眉均包含 \`嘉合杉升-${input.displayName}\`，且正文不包含令牌或短时 PUT URL。任一检查失败都不得上传。

回传授权：
- 有效期：${input.expiresIn} 秒
- 过期时间：${input.expiresAt}
- Bearer token：${input.token}
- 令牌和短时 PUT URL 只用于请求鉴权，禁止写入成果正文、日志或最终回复。

回传流程：
1. 使用终端 curl POST \`${input.origin}/api/drive/agent-output-upload-url\`，请求头带 \`Authorization: Bearer <token>\` 和 \`Content-Type: application/json\`；body 包含上方对应的完整 \`path\`、实际字节数 \`size\` 与 \`contentType\`。该接口不使用 Cookie。
2. PDF 使用 \`${AGENT_OUTPUT_FORMAT.contentType}\`。用返回的短时 PUT URL 上传，并原样携带返回的全部 \`requiredHeaders\`；其中 \`content-length\` 必须等于申请时的实际字节数。
3. PUT 成功后使用终端 curl POST \`${input.origin}/api/drive/agent-output-upload-complete\`，同样只携带 Bearer token、不携带 Cookie；body 包含返回的 \`path\`、实际 \`size\` 与 \`contentType\`。
4. 文件成功登记后，报告 PDF path。授权过期、专题已删除或任一步失败时停止并报告具体错误，提示用户重新复制第二阶段提示词。
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
      version: 4,
      instanceId: createNonce(),
      name,
      prefix,
      analysisKeywords: "",
      owner: options.displayName,
      createdBy: options.displayName,
      createdAt: now,
      updatedBy: options.displayName,
      updatedAt: now,
      featuredOutputPath: null,
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

  const normalized = await ensureFeaturedOutput(config, topic, options.displayName);
  return { topic: normalized.topic };
}

async function readTopicMetadataIfExists(config: DriveConfig, prefix: string): Promise<TopicMetadata | null> {
  const text = await getObjectText(config, `${prefix}${TOPIC_META_FILENAME}`);
  if (!text) {
    return null;
  }
  const parsed = JSON.parse(text) as Omit<Partial<TopicMetadata>, "version"> & { version?: number; description?: unknown };
  if (![1, 2, 3, 4].includes(parsed.version || 0) || typeof parsed.name !== "string" || typeof parsed.prefix !== "string") {
    throw new Error("专题元数据无效");
  }
  const topic: TopicMetadata = {
    version: 4,
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
    owner: typeof parsed.owner === "string" && parsed.owner.trim() ? parsed.owner : typeof parsed.createdBy === "string" ? parsed.createdBy : "-",
    createdBy: typeof parsed.createdBy === "string" ? parsed.createdBy : "-",
    createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : "",
    updatedBy: typeof parsed.updatedBy === "string" ? parsed.updatedBy : "-",
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    featuredOutputPath: typeof parsed.featuredOutputPath === "string" ? parsed.featuredOutputPath : null,
  };
  if (parsed.version !== 4 || typeof parsed.owner !== "string" || !parsed.owner.trim()) {
    await writeTopicMetadata(config, topic, topic.updatedBy);
  }
  return topic;
}

function topicNameFromPrefix(prefix: string): string {
  return prefix.replace(/\/$/, "");
}

function isOutputForTopicInstance(fileName: string, instanceId: string): boolean {
  const match = /^agent-([a-z0-9]+)-/.exec(fileName);
  return !match || match[1] === instanceId;
}

async function listOutputsForTopicInstance(config: DriveConfig, topic: Pick<TopicMetadata, "prefix" | "instanceId">): Promise<DriveFile[]> {
  const outputList = await listAllDirectoryWithMetadata(config, `${topic.prefix}${OUTPUTS_FOLDER_NAME}/`);
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

export function isPreviewableOutput(file: Pick<DriveFile, "name" | "contentType" | "path">): boolean {
  const name = file.name.toLowerCase();
  const contentType = (file.contentType || "").toLowerCase();
  return /\.(pdf|html?|md|markdown|txt)$/i.test(name) || contentType === "application/pdf" || contentType.startsWith("text/");
}

async function ensureFeaturedOutput(config: DriveConfig, topic: TopicMetadata, actor: string): Promise<{ topic: TopicMetadata; outputs: DriveFile[] }> {
  const outputs = (await listOutputsForTopicInstance(config, topic)).sort((a, b) => timestampForFile(b) - timestampForFile(a));
  const eligible = outputs.filter(isPreviewableOutput);
  const featuredOutputPath = eligible.some((file) => file.path === topic.featuredOutputPath) ? topic.featuredOutputPath : eligible[0]?.path || null;
  if (topic.version !== 4 || featuredOutputPath !== topic.featuredOutputPath) {
    topic = { ...topic, version: 4, featuredOutputPath };
    await writeTopicMetadata(config, topic, actor);
  }
  return { topic, outputs };
}

async function writeTopicMetadata(config: DriveConfig, topic: TopicMetadata, actor: string): Promise<void> {
  const text = JSON.stringify(topic, null, 2);
  await putObjectText(config, `${topic.prefix}${TOPIC_META_FILENAME}`, text, "application/json; charset=utf-8");
  await recordFileMetadata(config, `${topic.prefix}${TOPIC_META_FILENAME}`, fileMetadata(actor, text, "application/json; charset=utf-8", "topic", new Date().toISOString()));
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
    throw new Error("分析口径无效");
  }
  if (input.length > 3000) {
    throw new Error("分析口径过长");
  }
  const value = input.trim();
  if (required) {
    requireAnalysisKeywords(value);
  }
  return value;
}

function normalizeAgentUserQuestion(input: unknown): string {
  if (input === undefined) {
    return "";
  }
  if (typeof input !== "string") {
    throw new Error("本次关注问题无效");
  }
  if (input.length > 3000) {
    throw new Error("本次关注问题过长");
  }
  return input.trim();
}

function requireAnalysisKeywords(value: string): void {
  if (!value.trim()) {
    throw new Error("请填写分析口径");
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
