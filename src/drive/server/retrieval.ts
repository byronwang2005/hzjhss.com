import type { DriveConfig } from "./config";
import { headObject } from "./cos";
import { listKnowledgeTopics, normalizeTopicId, readKnowledgeTopic, readTopicSearchIndex } from "./knowledge";
import {
  loadSerializedSearchIndex,
  searchLoadedIndex,
  type LoadedSearchIndex,
  type RetrievedChunk,
} from "./search";

export class SearchIndexCache {
  private readonly entries = new Map<string, { etag: string; loaded: LoadedSearchIndex }>();

  get(topicId: string, etag: string, indexVersion: number): LoadedSearchIndex | undefined {
    const cached = this.entries.get(topicId);
    return cached?.etag === etag && cached.loaded.indexVersion === indexVersion
      ? cached.loaded
      : undefined;
  }

  set(topicId: string, etag: string, loaded: LoadedSearchIndex): void {
    this.entries.set(topicId, { etag, loaded });
  }
}

const indexCache = new SearchIndexCache();

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
    const loaded = await loadIndex(config, topic.id, topic.indexVersion);
    const candidates = loaded ? searchLoadedIndex(loaded, input.query, { now: input.now }) : [];
    return {
      topicId: topic.id,
      evidence: candidates.filter((chunk) => chunk.knowledgeRole === "evidence"),
      methodology: candidates.filter((chunk) => chunk.knowledgeRole === "methodology"),
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

async function loadIndex(config: DriveConfig, topicId: string, indexVersion: number): Promise<LoadedSearchIndex | null> {
  topicId = normalizeTopicId(topicId);
  const path = `topics/${topicId}/index/search-index.json`;
  const metadata = await headObject(config, path);
  if (!metadata) return null;
  const cached = indexCache.get(topicId, metadata.etag, indexVersion);
  if (cached) return cached;
  const envelope = await readTopicSearchIndex(config, topicId);
  if (
    !envelope
    || (envelope.version !== 1 && envelope.version !== 2)
    || envelope.topicId !== topicId
    || envelope.indexVersion !== indexVersion
  ) return null;
  const loaded = loadSerializedSearchIndex(envelope);
  indexCache.set(topicId, metadata.etag, loaded);
  return loaded;
}
