import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { directoryPrefix, fileIconName, formatBytes, normalizeClientRelativePath, processingDisplay } from "../src/drive/client/utils";

describe("knowledge client helpers", () => {
  it("normalizes upload paths and rejects traversal", () => {
    expect(normalizeClientRelativePath("报告\\年度.pdf")).toBe("报告/年度.pdf");
    expect(() => normalizeClientRelativePath("../secret.txt")).toThrow("文件路径无效");
  });

  it("formats files for the administrator table", () => {
    expect(fileIconName("report.pdf")).toBe("file-pdf");
    expect(fileIconName("data.xlsx")).toBe("file-xls");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
    expect(directoryPrefix("a/b/")).toBe("a/");
  });

  it("stops polling files whose processing never started", () => {
    const file = { name: "a.pdf", path: "a.pdf", relativePath: "a.pdf", size: 1, lastModified: "2026-07-21T06:00:00.000Z", etag: "etag", knowledgeRole: "evidence" as const };
    expect(processingDisplay(file)).toEqual({ label: "未开始处理", retryable: true, poll: false });
    expect(processingDisplay({ ...file, processing: { state: "queued", sourceEtag: "etag", updatedAt: "2026-07-21T06:00:00.000Z" } }, Date.parse("2026-07-21T06:03:00.000Z"))).toEqual({ label: "处理未启动", retryable: true, poll: false });
  });
});

describe("knowledge client surface", () => {
  const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
  const uploadPolicy = readFileSync(new URL("../src/drive/client/upload-policy.ts", import.meta.url), "utf8");
  const sharedPolicy = readFileSync(new URL("../src/drive/shared/policy.ts", import.meta.url), "utf8");

  it("keeps only Q&A and administrator file management", () => {
    expect(source).toContain('<drive-ai-qa scope="global"');
    expect(source).toContain('<drive-ai-qa scope="topic"');
    expect(source).toContain('state.role === "admin"');
    expect(source).not.toContain("Agent");
    expect(source).not.toContain("成果");
    expect(source).not.toContain("Context");
    expect(source).not.toContain("owner");
  });

  it("validates supported formats, PDF pages and upload progress", () => {
    expect(sharedPolicy).toContain('"png", "jpg", "jpeg", "bmp"');
    expect(sharedPolicy).toContain('"pdf", "doc", "docx", "ppt", "pptx"');
    expect(uploadPolicy).toContain("document.numPages > FILE_LIMITS.pdfPages");
    expect(source).toContain('uppy.on("upload-progress"');
    expect(source).toContain('uppy.on("progress"');
    expect(source).toContain('aria-label="总体上传进度"');
    expect(source).toContain('phase: "registering"');
    expect(source).toContain("文件登记超时，请稍后重试");
    expect(source).toContain("completed.length !== prepared.length");
  });

  it("clears server markup and uses one background file refresh timer", () => {
    expect(source).toContain("root.replaceChildren()");
    expect(source).toContain("window.clearTimeout(fileRefreshTimer)");
    expect(source).toContain("void loadFiles(true)");
    expect(source).not.toContain("!file.processing ||");
  });
});
