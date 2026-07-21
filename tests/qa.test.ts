import { describe, expect, it } from "vitest";
import { createRetrievedQaSystemMessage, normalizeQaMessages } from "../src/drive/qa";
import { buildSerializedSearchIndex, searchSerializedIndex, tokenizeKnowledgeText } from "../src/drive/search";

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
});

describe("retrieval-grounded prompt", () => {
  it("requires file and locator citations without exposing COS URLs", () => {
    const prompt = createRetrievedQaSystemMessage([{ topicName: "新能源", fileName: "report.pdf", locator: "第 12 页", content: "库存增长。" }], true);
    expect(prompt).toContain("[文件名，位置]");
    expect(prompt).toContain("report.pdf");
    expect(prompt).toContain("第 12 页");
    expect(prompt).not.toContain("signedUrl");
  });

  it("keeps six complete history rounds", () => {
    const messages = Array.from({ length: 6 }, (_, index) => [
      { role: "user", content: `问题${index}` },
      { role: "assistant", content: `回答${index}` },
    ]).flat();
    messages.push({ role: "user", content: "最新问题" });
    expect(normalizeQaMessages(messages)).toHaveLength(13);
  });
});
