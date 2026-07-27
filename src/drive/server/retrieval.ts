import type { DriveConfig } from "./config";
import { headObject } from "./cos";
import { listKnowledgeTopics, normalizeTopicId, readKnowledgeTopic, readLatestEvidenceOverrideRevision, readTopicSearchIndex } from "./knowledge";
import { searchSerializedIndex, type RetrievedChunk, type SerializedSearchIndex } from "./search";

const indexCache = new Map<string, { etag: string; envelope: SerializedSearchIndex }>();

export interface RetrievedKnowledge {
  evidence: RetrievedChunk[];
  methodology: RetrievedChunk[];
}

export interface RetrievedKnowledgeResult extends RetrievedKnowledge {
  stats: {
    topicCount: number;
    candidateCount: number;
    evidenceCount: number;
    methodologyCount: number;
    evidenceSourceCount: number;
    methodologySourceCount: number;
  };
}

export class KnowledgeScopeError extends Error {
  constructor(readonly kind: "invalid" | "unavailable", message: string) {
    super(message);
    this.name = "KnowledgeScopeError";
  }
}

export async function retrieveKnowledge(config: DriveConfig, input: { scope: "global" | "topic"; topicId?: unknown; query: string; now?: Date }): Promise<RetrievedKnowledgeResult> {
  const topics = input.scope === "topic"
    ? [await readScopedTopic(config, input.topicId)]
    : (await listKnowledgeTopics(config)).filter((topic) => topic.ready);
  const resultSets = await Promise.all(topics.map(async (topic) => {
    const envelope = await loadIndex(config, topic.id, topic.indexVersion);
    return {
      topicId: topic.id,
      evidence: envelope ? searchSerializedIndex(envelope, input.query, { role: "evidence", now: input.now }) : [],
      methodology: envelope ? searchSerializedIndex(envelope, input.query, { role: "methodology", now: input.now }) : [],
    };
  }));
  const evidence = resultSets.flatMap((set) => set.evidence).sort((a, b) => b.score - a.score);
  let methodology: RetrievedChunk[];
  if (input.scope === "topic") {
    methodology = resultSets.flatMap((set) => set.methodology).sort((a, b) => b.score - a.score);
  } else {
    const evidenceTopicIds = new Set(evidence.map((chunk) => chunk.topicId));
    methodology = resultSets
      .filter((set) => evidence.length ? evidenceTopicIds.has(set.topicId) : isMethodologyQuery(input.query))
      .flatMap((set) => set.methodology)
      .sort((a, b) => b.score - a.score);
  }
  return {
    evidence,
    methodology,
    stats: {
      topicCount: topics.length,
      candidateCount: evidence.length + methodology.length,
      evidenceCount: evidence.length,
      methodologyCount: methodology.length,
      evidenceSourceCount: new Set(evidence.map((chunk) => `${chunk.topicId}:${chunk.path}`)).size,
      methodologySourceCount: new Set(methodology.map((chunk) => `${chunk.topicId}:${chunk.path}`)).size,
    },
  };
}

async function readScopedTopic(config: DriveConfig, topicId: unknown) {
  try {
    return await readKnowledgeTopic(config, topicId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/专题不存在|未找到专题/.test(message)) {
      throw new KnowledgeScopeError("unavailable", message);
    }
    if (/专题 ID|资料范围|不能为空|必须/.test(message)) {
      throw new KnowledgeScopeError("invalid", message);
    }
    throw error;
  }
}

export function isMethodologyQuery(query: string): boolean {
  return /如何|怎么|怎样|方法论|分析方法|研究方法|分析框架|框架|步骤|指标体系|分析维度|评估方法/.test(query);
}

async function loadIndex(config: DriveConfig, topicId: string, indexVersion: number): Promise<SerializedSearchIndex | null> {
  topicId = normalizeTopicId(topicId);
  const path = `topics/${topicId}/index/search-index.json`;
  const metadata = await headObject(config, path);
  if (!metadata) return null;
  const latestEvidenceRevision = await readLatestEvidenceOverrideRevision(config, topicId);
  const cached = indexCache.get(topicId);
  if (
    cached?.etag === metadata.etag
    && cached.envelope.indexVersion === indexVersion
    && (cached.envelope.latestEvidenceRevision ?? null) === latestEvidenceRevision
  ) return cached.envelope;
  const envelope = await readTopicSearchIndex(config, topicId);
  if (
    !envelope
    || (envelope.version !== 1 && envelope.version !== 2)
    || envelope.topicId !== topicId
    || envelope.indexVersion !== indexVersion
    || (envelope.latestEvidenceRevision ?? null) !== latestEvidenceRevision
  ) return null;
  indexCache.set(topicId, { etag: metadata.etag, envelope });
  return envelope;
}
