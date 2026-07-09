import { describe, expect, it } from "vitest";
import { normalizeFileName, normalizeObjectPath, normalizePrefix, normalizeRelativeFilePath } from "../src/drive/paths";
import { parseListObjectsXml } from "../src/drive/cos";
import { createSessionCookie, getDriveSession, verifyAccessCode, verifySessionCookie } from "../src/drive/session";
import {
  GENERATE_PROMPT_FILENAME,
  READ_PROMPT_FILENAME,
  createAgentManifestPrompt,
  createDefaultPrompts,
  hasSystemPathSegment,
  isAgentReadableFile,
  isAgentReadableFolder,
  mergeListMetadata,
  normalizeTopicPrefix,
} from "../src/drive/topic";
import type { DriveEnv } from "../src/drive/config";

const env: DriveEnv = {
  DRIVE_ACCESS_CODE: "open-sesame",
  DRIVE_SESSION_SECRET: "test-secret",
  DRIVE_SESSION_MAX_AGE_SECONDS: "60",
};

describe("drive path validation", () => {
  it("normalizes prefixes and keeps a trailing slash", () => {
    expect(normalizePrefix(" reports/2026 ")).toBe("reports/2026/");
    expect(normalizePrefix("")).toBe("");
  });

  it("rejects path traversal and absolute paths", () => {
    expect(() => normalizePrefix("../secret")).toThrow();
    expect(() => normalizeObjectPath("/secret.txt")).toThrow();
    expect(() => normalizeFileName("nested/file.txt")).toThrow();
  });

  it("allows folder marker paths only when requested", () => {
    expect(() => normalizeObjectPath("reports/")).toThrow();
    expect(normalizeObjectPath("reports/", { allowTrailingSlash: true })).toBe("reports/");
  });

  it("accepts only root-level topic prefixes", () => {
    expect(normalizeTopicPrefix("新能源汽车/")).toBe("新能源汽车/");
    expect(() => normalizeTopicPrefix("行业/新能源/")).toThrow();
    expect(() => normalizeTopicPrefix("")).toThrow();
  });

  it("allows safe multi-level upload relative paths", () => {
    expect(normalizeRelativeFilePath(" 行业资料/子目录/current.pdf ")).toBe("行业资料/子目录/current.pdf");
    expect(normalizeRelativeFilePath("行业资料\\子目录\\current.pdf")).toBe("行业资料/子目录/current.pdf");
  });

  it("rejects unsafe upload relative paths", () => {
    expect(() => normalizeRelativeFilePath("../a.pdf")).toThrow();
    expect(() => normalizeRelativeFilePath("/a.pdf")).toThrow();
    expect(() => normalizeRelativeFilePath("a//b.pdf")).toThrow();
    expect(() => normalizeRelativeFilePath("a/")).toThrow();
    expect(() => normalizeRelativeFilePath("a/\u0000.pdf")).toThrow();
    expect(hasSystemPathSegment("a/._drive-meta.json")).toBe(true);
  });
});

describe("COS list XML parser", () => {
  it("parses folders, files, sizes, and continuation tokens", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <ListBucketResult>
        <Contents>
          <Key>cloud-drive/reports/current.pdf</Key>
          <LastModified>2026-07-08T08:00:00.000Z</LastModified>
          <ETag>"abc"</ETag>
          <Size>2048</Size>
        </Contents>
        <Contents>
          <Key>cloud-drive/reports/</Key>
          <LastModified>2026-07-08T08:00:00.000Z</LastModified>
          <Size>0</Size>
        </Contents>
        <Contents>
          <Key>cloud-drive/reports/._drive-meta.json</Key>
          <LastModified>2026-07-08T08:00:00.000Z</LastModified>
          <Size>100</Size>
        </Contents>
        <CommonPrefixes>
          <Prefix>cloud-drive/reports/archive/</Prefix>
        </CommonPrefixes>
        <CommonPrefixes>
          <Prefix>cloud-drive/reports/._agent-manifests/</Prefix>
        </CommonPrefixes>
        <NextContinuationToken>next-page</NextContinuationToken>
      </ListBucketResult>`;

    const result = parseListObjectsXml(xml, "cloud-drive/", "reports/");

    expect(result.folders).toEqual([{ name: "archive", path: "reports/archive/" }]);
    expect(result.files).toEqual([
      {
        name: "current.pdf",
        path: "reports/current.pdf",
        size: 2048,
        lastModified: "2026-07-08T08:00:00.000Z",
        etag: "abc",
      },
    ]);
    expect(result.nextCursor).toBe("next-page");
  });

  it("merges directory metadata into listed files", () => {
    const result = mergeListMetadata(
      {
        prefix: "reports/",
        folders: [],
        files: [
          {
            name: "current.pdf",
            path: "reports/current.pdf",
            size: 2048,
            lastModified: "2026-07-08T08:00:00.000Z",
            etag: "abc",
          },
        ],
        nextCursor: null,
      },
      {
        version: 1,
        files: {
          "current.pdf": {
            uploadedBy: "王小明",
            uploadedAt: "2026-07-08T08:01:00.000Z",
            contentType: "application/pdf",
            size: 2048,
            kind: "output",
          },
        },
      },
    );

    expect(result.files[0]).toMatchObject({
      uploadedBy: "王小明",
      contentType: "application/pdf",
      kind: "output",
    });
  });
});

describe("drive sessions", () => {
  it("creates and verifies a signed session cookie", async () => {
    const cookie = await createSessionCookie(env, "http://127.0.0.1:8788/drive.html", "王小明");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Max-Age=60");
    await expect(verifySessionCookie(env, cookie)).resolves.toBe(true);
    await expect(getDriveSession(env, cookie)).resolves.toMatchObject({ displayName: "王小明" });
  });

  it("rejects tampered cookies and wrong access codes", async () => {
    const cookie = await createSessionCookie(env, "http://127.0.0.1:8788/drive.html", "王小明");
    const tampered = cookie.replace(/jhss_drive_session=([^.;]+)\./, "jhss_drive_session=$1x.");
    await expect(verifySessionCookie(env, tampered)).resolves.toBe(false);
    await expect(verifyAccessCode(env, "wrong")).resolves.toBe(false);
    await expect(verifyAccessCode(env, "open-sesame")).resolves.toBe(true);
    await expect(verifyAccessCode(env, " open-sesame\n")).resolves.toBe(true);
  });
});

describe("topic prompts", () => {
  it("creates default prompts with topic paths and upload callback", () => {
    const prompts = createDefaultPrompts({
      origin: "https://example.com",
      name: "新能源",
      prefix: "新能源/",
      description: "跟踪新能源行业。",
    });

    expect(prompts.readPrompt).toContain("新能源/");
    expect(prompts.readPrompt).toContain("获取 agent 分析提示词");
    expect(prompts.readPrompt).toContain("不需要登录");
    expect(prompts.readPrompt).toContain("manifest JSON");
    expect(prompts.generatePrompt).toContain("新能源/outputs/");
    expect(prompts.generatePrompt).toContain("/api/drive/upload-complete");
  });

  it("creates an agent prompt with one manifest link", () => {
    const prompt = createAgentManifestPrompt({
      topic: {
        name: "新能源",
        prefix: "新能源/",
        description: "跟踪新能源行业。",
      },
      generatedAt: "2026-07-09T01:00:00.000Z",
      expiresAt: "2026-07-09T01:15:00.000Z",
      expiresIn: 900,
      fileCount: 3,
      manifestUrl: "https://cos.example.com/manifest.json?X-Amz-Signature=abc",
    });

    expect(prompt).toContain("https://cos.example.com/manifest.json?X-Amz-Signature=abc");
    expect(prompt).toContain("不需要登录");
    expect(prompt).toContain("资料数量：3");
    expect(prompt).not.toContain("/api/drive/download-url");
  });

  it("filters agent-readable files and folders", () => {
    expect(isAgentReadableFolder("新能源/", "新能源/reports/")).toBe(true);
    expect(isAgentReadableFolder("新能源/", "新能源/outputs/")).toBe(false);
    expect(isAgentReadableFolder("新能源/", "新能源/._agent-manifests/")).toBe(false);
    expect(isAgentReadableFile("新能源/", { name: "report.pdf", path: "新能源/reports/report.pdf" })).toBe(true);
    expect(isAgentReadableFile("新能源/", { name: READ_PROMPT_FILENAME, path: `新能源/${READ_PROMPT_FILENAME}` })).toBe(false);
    expect(isAgentReadableFile("新能源/", { name: GENERATE_PROMPT_FILENAME, path: `新能源/${GENERATE_PROMPT_FILENAME}` })).toBe(false);
    expect(isAgentReadableFile("新能源/", { name: "summary.pdf", path: "新能源/outputs/summary.pdf" })).toBe(false);
    expect(isAgentReadableFile("新能源/", { name: "manifest.json", path: "新能源/._agent-manifests/manifest.json" })).toBe(false);
  });
});
