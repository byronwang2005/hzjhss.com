import { describe, expect, it } from "vitest";
import OpenAI from "openai";
import { buildQaRequestMessages, createQaClient, createQaCompletionParams, createQaStreamState, createRetrievedQaSystemMessage, finishQaStreamEvents, isContextLengthError, normalizeQaMessages, qaInputTokenBudget, qaModelStartError, qaPromptInputTokenBudget, qaProviderDeltaEvents, QaCapacityError, retryOnceOnContextLength, upstreamAiDiagnostic, upstreamAiErrorMessage, upstreamAiHttpStatus } from "../src/drive/server/qa";
import { isMethodologyQuery, SearchIndexCache } from "../src/drive/server/retrieval";
import { buildSerializedSearchIndex, loadSerializedSearchIndex, searchLoadedIndex, searchSerializedIndex, tokenizeKnowledgeText } from "../src/drive/server/search";

describe("knowledge retrieval", () => {
  it("tokenizes Chinese terms, bigrams, numbers and identifiers", () => {
    const tokens = tokenizeKnowledgeText("新能源库存同比增长 12.5% report-2026");
    expect(tokens).toContain("新能源");
    expect(tokens).toContain("库存");
    expect(tokens).toContain("同比");
    expect(tokens).toContain("report-2026");
  });

  it("retrieves relevant chunks from a serialized MiniSearch index", () => {
    const envelope = buildSerializedSearchIndex("t_abcdefghijkl", "新能源", [
      { id: "1", topicId: "t_abcdefghijkl", topicName: "新能源", path: "report.pdf", fileName: "report.pdf", locator: "第 12 页", etag: "a", content: "库存同比增长 18%，主要来自渠道补货。" },
      { id: "2", topicId: "t_abcdefghijkl", topicName: "新能源", path: "risk.pdf", fileName: "risk.pdf", locator: "第 3 页", etag: "b", content: "原材料价格下降，毛利率有所改善。" },
    ]);
    const results = searchSerializedIndex(envelope, "库存同比", 8);
    expect(results[0]).toMatchObject({ fileName: "report.pdf", locator: "第 12 页" });
  });

  it("filters knowledge roles and boosts recent evidence for temporal questions", () => {
    const envelope = buildSerializedSearchIndex("t_abcdefghijkl", "新能源", [
      { id: "old", topicId: "t_abcdefghijkl", topicName: "新能源", path: "old.pdf", fileName: "old.pdf", locator: "第 1 页", etag: "a", content: "库存变化", knowledgeRole: "evidence", reportDate: "2026-01-01" },
      { id: "new", topicId: "t_abcdefghijkl", topicName: "新能源", path: "new.pdf", fileName: "new.pdf", locator: "第 1 页", etag: "b", content: "库存变化", knowledgeRole: "evidence", reportDate: "2026-07-20" },
      { id: "method", topicId: "t_abcdefghijkl", topicName: "新能源", path: "__methodology__.md", fileName: "__methodology__.md", locator: "章节：库存", etag: "c", content: "库存变化分析方法", knowledgeRole: "methodology" },
    ]);
    const evidence = searchSerializedIndex(envelope, "最新库存变化", { role: "evidence", now: new Date("2026-07-24T00:00:00Z") });
    const methodology = searchSerializedIndex(envelope, "库存变化", { role: "methodology" });
    expect(evidence[0].id).toBe("new");
    expect(methodology).toHaveLength(1);
    expect(methodology[0].knowledgeRole).toBe("methodology");
  });

  it("loads a serialized index once and partitions one search into role-specific results", () => {
    const envelope = buildSerializedSearchIndex("t_abcdefghijkl", "新能源", [
      { id: "evidence", topicId: "t_abcdefghijkl", topicName: "新能源", path: "week.pdf", fileName: "week.pdf", locator: "第 1 页", etag: "a", content: "库存变化分析", knowledgeRole: "evidence" },
      { id: "method", topicId: "t_abcdefghijkl", topicName: "新能源", path: "method.md", fileName: "method.md", locator: "库存章节", etag: "b", content: "库存变化分析", knowledgeRole: "methodology" },
    ]);
    const loaded = loadSerializedSearchIndex(envelope);
    const candidates = searchLoadedIndex(loaded, "库存变化");
    const evidence = candidates.filter((chunk) => chunk.knowledgeRole === "evidence");
    const methodology = candidates.filter((chunk) => chunk.knowledgeRole === "methodology");

    expect(loaded).toMatchObject({ topicId: envelope.topicId, indexVersion: envelope.indexVersion });
    expect(evidence).toEqual(searchLoadedIndex(loaded, "库存变化", { role: "evidence" }));
    expect(methodology).toEqual(searchLoadedIndex(loaded, "库存变化", { role: "methodology" }));
  });

  it("reuses loaded indexes only while both ETag and index version match", () => {
    const envelope = buildSerializedSearchIndex("t_abcdefghijkl", "新能源", [
      { id: "evidence", topicId: "t_abcdefghijkl", topicName: "新能源", path: "week.pdf", fileName: "week.pdf", locator: "第 1 页", etag: "a", content: "库存变化" },
    ], 7);
    const loaded = loadSerializedSearchIndex(envelope);
    const cache = new SearchIndexCache();
    cache.set(envelope.topicId, "etag-7", loaded);

    expect(cache.get(envelope.topicId, "etag-7", 7)).toBe(loaded);
    expect(cache.get(envelope.topicId, "etag-changed", 7)).toBeUndefined();
    expect(cache.get(envelope.topicId, "etag-7", 8)).toBeUndefined();
  });

  it("keeps multiple current files searchable and ignores legacy latest markers", () => {
    const envelope = buildSerializedSearchIndex("t_abcdefghijkl", "生猪", [
      { id: "history", topicId: "t_abcdefghijkl", topicName: "生猪", path: "history.pdf", fileName: "history.pdf", locator: "第 1 页", etag: "a", content: "产能库存变化", knowledgeRole: "evidence", reportDate: "2026-07-20" },
      { id: "current", topicId: "t_abcdefghijkl", topicName: "生猪", path: "current.pdf", fileName: "current.pdf", locator: "第 1 页", etag: "b", content: "产能库存变化", knowledgeRole: "evidence", reportDate: "2026-07-20" },
    ]);
    const baseline = searchSerializedIndex(envelope, "最新产能库存", { role: "evidence", now: new Date("2026-07-24T00:00:00Z") });
    const legacy = structuredClone(envelope) as typeof envelope & { latestEvidenceRevision?: string };
    legacy.latestEvidenceRevision = "legacy-revision";
    (legacy.chunks[1] as typeof legacy.chunks[number] & { isLatestEvidence?: boolean }).isLatestEvidence = true;
    expect(searchSerializedIndex(legacy, "最新产能库存", { role: "evidence", now: new Date("2026-07-24T00:00:00Z") }).map(({ id, score }) => ({ id, score })))
      .toEqual(baseline.map(({ id, score }) => ({ id, score })));
    expect(baseline.map((item) => item.id)).toEqual(expect.arrayContaining(["history", "current"]));
  });

  it("treats legacy v1 chunks without roles as evidence", () => {
    const current = buildSerializedSearchIndex("t_abcdefghijkl", "新能源", [
      { id: "legacy", topicId: "t_abcdefghijkl", topicName: "新能源", path: "legacy.pdf", fileName: "legacy.pdf", locator: "第 1 页", etag: "a", content: "历史库存数据" },
    ]);
    const legacy = { ...current, version: 1 as const };
    expect(searchSerializedIndex(legacy, "库存", { role: "evidence" })).toHaveLength(1);
    expect(searchSerializedIndex(legacy, "库存", { role: "methodology" })).toHaveLength(0);
  });

  it("only enables global methodology fallback for method-oriented questions", () => {
    expect(isMethodologyQuery("应该如何分析库存周期？")).toBe(true);
    expect(isMethodologyQuery("最新库存是多少？")).toBe(false);
  });
});

describe("retrieval-grounded prompt", () => {
  it("uses the configured DeepSeek thinking mode and reserves the full completion budget", () => {
    const params = createQaCompletionParams({
      model: "deepseek-v4-pro",
      maxOutputTokens: 384_000,
      provider: "deepseek",
      reasoningEffort: "high",
    }, [{ role: "user", content: "问题" }]);
    expect(params).toMatchObject({
      model: "deepseek-v4-pro",
      stream: true,
      max_tokens: 384_000,
      reasoning_effort: "high",
      thinking: { type: "enabled" },
    });
    const compatibleParams = createQaCompletionParams({
      model: "another-model",
      maxOutputTokens: 4_000,
      provider: "openai-compatible",
      reasoningEffort: "high",
    }, [{ role: "user", content: "问题" }]);
    expect(compatibleParams).not.toHaveProperty("thinking");
    expect(compatibleParams).not.toHaveProperty("reasoning_effort");
    expect(qaInputTokenBudget({ contextWindowTokens: 1_000_000, maxOutputTokens: 384_000 })).toBe(566_000);
    expect(qaPromptInputTokenBudget({ contextWindowTokens: 1_000_000, maxOutputTokens: 384_000 })).toBe(128_000);
    expect(qaPromptInputTokenBudget({ contextWindowTokens: 100_000, maxOutputTokens: 2_500 })).toBe(92_500);
    expect(createQaClient({
      apiKey: "key",
      baseURL: "https://api.deepseek.com",
      model: "deepseek-v4-pro",
      maxOutputTokens: 384_000,
      contextWindowTokens: 1_000_000,
      provider: "deepseek",
      reasoningEffort: "high",
      requestTimeoutMs: 300_000,
    }).timeout).toBe(300_000);
  });

  it("turns reasoning deltas into status only and never exposes the raw chain of thought", () => {
    const state = createQaStreamState();
    const thinking = qaProviderDeltaEvents("deepseek", { reasoning_content: "内部方法论秘密" }, state);
    expect(thinking).toEqual([{ event: "thinking", data: { active: true } }]);
    expect(JSON.stringify(thinking)).not.toContain("内部方法论秘密");
    expect(qaProviderDeltaEvents("deepseek", { reasoning_content: "更多秘密" }, state)).toEqual([]);
    expect(qaProviderDeltaEvents("deepseek", { content: "最终回答" }, state)).toEqual([
      { event: "thinking", data: { active: false } },
      { event: "delta", data: { content: "最终回答" } },
    ]);
    expect(finishQaStreamEvents(state)).toEqual([]);
    expect(qaProviderDeltaEvents("openai-compatible", { reasoning_content: "供应商私有字段" }, createQaStreamState())).toEqual([]);
  });

  it("requires file and locator citations without exposing COS URLs", () => {
    const prompt = createRetrievedQaSystemMessage([{ topicName: "新能源", fileName: "report.pdf", locator: "第 12 页", content: "库存增长。" }], true);
    expect(prompt).toContain("引用编号：[^1]");
    expect(prompt).toContain("[^编号]: 《文件名》，位置");
    expect(prompt).toContain("公式中的中文必须写在 \\text{...} 中");
    expect(prompt).toContain("report.pdf");
    expect(prompt).toContain("第 12 页");
    expect(prompt).not.toContain("signedUrl");
  });

  it("accepts conversation histories longer than six rounds", () => {
    const messages = Array.from({ length: 20 }, (_, index) => [
      { role: "user", content: `问题${index}` },
      { role: "assistant", content: `回答${index}` },
    ]).flat();
    messages.push({ role: "user", content: "最新问题" });
    expect(normalizeQaMessages(messages)).toHaveLength(41);
  });

  it("hides methodology file details and dynamically packs more than eight chunks", () => {
    const methodology = [{
      id: "m1", topicId: "t_abcdefghijkl", topicName: "新能源", path: "__methodology__.md",
      fileName: "__methodology__.md", locator: "章节：框架", etag: "m", content: "分析方法".repeat(500),
      knowledgeRole: "methodology" as const, score: 10,
    }];
    const evidence = Array.from({ length: 20 }, (_, index) => ({
      id: `e${index}`, topicId: "t_abcdefghijkl", topicName: "新能源", path: `week-${index}.pdf`,
      fileName: `week-${index}.pdf`, locator: `第 ${index + 1} 页`, etag: `e${index}`,
      content: `库存与订单变化证据${index}`.repeat(100), knowledgeRole: "evidence" as const,
      reportDate: "2026-07-20", score: 20 - index / 10,
    }));
    const built = buildQaRequestMessages(
      { contextWindowTokens: 100_000, maxOutputTokens: 2_500 },
      [{ role: "user", content: "请分析最新库存变化" }],
      { methodology, evidence },
      false,
      { now: new Date("2026-07-24T00:00:00Z") },
    );
    const prompt = String(built.messages[0].content);
    expect(built.evidenceCount).toBeGreaterThan(8);
    expect(prompt.length).toBeGreaterThan(18_000);
    expect(prompt).toContain("专题方法论");
    expect(prompt).not.toContain("__methodology__.md");
    expect(prompt).toContain("当前日期：2026-07-24");
  });

  it("drops oldest complete history rounds only when the model budget requires it", () => {
    const history = Array.from({ length: 20 }, (_, index) => [
      { role: "user" as const, content: `旧问题${index}`.repeat(100) },
      { role: "assistant" as const, content: `旧回答${index}`.repeat(100) },
    ]).flat();
    const built = buildQaRequestMessages(
      { contextWindowTokens: 5_000, maxOutputTokens: 500 },
      [...history, { role: "user", content: "最新问题必须保留" }],
      { methodology: [], evidence: [] },
      false,
    );
    expect(built.historyCount).toBeLessThan(history.length);
    expect(built.historyCount % 2).toBe(0);
    expect(built.estimatedInputTokens).toBeLessThanOrEqual(4_250);
    expect(built.messages.at(-1)).toMatchObject({ role: "user", content: "最新问题必须保留" });
    expect(isContextLengthError(new Error("maximum context length exceeded"))).toBe(true);
  });

  it("returns an explicit capacity error instead of truncating the latest question", () => {
    let error: unknown;
    try {
      buildQaRequestMessages(
        { contextWindowTokens: 1_000, maxOutputTokens: 100 },
        [{ role: "user", content: "超长问题".repeat(2_000) }],
        { methodology: [], evidence: [] },
        false,
      );
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(QaCapacityError);
    expect(upstreamAiErrorMessage(error)).toContain("最新问题超过");
    expect(upstreamAiHttpStatus(error)).toBe(413);
  });

  it.each([
    [400, "MODEL_REQUEST_INVALID", false],
    [401, "MODEL_AUTHENTICATION_FAILED", false],
    [402, "MODEL_BALANCE_EXHAUSTED", false],
    [404, "MODEL_REQUEST_INVALID", false],
    [422, "MODEL_REQUEST_INVALID", false],
    [429, "MODEL_BUSY", true],
    [503, "MODEL_UPSTREAM_UNAVAILABLE", true],
  ] as const)("maps upstream status %i to a precise safe Q&A error", (status, code, retryable) => {
    const error = new OpenAI.APIError(
      status,
      { code: "provider_code", type: "provider_type" },
      "sensitive provider message containing a user prompt",
      new Headers({ "x-request-id": "provider-request-123" }),
    );
    expect(qaModelStartError(error, "request-123")).toMatchObject({
      requestId: "request-123",
      code,
      retryable,
    });
    const diagnostic = upstreamAiDiagnostic(error);
    expect(diagnostic).toMatchObject({
      status,
      code: "provider_code",
      type: "provider_type",
      providerRequestId: "provider-request-123",
    });
    expect(JSON.stringify(diagnostic)).not.toContain("sensitive provider message");
    expect(JSON.stringify(diagnostic)).not.toContain("user prompt");
  });

  it("retries a provider context overflow exactly once with an 80% budget", async () => {
    const scales: number[] = [];
    const result = await retryOnceOnContextLength(async (scale) => {
      scales.push(scale);
      if (scale === 1) throw new Error("maximum context length exceeded");
      return "ok";
    });
    expect(result).toBe("ok");
    expect(scales).toEqual([1, 0.8]);
  });
});
