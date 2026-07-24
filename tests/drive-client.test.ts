import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { directoryPrefix, FILE_ROLE_PRESENTATION, fileIconName, filesForKnowledgeRole, formatBytes, normalizeClientRelativePath, processingDisplay } from "../src/drive/client/utils";
import type { KnowledgeFile } from "../src/drive/shared/contracts";

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

  it("presents and filters the three knowledge roles", () => {
    const base = { path: "", relativePath: "", size: 1, lastModified: "2026-07-21T06:00:00.000Z", etag: "etag" };
    const files: KnowledgeFile[] = [
      { ...base, name: "reference.pdf", path: "reference.pdf", relativePath: "reference.pdf", knowledgeRole: "reference" },
      { ...base, name: "methodology.md", path: "__methodology__.md", relativePath: "__methodology__.md", knowledgeRole: "methodology" },
      { ...base, name: "weekly.pdf", path: "weekly.pdf", relativePath: "weekly.pdf", knowledgeRole: "evidence" },
    ];

    expect(FILE_ROLE_PRESENTATION.reference.label).toBe("研报原件");
    expect(FILE_ROLE_PRESENTATION.methodology.uploadLabel).toBe("上传专题方法论");
    expect(FILE_ROLE_PRESENTATION.evidence.label).toBe("时效资料");
    expect(filesForKnowledgeRole(files, "evidence").map((file) => file.name)).toEqual(["weekly.pdf"]);
  });
});

describe("knowledge client surface", () => {
  const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
  const uploadPolicy = readFileSync(new URL("../src/drive/client/upload-policy.ts", import.meta.url), "utf8");
  const sharedPolicy = readFileSync(new URL("../src/drive/shared/policy.ts", import.meta.url), "utf8");

  it("keeps only Q&A and administrator file management", () => {
    expect(source).toContain('<drive-ai-qa scope="global"');
    expect(source).toContain(".displayName=${state.displayName}");
    expect(source).toContain('<drive-ai-qa scope="topic"');
    expect(source).toContain('state.role === "admin"');
    expect(source).not.toContain("Agent");
    expect(source).not.toContain("成果");
    expect(source).not.toContain("Context");
    expect(source).not.toContain("owner");
  });

  it("keeps the overview compact and exposes topic creation only to administrators", () => {
    expect(source).not.toContain('<span class="drive-eyebrow">知识工作台</span>');
    expect(source).not.toContain("从全部资料中提问，快速获得带来源的可靠答案。");
    expect(source).toContain('<div class="drive-topic-panel-actions">');
    expect(source).toContain('state.role === "admin" ? html`<button class="drive-control" data-action="create-topic"');
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

  it("renders role tabs, contextual uploads and accessible table cells", () => {
    expect(source).toContain('data-action="file-role-view"');
    expect(source).toContain('role="tabpanel"');
    expect(source).toContain('role="columnheader"');
    expect(source).toContain('data-label="状态"');
    expect(source).toContain("替换专题方法论");
    expect(source).not.toContain(">上传周报<");
  });

  it("clears server markup and uses one background file refresh timer", () => {
    expect(source).toContain("root.replaceChildren()");
    expect(source).toContain("window.clearTimeout(fileRefreshTimer)");
    expect(source).toContain("void loadFiles(true)");
    expect(source).not.toContain("!file.processing ||");
  });
});
