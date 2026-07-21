import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { directoryPrefix, fileIconName, formatBytes, normalizeClientRelativePath } from "../src/drive/client/utils";

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
});

describe("knowledge client surface", () => {
  const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");

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
    expect(source).toContain('"png", "jpg", "jpeg", "bmp", "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "md", "txt", "wps"');
    expect(source).toContain("document.numPages > 300");
    expect(source).toContain('uppy.on("upload-progress"');
    expect(source).toContain('uppy.on("progress"');
    expect(source).toContain('aria-label="总体上传进度"');
  });
});
