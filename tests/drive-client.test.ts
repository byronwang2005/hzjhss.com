import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { transitionEntryState } from "../src/drive/client/entry-flow";
import { directoryPrefix, FILE_ROLE_PRESENTATION, fileIconName, fileNameFromPath, filesForKnowledgeRole, formatBytes, methodologyDisplayName, normalizeClientRelativePath, processingDisplay, visibleFileRole, visibleFileRoles } from "../src/drive/client/utils";
import type { KnowledgeFile } from "../src/drive/shared/contracts";

describe("knowledge entry flow", () => {
  it("keeps session checking, successful sign-in and authentication failure distinct", () => {
    expect(transitionEntryState("checking-session", "session-valid")).toBe("ready");
    expect(transitionEntryState("checking-session", "session-unauthorized")).toBe("signed-out");
    expect(transitionEntryState("signed-out", "submit-login")).toBe("authenticating");
    expect(transitionEntryState("authenticating", "login-succeeded")).toBe("preparing-workspace");
    expect(transitionEntryState("preparing-workspace", "workspace-ready")).toBe("ready");
    expect(transitionEntryState("authenticating", "login-failed")).toBe("auth-error");
    expect(transitionEntryState("auth-error", "submit-login")).toBe("authenticating");
  });

  it("rejects impossible entry transitions", () => {
    expect(() => transitionEntryState("checking-session", "login-succeeded")).toThrow("Invalid entry transition");
    expect(() => transitionEntryState("ready", "submit-login")).toThrow("Invalid entry transition");
  });
});

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
    expect(fileNameFromPath("报告/年度总结.pdf")).toBe("年度总结.pdf");
    expect(methodologyDisplayName({
      knowledgeRole: "methodology",
      name: "__methodology__.md",
      path: "__methodology__.md",
    })).toBe("专题方法论.md");
    expect(methodologyDisplayName({
      knowledgeRole: "methodology",
      name: "嘉合杉升机器人方法论.md",
      path: "嘉合杉升机器人方法论.md",
    })).toBe("嘉合杉升机器人方法论.md");
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

  it("renders administrator roles separately from the member two-column roles", () => {
    expect(visibleFileRoles("admin")).toEqual(["reference", "methodology", "evidence"]);
    expect(visibleFileRoles("viewer")).toEqual(["reference", "evidence"]);
    expect(visibleFileRole("viewer", "methodology")).toBe("evidence");
    expect(visibleFileRole("admin", "methodology")).toBe("methodology");
  });
});

describe("knowledge client surface", () => {
  const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
  const stateSource = readFileSync(new URL("../src/drive/client/state.ts", import.meta.url), "utf8");
  const workspaceStyles = readFileSync(new URL("../src/drive/client/styles/workspace.css", import.meta.url), "utf8");
  const uploadPolicy = readFileSync(new URL("../src/drive/client/upload-policy.ts", import.meta.url), "utf8");
  const sharedPolicy = readFileSync(new URL("../src/drive/shared/policy.ts", import.meta.url), "utf8");
  const entryMarkup = readFileSync(new URL("../src/site/pages/index.html", import.meta.url), "utf8");

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

  it("keeps desktop scrolling inside the conversation, topic list and file table", () => {
    expect(source).toContain('class=${`drive-dashboard-main is-${state.mode}`}');
    expect(source).toContain("data-mode=${state.mode}");
    expect(workspaceStyles).toContain("@media (min-width: 1024px) and (min-height: 640px)");
    expect(workspaceStyles).toMatch(/\.drive-page \{[\s\S]*?height: 100dvh;[\s\S]*?overflow: hidden;/);
    expect(workspaceStyles).toMatch(/\.drive-dashboard \{[\s\S]*?grid-template-rows: var\(--drive-shell-appbar-height\) minmax\(0, 1fr\);/);
    expect(workspaceStyles).toMatch(/\.drive-dashboard-main \{[\s\S]*?min-height: 0;[\s\S]*?overflow: hidden;/);
    expect(workspaceStyles).toMatch(/\.drive-ai-qa-messages \{[\s\S]*?overflow-y: auto;[\s\S]*?scrollbar-gutter: stable;/);
    expect(workspaceStyles).toMatch(/\.drive-topic-grid \{[\s\S]*?overflow-y: auto;[\s\S]*?scrollbar-gutter: stable;/);
    expect(workspaceStyles).toMatch(/\.drive-file-role-panel > \.drive-file-table \{[\s\S]*?overflow: auto;[\s\S]*?scrollbar-gutter: stable;/);
    expect(workspaceStyles).toMatch(/\.drive-file-row-head \{[\s\S]*?position: sticky;[\s\S]*?top: 0;/);
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
    expect(source).toContain('state.role === "admin" ? "" : " is-two-column"');
    expect(source).toContain("visibleFileRole(state.role, state.fileRoleView)");
    expect(workspaceStyles).toContain(".drive-file-role-tabs.is-two-column");
    expect(workspaceStyles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(source).toContain('role="tabpanel"');
    expect(source).toContain('role="columnheader"');
    expect(source).toContain('data-label="状态"');
    expect(source).toContain("替换专题方法论");
    expect(source).not.toContain(">上传周报<");
  });

  it("keeps a visual preflight shell and uses one background file refresh timer", () => {
    expect(source).not.toContain("root.replaceChildren()");
    expect(entryMarkup).toContain('class="drive-preflight-shell"');
    expect(entryMarkup).toContain("knowledge-network-light.png");
    expect(entryMarkup).not.toContain("<p>正在加载知识库...</p>");
    expect(source).toContain("window.clearTimeout(fileRefreshTimer)");
    expect(source).toContain("void loadFiles(true)");
    expect(source).not.toContain("!file.processing ||");
  });

  it("renders the three entry states without showing a success loader before authentication", () => {
    expect(source).toContain('data-entry-state="checking-session"');
    expect(source).toContain('data-entry-state="preparing-workspace"');
    expect(source).toContain('state.entryState = transitionEntryState(state.entryState, "login-failed")');
    expect(source).toContain('aria-describedby=${hasAuthError ? "drive-login-error" : nothing}');
    expect(source).toContain('state.accessCode = ""');
    expect(source).toContain("entryTimeoutMs");
    expect(source.indexOf('"login-succeeded"')).toBeLessThan(source.indexOf("await loadEntryOverview()"));
  });

  it("requires an exact typed name in an accessible destructive dialog", () => {
    expect(source).toContain('@awesome.me/webawesome/dist/components/dialog/dialog.js');
    expect(source).toContain("<wa-dialog");
    expect(source).toContain('name="deleteConfirmation"');
    expect(source).toContain("confirmation.input !== confirmation.targetName");
    expect(source).toContain("fileNameFromPath(path)");
    expect(source).toContain("confirmName: confirmation.input");
    expect(source).toContain("@wa-hide=${handleDeleteDialogHide}");
    expect(source).toContain("event.preventDefault()");
    expect(source).not.toContain("window.confirm");
    expect(stateSource).toContain('kind: "topic" | "file"');
    expect(stateSource).toContain("deleteConfirmation: DeleteConfirmation | null");
    expect(workspaceStyles).toContain(".drive-delete-warning");
    expect(workspaceStyles).toContain(".drive-delete-confirm-button");
  });
});
