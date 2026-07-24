import { describe, expect, it } from "vitest";
import { buildQaRequestMessages, createRetrievedQaSystemMessage, isContextLengthError, normalizeQaMessages, QaCapacityError, retryOnceOnContextLength, upstreamAiErrorMessage, upstreamAiHttpStatus } from "../src/drive/server/qa";
import { isMethodologyQuery } from "../src/drive/server/retrieval";
import { buildSerializedSearchIndex, searchSerializedIndex, tokenizeKnowledgeText } from "../src/drive/server/search";

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
  it("requires file and locator citations without exposing COS URLs", () => {
    const prompt = createRetrievedQaSystemMessage([{ topicName: "新能源", fileName: "report.pdf", locator: "第 12 页", content: "库存增长。" }], true);
    expect(prompt).toContain("[文件名，位置]");
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
