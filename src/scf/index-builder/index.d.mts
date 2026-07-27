export function tokenize(input: string): string[];
export function extractTopicId(event: unknown, context?: unknown): string | undefined;
export function selectLatestEvidence(
  sets: Array<{ path: string; sourceEtag: string; knowledgeRole: string; reportDate?: string; uploadedAt?: string }>,
  override?: { version: 1; generation: string; path: string; sourceEtag: string; selectedAt: string } | null,
): { path: string; source: "auto" | "manual" } | null;
