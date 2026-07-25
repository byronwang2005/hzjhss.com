import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { transitionEntryState } from "../src/drive/client/entry-flow";
import { directoryPrefix, FILE_ROLE_PRESENTATION, fileIconName, fileNameFromPath, filesForKnowledgeRole, formatBytes, methodologyDisplayName, normalizeClientRelativePath, processingDisplay, visibleFileRole, visibleFileRoles } from "../src/drive/client/utils";
import type { KnowledgeFile } from "../src/drive/shared/contracts";
import { advanceFileTask, batchCounts, createUploadBatch, elapsedLabel, fileTaskPercent, reconcileUploadBatch, stepState, taskSteps } from "../src/drive/client/file-progress";
import { processUploadBatches, splitUploadBatches, UPLOAD_REGISTRATION_BATCH_SIZE } from "../src/drive/client/upload-batches";

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
    expect(processingDisplay(file)).toMatchObject({ label: "未开始处理", stage: "failed", tone: "danger", retryable: true, poll: false });
    expect(processingDisplay({ ...file, processing: { state: "queued", sourceEtag: "etag", updatedAt: "2026-07-21T06:00:00.000Z" } }, Date.parse("2026-07-21T06:03:00.000Z"))).toMatchObject({ label: "处理未启动", stage: "failed", tone: "danger", retryable: true, poll: false });
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

describe("upload registration batches", () => {
  it.each([
    [0, []],
    [1, [[0]]],
    [5, [[0, 1, 2, 3, 4]]],
    [6, [[0, 1, 2, 3, 4], [5]]],
    [12, [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11]]],
  ])("splits %i files into batches of five", (count, expected) => {
    expect(splitUploadBatches(Array.from({ length: count }, (_, index) => index))).toEqual(expected);
  });

  it("rejects an invalid batch size", () => {
    expect(() => splitUploadBatches([1], 0)).toThrow("批次大小必须为正整数");
    expect(UPLOAD_REGISTRATION_BATCH_SIZE).toBe(5);
  });

  it("continues with later batches when one registration fails", async () => {
    const attempted: number[][] = [];
    const succeeded: number[][] = [];
    const failed: number[][] = [];
    const result = await processUploadBatches(
      [1, 2, 3, 4, 5, 6],
      async (batch) => {
        attempted.push(batch);
        if (batch[0] === 1) throw new Error("登记超时");
        return batch.join(",");
      },
      (_value, batch) => { succeeded.push(batch); },
      (_error, batch) => { failed.push(batch); },
    );
    expect(attempted).toEqual([[1, 2, 3, 4, 5], [6]]);
    expect(failed).toEqual([[1, 2, 3, 4, 5]]);
    expect(succeeded).toEqual([[6]]);
    expect(result).toEqual({ successfulBatches: 1, failedBatches: 1 });
  });
});

describe("file processing progress", () => {
  it("keeps file stages monotonic while allowing an explicit failed retry", () => {
    const batch = createUploadBatch("t_abcdefghijkl", "", "evidence", [
      { name: "weekly.pdf", relativePath: "weekly.pdf", size: 100 },
    ], 1_000);
    expect(advanceFileTask(batch, "weekly.pdf", "uploading", { bytesUploaded: 40, bytesTotal: 100 }, 2_000)).toBe(true);
    expect(fileTaskPercent(batch.items[0])).toBe(40);
    expect(advanceFileTask(batch, "weekly.pdf", "validating", {}, 3_000)).toBe(false);
    expect(batch.items[0].stage).toBe("uploading");
    expect(advanceFileTask(batch, "weekly.pdf", "failed", { error: "上传未完成" }, 4_000)).toBe(true);
    expect(batch.items[0].failedStage).toBe("uploading");
    expect(stepState("failed", "uploading", batch.items[0].failedStage)).toBe("failed");
    expect(advanceFileTask(batch, "weekly.pdf", "queued", {}, 5_000)).toBe(true);
    expect(batch.items[0].stage).toBe("queued");
  });

  it("reconciles registered files with persisted processing states", () => {
    const batch = createUploadBatch("t_abcdefghijkl", "", "evidence", [
      { name: "weekly.pdf", relativePath: "weekly.pdf", size: 100 },
    ], 1_000);
    advanceFileTask(batch, "weekly.pdf", "registering", { sourceEtag: "etag-new" }, 2_000);
    reconcileUploadBatch(batch, "t_abcdefghijkl", {
      prefix: "",
      folders: [],
      nextCursor: null,
      files: [{
        name: "weekly.pdf",
        path: "weekly.pdf",
        relativePath: "weekly.pdf",
        size: 100,
        lastModified: "2026-07-25T00:00:00.000Z",
        etag: "etag-old",
        knowledgeRole: "evidence",
        processing: { state: "ready", sourceEtag: "etag-old", updatedAt: "2026-07-25T00:00:10.000Z" },
      }],
    }, Date.parse("2026-07-25T00:00:10.000Z"));
    expect(batch.items[0].stage).toBe("registering");
    reconcileUploadBatch(batch, "t_abcdefghijkl", {
      prefix: "",
      folders: [],
      nextCursor: null,
      files: [{
        name: "weekly.pdf",
        path: "weekly.pdf",
        relativePath: "weekly.pdf",
        size: 100,
        lastModified: "2026-07-25T00:00:00.000Z",
        etag: "etag-new",
        knowledgeRole: "evidence",
        processing: { state: "ready", sourceEtag: "etag-new", updatedAt: "2026-07-25T00:00:10.000Z" },
      }],
    }, Date.parse("2026-07-25T00:00:10.000Z"));
    expect(batch.items[0]).toMatchObject({ stage: "ready", state: "complete" });
    expect(batchCounts(batch)).toEqual({ complete: 1, failed: 0, active: 0 });
    expect(batch.expanded).toBe(false);
  });

  it("uses role-specific tracks and only exposes elapsed time after three seconds", () => {
    expect(taskSteps("reference").map((step) => step.label)).toEqual(["校验", "上传", "登记", "归档"]);
    expect(taskSteps("evidence").map((step) => step.label)).toEqual(["校验", "上传", "登记", "解析内容", "更新索引", "可问答"]);
    expect(elapsedLabel(1_000, undefined, 3_999)).toBe("");
    expect(elapsedLabel(1_000, undefined, 4_500)).toBe("3.5 秒");
  });
});

describe("knowledge client surface", () => {
  const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
  const stateSource = readFileSync(new URL("../src/drive/client/state.ts", import.meta.url), "utf8");
  const workspaceStyles = readFileSync(new URL("../src/drive/client/styles/workspace.css", import.meta.url), "utf8");
  const fileStyles = readFileSync(new URL("../src/drive/client/styles/files.css", import.meta.url), "utf8");
  const motionStyles = readFileSync(new URL("../src/drive/client/styles/motion.css", import.meta.url), "utf8");
  const uploadPolicy = readFileSync(new URL("../src/drive/client/upload-policy.ts", import.meta.url), "utf8");
  const sharedPolicy = readFileSync(new URL("../src/drive/shared/policy.ts", import.meta.url), "utf8");
  const entryMarkup = readFileSync(new URL("../src/site/pages/index.html", import.meta.url), "utf8");

  it("keeps only Q&A and administrator file management", () => {
    expect(source).toContain('scope="global"');
    expect(source).toContain(".displayName=${state.displayName}");
    expect(source).toContain('scope="topic"');
    expect(source).toContain('state.role === "admin"');
    expect(source).not.toContain("Agent");
    expect(source).not.toContain("成果");
    expect(source).not.toContain("Context");
    expect(source).not.toContain("owner");
  });

  it("keeps the overview compact and exposes topic creation only to administrators", () => {
    expect(source).not.toContain('<span class="drive-eyebrow">知识工作台</span>');
    expect(source).not.toContain("从全部资料中提问，快速获得带来源的可靠答案。");
    expect(source).toContain('class="drive-scope-rail"');
    expect(source).toContain('state.role === "admin"');
    expect(source).toContain('data-action="create-topic"');
    expect(stateSource).not.toContain('"create"');
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

  it("validates supported formats, PDF pages and observable file progress", () => {
    expect(sharedPolicy).toContain('"png", "jpg", "jpeg", "bmp"');
    expect(sharedPolicy).toContain('"pdf", "doc", "docx", "ppt", "pptx"');
    expect(uploadPolicy).toContain("document.numPages > FILE_LIMITS.pdfPages");
    expect(source).toContain('uppy.on("upload-progress"');
    expect(source).toContain("createUploadBatch");
    expect(source).toContain("renderFileProcessingCenter");
    expect(source).toContain('aria-label="批次处理阶段"');
    expect(source).toContain('api<UploadCompleteResponse>("/upload-complete"');
    expect(source).toContain("registration.failures");
  });

  it("renders role tabs, contextual uploads and accessible table cells", () => {
    expect(source).toContain('data-action="file-role-view"');
    expect(source).toContain('state.role === "admin" ? "" : " is-two-column"');
    expect(source).toContain("visibleFileRole(state.role, state.fileRoleView)");
    expect(workspaceStyles).toContain(".drive-file-role-tabs.is-two-column");
    expect(workspaceStyles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(source).toContain('role="tabpanel"');
    expect(source).toContain('role="columnheader"');
    expect(source).toContain('data-label="处理状态"');
    expect(source).toContain("替换专题方法论");
    expect(source).toContain('data-action="pick-reference-folder"');
    expect(source).toContain("file.webkitRelativePath || file.name");
    expect(source).toContain("data-reference-folder-input");
    expect(source).toContain("webkitdirectory");
    expect(source).toContain('data-action="toggle-folder-incorporated"');
    expect(source).toContain("pendingFolderIncorporationPath");
    expect(source).toContain('api<FolderIncorporationResult>("/folder"');
    expect(source).not.toContain(">上传周报<");
    expect(source).not.toContain("drive-file-role-badge");
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

  it("cancels stale file listings, keeps refreshes in place and exposes real progress accessibly", () => {
    expect(source).toContain("fileLoadAbortController?.abort()");
    expect(source).toContain("++fileLoadRequestId");
    expect(source).toContain("fileLoadIsCurrent(requestId, topicId, prefix)");
    expect(source).toContain('mode: background ? "background" : state.listing ? "refresh" : "initial"');
    expect(source).toContain('aria-current=${stepState === "active" ? "step" : nothing}');
    expect(source).toContain('aria-live=${load.mode === "background" ? "off" : "polite"}');
    expect(source).toContain("COS 响应较慢，仍在继续读取");
    expect(fileStyles).toContain(".drive-file-sync-strip.is-slow");
  });

  it("keeps account and destructive actions contextual instead of placing them in the global toolbar", () => {
    expect(source).toContain('<wa-dropdown class="drive-account-menu"');
    expect(source).toContain('<wa-dropdown-item value="logout"');
    expect(source).not.toContain('data-action="refresh"');
    expect(source).toContain('class="drive-topic-delete"');
    expect(source).toContain('data-action="edit-report-date"');
    expect(source).not.toContain("window.prompt");
    expect(fileStyles).toContain(".drive-row-action-menu");
  });

  it("limits page-level motion to explicit workspace navigation", () => {
    expect(source).toContain('runWorkspaceTransition("scope-forward"');
    expect(source).toContain('runWorkspaceTransition("scope-back"');
    expect(source).toContain('runWorkspaceTransition("topic-panel"');
    expect(source).toContain('runWorkspaceTransition("file-role"');
    expect(source.match(/runWorkspaceTransition\(/g)).toHaveLength(4);
    const loadFilesSource = source.slice(source.indexOf("async function loadFiles"), source.indexOf("function fileLoadIsCurrent"));
    expect(loadFilesSource).not.toContain("runWorkspaceTransition");
    expect(source.match(/class="drive-scope-track-indicator"/g)).toHaveLength(1);
    expect(source).not.toContain("drive-scope-active-indicator");
    expect(source).toContain("syncScopeIndicator(false)");
    expect(source).toContain("--drive-scope-indicator-x");
    expect(motionStyles).toContain(".drive-scope-list > :not(.drive-scope-track-indicator)");
    expect(motionStyles).toContain("transform var(--jh-duration-medium) var(--jh-motion-ios)");
    expect(motionStyles).not.toContain("view-transition-name: drive-scope-active");
    expect(motionStyles).toContain(":root {\n  view-transition-name: none;");
    expect(motionStyles).not.toContain("::view-transition-old(root)");
    expect(motionStyles).not.toContain("::view-transition-new(root)");
    expect(source).toContain('class="drive-tab-active-indicator"');
    expect(source).toContain('class="drive-file-role-active-indicator"');
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
