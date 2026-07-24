import { beforeAll, describe, expect, it } from "vitest";
import { knowledgeRoleForPath } from "../src/drive/shared/methodology";

let processor: typeof import("../src/scf/file-processor/index.mjs");
let indexer: typeof import("../src/scf/index-builder/index.mjs");

beforeAll(async () => {
  process.env.TENCENT_SECRET_ID = "id";
  process.env.TENCENT_SECRET_KEY = "key";
  process.env.COS_BUCKET = "bucket-1250000000";
  process.env.COS_REGION = "ap-guangzhou";
  process.env.INDEXER_FUNCTION_NAME = "index-builder";
  process.env.WEBHOOK_SECRET = "secret";
  processor = await import("../src/scf/file-processor/index.mjs");
  indexer = await import("../src/scf/index-builder/index.mjs");
});

describe("SCF event routing and chunking", () => {
  it("accepts only source objects in the new COS namespace", () => {
    const records = processor.extractRecords({ Records: [
      { cos: { cosObject: { key: "/1250000000/bucket-1250000000/ai-knowledge-base%2Ftopics%2Ft_abcdefghijkl%2Ffiles%2Freport.pdf" } } },
      { cos: { cosObject: { key: "ai-knowledge-base/topics/t_abcdefghijkl/processed/report.pdf/result.md" } } },
    ] });
    expect(records).toHaveLength(1);
    expect(records[0].key).toContain("/files/report.pdf");
  });

  it("uses the Tencent Cloud SDK client configuration object shape", () => {
    const credential = { secretId: "id", secretKey: "key" };
    expect(processor.createTencentClientConfig(credential, "ap-shanghai")).toEqual({
      credential,
      region: "ap-shanghai",
      profile: { httpProfile: { reqTimeout: 60 } },
    });
  });

  it("preserves PDF pages and Excel worksheet headings", () => {
    expect(processor.structuredChunks({ Blocks: [{ PageNumber: 12, Content: "这是足够长的 PDF 页面内容，用于验证页码来源能够保存在检索分块中。" }] }, "pdf")[0].locator).toBe("第 12 页");
    expect(processor.splitMarkdown("# 资产负债表\n\n这是工作表中的主要数据和说明。", "xlsx")[0].locator).toBe("工作表：资产负债表");
  });

  it("parses methodology Markdown locally without the document OCR response shape", () => {
    const parsed = processor.parseMethodologyMarkdown("# 核心框架\n\n先看供需，再看库存。", "方法论.md");
    expect(parsed.raw).toEqual({ format: "markdown", source: "方法论.md" });
    expect(parsed.chunks[0]).toMatchObject({ locator: "章节：核心框架" });
  });

  it("recognizes branded methodology metadata and the legacy reserved path", () => {
    const brandedPath = "嘉合杉升机器人方法论.md";
    expect(knowledgeRoleForPath("methodology", brandedPath)).toBe("methodology");
    expect(knowledgeRoleForPath(undefined, brandedPath, brandedPath)).toBe("methodology");
    expect(knowledgeRoleForPath(undefined, "__methodology__.md", brandedPath)).toBe("methodology");
  });

  it("extracts report dates from file names, parsed headings, and upload fallback", () => {
    expect(processor.extractReportDate("周报-2026-07-18.pdf", "", "2026-07-20T00:00:00Z")).toEqual({
      reportDate: "2026-07-18",
      reportDateSource: "filename",
    });
    expect(processor.extractReportDate("周报.pdf", "# 统计周期：2026年7月14日—2026年7月20日", "2026-07-21T00:00:00Z")).toEqual({
      reportDate: "2026-07-20",
      reportDateSource: "content",
    });
    expect(processor.extractReportDate("周报.pdf", "无明确日期", "2026-07-21T00:00:00Z")).toEqual({
      reportDate: "2026-07-21",
      reportDateSource: "upload",
    });
  });

  it("uses the same Chinese n-gram strategy as the Worker", () => {
    expect(indexer.tokenize("新能源库存")).toEqual(expect.arrayContaining(["新能源", "库存"]));
  });

  it("accepts topic IDs from SCF async invocation event variants", () => {
    const topicId = "t_abcdefghijkl";
    expect(indexer.extractTopicId({ topicId })).toBe(topicId);
    expect(indexer.extractTopicId(JSON.stringify({ topicId }))).toBe(topicId);
    expect(indexer.extractTopicId({ ClientContext: JSON.stringify({ topicId }) })).toBe(topicId);
    expect(indexer.extractTopicId({}, { client_context: JSON.stringify({ topicId }) })).toBe(topicId);
  });
});
