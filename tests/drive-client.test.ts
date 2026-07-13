import { describe, expect, it } from "vitest";
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
