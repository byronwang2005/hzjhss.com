import type { DriveConfig } from "./config";
import { headObject } from "./cos";
import { listKnowledgeTopics, normalizeTopicId, readKnowledgeTopic, readTopicSearchIndex } from "./knowledge";
import { searchSerializedIndex, type RetrievedChunk, type SerializedSearchIndex } from "./search";

const MAX_RESULTS = 8;
const MAX_CONTEXT_CHARS = 18_000;
const indexCache = new Map<string, { etag: string; envelope: SerializedSearchIndex }>();

export async function retrieveKnowledge(config: DriveConfig, input: { scope: "global" | "topic"; topicId?: unknown; query: string }): Promise<RetrievedChunk[]> {
  const topics = input.scope === "topic"
    ? [await readKnowledgeTopic(config, input.topicId)]
    : (await listKnowledgeTopics(config)).filter((topic) => topic.ready);
  const resultSets = await Promise.all(topics.map(async (topic) => {
    const envelope = await loadIndex(config, topic.id, topic.indexVersion);
    return envelope ? searchSerializedIndex(envelope, input.query, MAX_RESULTS) : [];
  }));
  const merged = resultSets.flat().sort((a, b) => b.score - a.score);
  const selected: RetrievedChunk[] = [];
  let length = 0;
  for (const result of merged) {
    if (selected.length >= MAX_RESULTS) break;
    const remaining = MAX_CONTEXT_CHARS - length;
    if (remaining <= 0) break;
    const content = result.content.length > remaining ? result.content.slice(0, remaining) : result.content;
    selected.push({ ...result, content });
    length += content.length;
  }
  return selected;
}

async function loadIndex(config: DriveConfig, topicId: string, indexVersion: number): Promise<SerializedSearchIndex | null> {
  topicId = normalizeTopicId(topicId);
  const path = `topics/${topicId}/index/search-index.json`;
  const metadata = await headObject(config, path);
  if (!metadata) return null;
  const cached = indexCache.get(topicId);
  if (cached?.etag === metadata.etag && cached.envelope.indexVersion === indexVersion) return cached.envelope;
  const envelope = await readTopicSearchIndex(config, topicId);
  if (!envelope || envelope.version !== 1 || envelope.topicId !== topicId || envelope.indexVersion !== indexVersion) return null;
  indexCache.set(topicId, { etag: metadata.etag, envelope });
  return envelope;
}
