import MiniSearch from "minisearch";
import { assertWebhook, fileMetaKey, getJson, head, listAll, putJson, ROOT_PREFIX, sourceKey } from "../shared/common.mjs";
import { knowledgeRoleForPath } from "../../drive/shared/methodology.ts";

export async function main(event, context) {
  assertWebhook(event);
  const topicId = extractTopicId(event, context);
  if (!/^t_[A-Za-z0-9_-]{12,32}$/.test(topicId || "")) throw new Error("topicId 无效");
  const topicKey = `${ROOT_PREFIX}topics/${topicId}/topic.json`;
  const topic = await getJson(topicKey);
  if (!topic) return { ok: false, reason: "topic missing" };
  const overrideKey = `${ROOT_PREFIX}topics/${topicId}/latest-evidence-override.json`;
  const latestEvidenceOverride = await getJson(overrideKey);
  const indexVersion = Number(topic.indexVersion || 0);
  const chunkKeys = (await listAll(`${ROOT_PREFIX}topics/${topicId}/processed/`)).filter((key) => key.endsWith("/chunks.json"));
  const validSets = [];
  for (const key of chunkKeys) {
    const set = await getJson(key);
    if (!set?.path || !set?.sourceEtag || !["methodology", "evidence"].includes(set.knowledgeRole) || !Array.isArray(set.chunks)) continue;
    const [current, metadata] = await Promise.all([
      head(sourceKey(topicId, set.knowledgeRole, set.path)),
      getJson(fileMetaKey(topicId, set.knowledgeRole, set.path)),
    ]);
    const knowledgeRole = knowledgeRoleForPath(metadata?.knowledgeRole, set.path, topic.methodologyPath);
    if (current?.etag === set.sourceEtag && knowledgeRole === set.knowledgeRole) {
      validSets.push({ ...set, knowledgeRole, reportDate: metadata?.reportDate, uploadedAt: metadata?.uploadedAt });
    }
  }
  const latestEvidence = selectLatestEvidence(validSets, latestEvidenceOverride);
  const chunks = validSets.flatMap((set) => set.chunks.map((chunk) => ({
    ...chunk,
    topicName: topic.name,
    knowledgeRole: set.knowledgeRole,
    ...(set.reportDate ? { reportDate: set.reportDate } : {}),
    ...(set.path === latestEvidence?.path ? { isLatestEvidence: true } : {}),
  })));
  const search = new MiniSearch({
    fields: ["content", "fileName", "locator", "topicName"],
    storeFields: ["knowledgeRole", "reportDate", "isLatestEvidence", "topicId"],
    tokenize,
    processTerm: (term) => term,
    idField: "id",
  });
  search.addAll(chunks);
  const now = new Date().toISOString();
  const currentTopic = await getJson(topicKey);
  if (!currentTopic || currentTopic.indexVersion !== indexVersion || currentTopic.name !== topic.name) {
    return { ok: false, reason: "topic changed during build" };
  }
  if (!sameLatestEvidenceOverride(await getJson(overrideKey), latestEvidenceOverride)) {
    return { ok: false, reason: "latest evidence selection changed during build" };
  }
  if (!(await snapshotIsCurrent(topicId, validSets))) return { ok: false, reason: "source changed during build" };
  await putJson(`${ROOT_PREFIX}topics/${topicId}/index/search-index.json`, {
    version: 2,
    topicId,
    topicName: topic.name,
    indexVersion,
    ...(latestEvidenceOverride?.generation ? { latestEvidenceRevision: latestEvidenceOverride.generation } : {}),
    generatedAt: now,
    chunks,
    index: search.toJSON(),
  });
  if (!(await snapshotIsCurrent(topicId, validSets))) return { ok: false, reason: "source changed before publish" };
  const publishTopic = await getJson(topicKey);
  if (!publishTopic || publishTopic.indexVersion !== indexVersion || publishTopic.name !== topic.name) {
    return { ok: false, reason: "topic changed before publish" };
  }
  if (!sameLatestEvidenceOverride(await getJson(overrideKey), latestEvidenceOverride)) {
    return { ok: false, reason: "latest evidence selection changed before publish" };
  }
  await putJson(`${ROOT_PREFIX}topics/${topicId}/index/manifest.json`, {
    version: 1,
    topicId,
    generatedAt: now,
    indexVersion,
    ...(latestEvidenceOverride?.generation ? { latestEvidenceRevision: latestEvidenceOverride.generation } : {}),
    fileCount: validSets.length,
    chunkCount: chunks.length,
    ...(latestEvidence ? {
      latestEvidencePath: latestEvidence.path,
      latestEvidenceSource: latestEvidence.source,
    } : {}),
    sourceEtags: validSets.map((set) => ({ path: set.path, etag: set.sourceEtag })),
  });
  await Promise.all(validSets.map(async (set) => {
      const statusKey = `${ROOT_PREFIX}topics/${topicId}/processed/${set.knowledgeRole}/${set.path}.__file__/status.json`;
      const status = await getJson(statusKey);
      if (status?.sourceEtag === set.sourceEtag) await putJson(statusKey, { ...status, state: "ready", updatedAt: now });
  }));
  return { ok: true, fileCount: validSets.length, chunkCount: chunks.length };
}

export function selectLatestEvidence(sets, override) {
  const evidence = sets.filter((set) => set.knowledgeRole === "evidence");
  if (!evidence.length) return null;
  const manual = override?.version === 1
    ? evidence.find((set) =>
        set.path === override.path
        && set.sourceEtag === override.sourceEtag
        && !evidence.some((candidate) => String(candidate.uploadedAt || "") > String(override.selectedAt || ""))
      )
    : null;
  if (manual) return { path: manual.path, source: "manual" };
  const [latest] = [...evidence].sort((left, right) =>
    String(right.reportDate || "").localeCompare(String(left.reportDate || ""))
    || String(right.uploadedAt || "").localeCompare(String(left.uploadedAt || ""))
    || String(left.path).localeCompare(String(right.path))
  );
  return { path: latest.path, source: "auto" };
}

function sameLatestEvidenceOverride(left, right) {
  if (!left || !right) return left === right;
  return left.version === right.version
    && left.generation === right.generation
    && left.path === right.path
    && left.sourceEtag === right.sourceEtag
    && left.selectedAt === right.selectedAt;
}

async function snapshotIsCurrent(topicId, sets) {
  const checks = await Promise.all(sets.map(async (set) => (await head(sourceKey(topicId, set.knowledgeRole, set.path)))?.etag === set.sourceEtag));
  return checks.every(Boolean);
}

export function tokenize(input) {
  const normalized = String(input).normalize("NFKC").toLowerCase();
  const tokens = new Set(normalized.match(/[a-z0-9]+(?:[._/-][a-z0-9]+)*/g) || []);
  for (const run of normalized.match(/[\u3400-\u9fff]+/g) || []) {
    if (run.length === 1) tokens.add(run);
    for (const width of [2, 3, 4]) {
      for (let index = 0; index <= run.length - width; index += 1) tokens.add(run.slice(index, index + width));
    }
  }
  if (typeof Intl.Segmenter === "function") {
    for (const part of new Intl.Segmenter("zh-CN", { granularity: "word" }).segment(normalized)) {
      const word = part.segment.trim();
      if (word && (part.isWordLike || /[\u3400-\u9fff]/.test(word))) tokens.add(word);
    }
  }
  return [...tokens];
}

export function extractTopicId(event, context) {
  return readTopicId(event)
    || readTopicId(event?.body)
    || readTopicId(event?.ClientContext)
    || readTopicId(event?.clientContext)
    || readTopicId(context?.client_context)
    || readTopicId(context?.clientContext);
}

function readTopicId(value) {
  if (!value) return undefined;
  if (Buffer.isBuffer(value)) return readTopicId(value.toString("utf8"));
  if (typeof value === "string") {
    try { return readTopicId(JSON.parse(value)); } catch { return undefined; }
  }
  return typeof value === "object" && typeof value.topicId === "string" ? value.topicId : undefined;
}

export const handler = main;
