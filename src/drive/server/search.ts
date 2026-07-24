import MiniSearch, { type Options, type SearchResult } from "minisearch";

export interface SearchChunk {
  id: string;
  topicId: string;
  topicName: string;
  path: string;
  fileName: string;
  content: string;
  locator: string;
  etag: string;
}

export interface SerializedSearchIndex {
  version: 1;
  topicId: string;
  topicName: string;
  indexVersion: number;
  generatedAt: string;
  chunks: SearchChunk[];
  index: unknown;
}

export interface RetrievedChunk extends SearchChunk {
  score: number;
}

const segmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter("zh-CN", { granularity: "word" }) : null;

export function tokenizeKnowledgeText(input: string): string[] {
  const normalized = input.normalize("NFKC").toLowerCase();
  const tokens = new Set<string>();
  for (const match of normalized.matchAll(/[a-z0-9]+(?:[._/-][a-z0-9]+)*/g)) {
    tokens.add(match[0]);
  }
  const chineseRuns = normalized.match(/[\u3400-\u9fff]+/g) || [];
  for (const run of chineseRuns) {
    if (run.length === 1) tokens.add(run);
    for (const width of [2, 3, 4]) {
      for (let index = 0; index <= run.length - width; index += 1) tokens.add(run.slice(index, index + width));
    }
  }
  if (segmenter) {
    for (const part of segmenter.segment(normalized)) {
      const word = part.segment.trim();
      if (word && (part.isWordLike || /[\u3400-\u9fff]/.test(word))) tokens.add(word);
    }
  }
  return [...tokens];
}

export function miniSearchOptions(): Options<SearchChunk> {
  return {
    fields: ["content", "fileName", "locator", "topicName"],
    storeFields: [],
    tokenize: tokenizeKnowledgeText,
    processTerm: (term) => term,
    idField: "id",
  };
}

export function buildSerializedSearchIndex(topicId: string, topicName: string, chunks: SearchChunk[], indexVersion = 0): SerializedSearchIndex {
  const search = new MiniSearch<SearchChunk>(miniSearchOptions());
  search.addAll(chunks);
  return {
    version: 1,
    topicId,
    topicName,
    indexVersion,
    generatedAt: new Date().toISOString(),
    chunks,
    index: search.toJSON(),
  };
}

export function searchSerializedIndex(envelope: SerializedSearchIndex, query: string, limit = 8): RetrievedChunk[] {
  const search = MiniSearch.loadJSON<SearchChunk>(JSON.stringify(envelope.index), miniSearchOptions());
  const byId = new Map(envelope.chunks.map((chunk) => [chunk.id, chunk]));
  return search.search(query, {
    prefix: (term) => term.length >= 3,
    fuzzy: (term) => term.length >= 5 ? 0.1 : false,
    boost: { fileName: 2, locator: 1.4, topicName: 1.2 },
  }).slice(0, limit).flatMap((result: SearchResult) => {
    const chunk = byId.get(String(result.id));
    return chunk ? [{ ...chunk, score: result.score }] : [];
  });
}
