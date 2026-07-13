import { describe, expect, it } from "vitest";
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
  it("opens topics on Agent and orders Agent before materials and outputs", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    expect(source).toContain('activeTab: "agent"');
    expect(source).toContain('openTopic(prefix: string, tab: TopicTab = "agent")');

    const agentTab = source.indexOf('tabButton("agent", "Agent"');
    const materialsTab = source.indexOf('tabButton("materials", "资料"');
    const outputsTab = source.indexOf('tabButton("outputs", "成果"');
    expect(agentTab).toBeGreaterThan(-1);
    expect(agentTab).toBeLessThan(materialsTab);
    expect(materialsTab).toBeLessThan(outputsTab);
  });

  it("only renders settings for topic managers and falls back after permission loss", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    expect(source).toContain('canViewSettings() ? tabButton("settings", "设置"');
    expect(source).toContain('state.activeTab === "settings" && canViewSettings() ? renderSettingsTab()');
    expect(source).toContain('if (tab === "settings" && !canViewSettings())');
    expect(source).toContain('if (!canViewSettings()) {\n      state.activeTab = "agent";');
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

  it("collects a one-time first-stage question and clears it only after a successful copy", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    expect(source).toContain("您想了解什么？（留空将以推荐口径分析）");
    expect(source).toContain("例如：最新周报信息、库存情况......");
    expect(source).toContain('body: { prefix: state.topic.topic.prefix, userQuestion: state.drafts.agentQuestion }');

    const requestIndex = source.indexOf('body: { prefix: state.topic.topic.prefix, userQuestion: state.drafts.agentQuestion }');
    const clearIndex = source.indexOf('state.drafts.agentQuestion = "";', requestIndex);
    const successIndex = source.indexOf("分析提示词已复制", requestIndex);
    const catchIndex = source.indexOf("} catch (error) {", requestIndex);
    expect(clearIndex).toBeGreaterThan(requestIndex);
    expect(clearIndex).toBeLessThan(successIndex);
    expect(clearIndex).toBeLessThan(catchIndex);
    expect(source.slice(catchIndex, source.indexOf("} finally {", catchIndex))).not.toContain('state.drafts.agentQuestion = "";');
  });

  it("uses the same copy icon for both Agent prompt buttons", () => {
    const source = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
    expect(source.match(/renderDriveIcon\("clipboard-text", "bold"\)/g)).toHaveLength(2);
    expect(source).not.toContain('renderDriveIcon("file-arrow-up"');
  });
});
