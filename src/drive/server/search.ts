import MiniSearch, { type Options, type SearchResult } from "minisearch";
import type { KnowledgeRole, ReportDateSource } from "../shared/contracts";

export interface SearchChunk {
  id: string;
  topicId: string;
  topicName: string;
  path: string;
  fileName: string;
  content: string;
  locator: string;
  etag: string;
  knowledgeRole?: KnowledgeRole;
  reportDate?: string;
  reportDateSource?: ReportDateSource;
}

export interface SerializedSearchIndex {
  version: 1 | 2;
  topicId: string;
  topicName: string;
  indexVersion: number;
  generatedAt: string;
  chunks: SearchChunk[];
  index: unknown;
}

export interface RetrievedChunk extends SearchChunk {
  score: number;
  knowledgeRole: KnowledgeRole;
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
    storeFields: ["knowledgeRole", "reportDate", "topicId"],
    tokenize: tokenizeKnowledgeText,
    processTerm: (term) => term,
    idField: "id",
  };
}

export function buildSerializedSearchIndex(topicId: string, topicName: string, chunks: SearchChunk[], indexVersion = 0): SerializedSearchIndex {
  const search = new MiniSearch<SearchChunk>(miniSearchOptions());
  search.addAll(chunks);
  return {
    version: 2,
    topicId,
    topicName,
    indexVersion,
    generatedAt: new Date().toISOString(),
    chunks,
    index: search.toJSON(),
  };
}

export function searchSerializedIndex(
  envelope: SerializedSearchIndex,
  query: string,
  options: number | { role?: KnowledgeRole; limit?: number; now?: Date } = {},
): RetrievedChunk[] {
  const search = MiniSearch.loadJSON<SearchChunk>(JSON.stringify(envelope.index), miniSearchOptions());
  const byId = new Map(envelope.chunks.map((chunk) => [chunk.id, chunk]));
  const normalizedOptions = typeof options === "number" ? { limit: options } : options;
  const temporal = isTemporalQuery(query);
  const now = normalizedOptions.now || new Date();
  const results = search.search(query, {
    prefix: (term) => term.length >= 3,
    fuzzy: (term) => term.length >= 5 ? 0.1 : false,
    boost: { fileName: 2, locator: 1.4, topicName: 1.2 },
    filter: (result) => {
      if (!normalizedOptions.role) return true;
      return knowledgeRoleOf(byId.get(String(result.id))) === normalizedOptions.role;
    },
    boostDocument: (id) => {
      const chunk = byId.get(String(id));
      return temporal && knowledgeRoleOf(chunk) === "evidence"
        ? reportDateBoost(chunk?.reportDate, now)
        : 1;
    },
  });
  const limited = normalizedOptions.limit === undefined ? results : results.slice(0, normalizedOptions.limit);
  return limited.flatMap((result: SearchResult) => {
    const chunk = byId.get(String(result.id));
    return chunk ? [{ ...chunk, knowledgeRole: knowledgeRoleOf(chunk), score: result.score }] : [];
  });
}

export function isTemporalQuery(query: string): boolean {
  return /最新|本周|这周|最近|近期|截至|当前|近况|今日|今天/.test(query);
}

function knowledgeRoleOf(chunk: SearchChunk | undefined): KnowledgeRole {
  return chunk?.knowledgeRole === "reference" || chunk?.knowledgeRole === "methodology"
    ? chunk.knowledgeRole
    : "evidence";
}

function reportDateBoost(reportDate: string | undefined, now: Date): number {
  if (!reportDate) return 1;
  const timestamp = Date.parse(`${reportDate}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return 1;
  const ageDays = Math.max(0, (now.getTime() - timestamp) / 86_400_000);
  if (ageDays >= 90) return 1;
  return 1 + 0.5 * (1 - ageDays / 90);
}
