import Uppy from "@uppy/core";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  isMaterialDirectoryEmpty,
  previewKindForFile,
  shouldRefreshAfterMutation,
  sortFilesByFreshness,
  visibleMaterialFiles,
} from "../src/drive/client/utils";
import type { DriveFile, DriveFolder } from "../src/drive/client/types";

describe("drive client preview policy", () => {
  it("detects station-previewable delivery files", () => {
    expect(previewKindForFile({ name: "report.pdf", contentType: "application/pdf" })).toBe("pdf");
    expect(previewKindForFile({ name: "index.html", contentType: "text/html" })).toBe("html");
    expect(previewKindForFile({ name: "summary.md", contentType: "text/markdown" })).toBe("markdown");
    expect(previewKindForFile({ name: "notes.txt", contentType: "text/plain" })).toBe("text");
    expect(previewKindForFile({ name: "model.xlsx" })).toBe("none");
  });
});

describe("drive client file shaping", () => {
  it("hides generated prompt files from material lists", () => {
    const files = [
      { name: "成果生成与回传.prompt.md", path: "新能源/成果生成与回传.prompt.md", size: 1, lastModified: "2026-07-09T00:00:00.000Z" },
      { name: "report.pdf", path: "新能源/report.pdf", size: 1, lastModified: "2026-07-09T00:00:00.000Z" },
    ] satisfies DriveFile[];

    expect(visibleMaterialFiles(files).map((file) => file.name)).toEqual(["report.pdf"]);
  });

  it("sorts files by upload freshness before file name", () => {
    const files = [
      { name: "b.md", path: "topic/outputs/b.md", size: 1, lastModified: "2026-07-08T00:00:00.000Z" },
      {
        name: "a.md",
        path: "topic/outputs/a.md",
        size: 1,
        lastModified: "2026-07-07T00:00:00.000Z",
        uploadedAt: "2026-07-09T00:00:00.000Z",
      },
    ] satisfies DriveFile[];

    expect(sortFilesByFreshness(files).map((file) => file.name)).toEqual(["a.md", "b.md"]);
  });

  it("treats a directory containing only folders as non-empty", () => {
    const folders = [{ name: "archive", path: "新能源/archive/" }] satisfies DriveFolder[];

    expect(isMaterialDirectoryEmpty(folders, [])).toBe(false);
  });

  it("detects empty and populated material directories after hidden entries are removed", () => {
    const file = { name: "report.pdf", path: "新能源/report.pdf", size: 1, lastModified: "2026-07-09T00:00:00.000Z" } satisfies DriveFile;
    const folder = { name: "archive", path: "新能源/archive/" } satisfies DriveFolder;
    const hiddenFile = { ...file, name: "成果生成与回传.prompt.md", path: "新能源/成果生成与回传.prompt.md" };
    const hiddenFolder = { name: "outputs", path: "新能源/outputs/" } satisfies DriveFolder;

    expect(isMaterialDirectoryEmpty([], [])).toBe(true);
    expect(isMaterialDirectoryEmpty([], [file])).toBe(false);
    expect(isMaterialDirectoryEmpty([folder], [file])).toBe(false);
    expect(isMaterialDirectoryEmpty([hiddenFolder], [hiddenFile])).toBe(true);
  });
});

describe("drive client state refresh policy", () => {
  it("refreshes topic details for output mutations and directory listings for material mutations", () => {
    expect(shouldRefreshAfterMutation("outputs", "新能源/outputs/summary.md", "新能源/")).toBe("topic");
    expect(shouldRefreshAfterMutation("materials", "新能源/reports/a.pdf", "新能源/")).toBe("directory");
    expect(shouldRefreshAfterMutation("materials", "其他/a.pdf", "新能源/")).toBe("overview");
  });
});

describe("drive client upload progress", () => {
  it("shows the shared upload reminder before opening file and folder pickers", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");

    expect(source).toContain('data-action="request-file-upload"');
    expect(source).toContain('data-action="request-folder-upload"');
    expect(source).toContain('openUploadReminder("file")');
    expect(source).toContain('openUploadReminder("folder")');
    expect(source).toContain('data-upload-reminder-dialog open label="上传提示"');
    expect(source).toContain("如需上传大量文件，建议分多次上传，以提高上传成功率并便于确认进度。");
    expect(source).toContain('data-action="cancel-upload"');
    expect(source).toContain('data-action="continue-upload"');
    expect(source).toContain('kind === "file" ? "[data-file-input]" : "[data-folder-input]"');
  });

  it("clears the pending upload selection when the reminder is dismissed", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");

    expect(source).toContain('target.matches("[data-upload-reminder-dialog]")');
    expect(source).toContain('state.pendingUploadSelection = null;');
    expect(source).toContain('action === "cancel-upload"');
  });

  it("uses Uppy progress weighted by uploaded bytes across differently sized files", async () => {
    vi.useFakeTimers();
    const uppy = new Uppy();

    try {
      uppy.addFile({ name: "small.bin", type: "application/octet-stream", data: new Blob([new Uint8Array(100)]) });
      uppy.addFile({ name: "large.bin", type: "application/octet-stream", data: new Blob([new Uint8Array(300)]) });
      const [smallFile, largeFile] = uppy.getFiles();
      const overallProgress: number[] = [];
      uppy.on("progress", (percent) => overallProgress.push(percent));
      uppy.emit("upload-start", [smallFile, largeFile]);

      uppy.emit("upload-progress", uppy.getFile(largeFile.id), { uploadStarted: Date.now(), bytesUploaded: 0, bytesTotal: 300 });
      uppy.emit("upload-progress", uppy.getFile(smallFile.id), { uploadStarted: Date.now(), bytesUploaded: 50, bytesTotal: 100 });
      await vi.advanceTimersByTimeAsync(500);

      expect(overallProgress.at(-1)).toBe(13);

      uppy.emit("upload-progress", uppy.getFile(largeFile.id), { uploadStarted: Date.now(), bytesUploaded: 150, bytesTotal: 300 });
      await vi.advanceTimersByTimeAsync(500);

      expect(overallProgress.at(-1)).toBe(50);
    } finally {
      uppy.destroy();
      vi.useRealTimers();
    }
  });

  it("tracks Uppy byte-weighted overall progress separately from the current file", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");

    expect(source).toContain('uppy.on("upload-progress", (file, progress) =>');
    expect(source).toContain('uppy.on("progress", (overallPercent) =>');
    expect(source).toContain("state.upload = { ...state.upload, overallPercent };");
    expect(source).toContain("overallPercent: 0");
  });

  it("shows overall progress only for multi-file uploads and labels both progress bars", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");

    expect(source).toContain("state.upload.total > 1");
    expect(source).toContain('aria-label="当前文件上传进度"');
    expect(source).toContain('aria-label="总体上传进度"');
    expect(source).toContain("${state.upload.overallPercent}% · ${state.upload.total} 个文件");
  });

  it("clears current and overall upload progress after success or failure", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    const reset = 'state.upload = { active: false, name: "", percent: 0, overallPercent: 0, total: 0 };';

    expect(source.match(new RegExp(reset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))).toHaveLength(2);
  });
});

describe("drive client responsibility labels", () => {
  it("distinguishes output creators from topic owners while keeping material uploaders", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    expect(source).toContain("成果创建者 ${output.uploadedBy");
    expect(source).toContain("专题负责人 ${topic.owner");
    expect(source).toContain('<span>成果创建者</span><span>更新</span>');
    expect(source).toContain('<span>上传者</span><span>更新</span>');
    expect(source).not.toContain("专题创建者");
  });
});

describe("drive client topic navigation", () => {
  it("opens topics on Q&A and keeps Agent owner-only", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    expect(source).toContain('activeTab: "qa"');
    expect(source).toContain('openTopic(prefix: string, tab: TopicTab = "qa")');

    const qaTab = source.indexOf('tabButton("qa", "问答"');
    const agentTab = source.indexOf('tabButton("agent", "Agent"');
    const materialsTab = source.indexOf('tabButton("materials", "资料"');
    const outputsTab = source.indexOf('tabButton("outputs", "成果"');
    expect(qaTab).toBeGreaterThan(-1);
    expect(agentTab).toBeGreaterThan(-1);
    expect(qaTab).toBeLessThan(materialsTab);
    expect(materialsTab).toBeLessThan(outputsTab);
    expect(source).toContain('state.topic.canGenerateContext ? tabButton("agent", "Agent"');
  });

  it("only renders settings for topic managers and falls back after permission loss", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    expect(source).toContain('canViewSettings() ? tabButton("settings", "设置"');
    expect(source).toContain('state.activeTab === "settings" && canViewSettings() ? renderSettingsTab()');
    expect(source).toContain('if (tab === "settings" && !canViewSettings())');
    expect(source).toContain('if (!canViewSettings()) {\n      state.activeTab = "qa";');
  });

  it("uses an in-app confirmation dialog when publishing analysis settings", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    expect(source).toContain('data-settings-confirm-dialog open label="确认发布分析口径"');
    expect(source).toContain('data-action="confirm-settings-publish"');
    expect(source).not.toContain("强提醒：");
    expect(source).not.toContain('window.confirm("修改后的分析口径');
  });

  it("labels the global analysis scope and provides methodology guidance", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    expect(source.match(/全局分析口径（他人不可修改）/g)).toHaveLength(2);
    expect(source).toContain("应尽可能详细说明分析该专题的方法论");
    expect(source).not.toContain("事实与推断须分开标注");
    expect(source).not.toContain("反向证据、敏感变量、潜在偏差和待核验事项");
  });

  it("uses one owner prompt without a one-time question or stage split", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    expect(source).toContain('api<{ prompt: string; fileCount: number; uploadExpiresIn: number }>("/agent-context-task"');
    expect(source).toContain("复制完整 Context 任务");
    expect(source).not.toContain("您想了解什么？");
    expect(source).not.toContain("第一阶段提示词");
    expect(source).not.toContain("第二阶段提示词");
    expect(source).not.toContain("userQuestion");
  });

  it("supports streaming Q&A controls and safe Markdown rendering", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    expect(source).toContain('fetch(`${apiBase}/qa`');
    expect(source).toContain('data-action="qa-stop"');
    expect(source).toContain('data-action="qa-clear"');
    expect(source).toContain('data-action="qa-retry"');
    expect(source).toContain("DOMPurify.sanitize(markdown.render(message.content))");
    expect(source).toContain("completed.slice(-12)");
  });
});
