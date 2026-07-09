import { describe, expect, it } from "vitest";
import { normalizeFileName, normalizeObjectPath, normalizePrefix, normalizeRelativeFilePath } from "../src/drive/paths";
import { parseListObjectsXml, parseObjectPathsXml } from "../src/drive/cos";
import { createSessionCookie, getDriveSession, verifyAccessCode, verifySessionCookie } from "../src/drive/session";
import {
  DRIVE_META_FILENAME,
  GENERATE_PROMPT_FILENAME,
  OUTPUTS_FOLDER_NAME,
  TOPIC_META_FILENAME,
  createAgentManifestPrompt,
  createTopic,
  createDefaultPrompts,
  hasSystemPathSegment,
  isAgentReadableFile,
  isAgentReadableFolder,
  mergeListMetadata,
  normalizeTopicPrefix,
  readTopic,
} from "../src/drive/topic";
import type { DriveConfig } from "../src/drive/config";
import type { DriveEnv } from "../src/drive/config";

const env: DriveEnv = {
  DRIVE_ACCESS_CODE: "open-sesame",
  DRIVE_SESSION_SECRET: "test-secret",
  DRIVE_SESSION_MAX_AGE_SECONDS: "60",
};

const testConfig: DriveConfig = {
  cosSecretId: "test-id",
  cosSecretKey: "test-key",
  bucket: "test-bucket",
  region: "ap-guangzhou",
  endpoint: "https://cos.example.com",
  rootPrefix: "cloud-drive/",
  maxFileBytes: 1024 * 1024,
  signExpiresSeconds: 900,
  sessionMaxAgeSeconds: 3600,
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

  it("parses raw object paths for recursive topic deletion", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <ListBucketResult>
        <Contents><Key>cloud-drive/topic/</Key><Size>0</Size></Contents>
        <Contents><Key>cloud-drive/topic/report.pdf</Key><Size>10</Size></Contents>
        <Contents><Key>cloud-drive/topic/._agent-manifests/current.json</Key><Size>20</Size></Contents>
        <NextContinuationToken>next-page</NextContinuationToken>
      </ListBucketResult>`;

    expect(parseObjectPathsXml(xml, "cloud-drive/")).toEqual({
      paths: ["topic/", "topic/report.pdf", "topic/._agent-manifests/current.json"],
      nextCursor: "next-page",
    });
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
  it("creates default output prompts with topic paths and upload callback", () => {
    const prompts = createDefaultPrompts({
      origin: "https://example.com",
      name: "新能源",
      prefix: "新能源/",
      description: "跟踪新能源行业。",
    });

    expect(GENERATE_PROMPT_FILENAME).toBe("成果生成与回传.prompt.md");
    expect(prompts.generatePrompt).toContain("新能源：成果生成与回传");
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
    expect(isAgentReadableFile("新能源/", { name: GENERATE_PROMPT_FILENAME, path: `新能源/${GENERATE_PROMPT_FILENAME}` })).toBe(false);
    expect(isAgentReadableFile("新能源/", { name: "summary.pdf", path: "新能源/outputs/summary.pdf" })).toBe(false);
    expect(isAgentReadableFile("新能源/", { name: "manifest.json", path: "新能源/._agent-manifests/manifest.json" })).toBe(false);
  });
});

describe("topic scaffolding", () => {
  it("creates a topic with only the output prompt file", async () => {
    await withMockCos([], async (storage) => {
      const detail = await createTopic(testConfig, {
        name: "新能源",
        description: "跟踪新能源行业。",
        displayName: "王小明",
        origin: "https://example.com",
      });

      expect(detail.generatePrompt).toContain("新能源/outputs/");
      expect(storage.has(`新能源/${GENERATE_PROMPT_FILENAME}`)).toBe(true);
      expect(storage.has(`新能源/${OUTPUTS_FOLDER_NAME}/`)).toBe(true);

      const rootMeta = JSON.parse(storage.get(`新能源/${DRIVE_META_FILENAME}`) || "{}");
      expect(rootMeta.files[GENERATE_PROMPT_FILENAME]).toMatchObject({ kind: "prompt", uploadedBy: "王小明" });
      expect(rootMeta.files[TOPIC_META_FILENAME]).toMatchObject({ kind: "topic", uploadedBy: "王小明" });
    });
  });

  it("repairs an incomplete topic with the output prompt file", async () => {
    await withMockCos([["半成品/report.pdf", "material"]], async (storage) => {
      const detail = await readTopic(testConfig, "半成品/", {
        displayName: "李小明",
        origin: "https://example.com",
      });

      expect(detail.topic).toMatchObject({
        name: "半成品",
        prefix: "半成品/",
        createdBy: "李小明",
      });
      expect(detail.generatePrompt).toContain("半成品/outputs/");
      expect(storage.get("半成品/report.pdf")).toBe("material");
      expect(storage.has(`半成品/${TOPIC_META_FILENAME}`)).toBe(true);
      expect(storage.has(`半成品/${GENERATE_PROMPT_FILENAME}`)).toBe(true);
      expect(storage.has(`半成品/${OUTPUTS_FOLDER_NAME}/`)).toBe(true);
      expect(storage.has(`半成品/${OUTPUTS_FOLDER_NAME}/${DRIVE_META_FILENAME}`)).toBe(true);
    });
  });

  it("preserves existing generate prompts while repairing missing topic pieces", async () => {
    const topic = {
      version: 1,
      name: "旧专题",
      prefix: "旧专题/",
      description: "已有说明",
      createdBy: "张三",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedBy: "张三",
      updatedAt: "2026-07-01T00:00:00.000Z",
    };

    await withMockCos(
      [
        [`旧专题/${TOPIC_META_FILENAME}`, JSON.stringify(topic)],
        [`旧专题/${GENERATE_PROMPT_FILENAME}`, "自定义生成提示词"],
      ],
      async (storage) => {
        const detail = await readTopic(testConfig, "旧专题/", {
          displayName: "李小明",
          origin: "https://example.com",
        });

        expect(detail.topic.description).toBe("已有说明");
        expect(detail.generatePrompt).toBe("自定义生成提示词");
        expect(storage.get(`旧专题/${GENERATE_PROMPT_FILENAME}`)).toBe("自定义生成提示词");
        expect(storage.has(`旧专题/${OUTPUTS_FOLDER_NAME}/`)).toBe(true);
      },
    );
  });
});

async function withMockCos(
  initialObjects: Array<[string, string]>,
  callback: (storage: Map<string, string>) => Promise<void>,
): Promise<void> {
  const storage = new Map(initialObjects);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);

    if (request.method === "GET" && url.searchParams.get("list-type") === "2") {
      return new Response(createListObjectsXml(storage, url.searchParams.get("prefix") || "", url.searchParams.get("delimiter")), {
        status: 200,
        headers: { "content-type": "application/xml" },
      });
    }

    const path = objectPathFromUrl(url);
    if (request.method === "GET") {
      return storage.has(path) ? new Response(storage.get(path), { status: 200 }) : new Response("", { status: 404 });
    }
    if (request.method === "PUT") {
      storage.set(path, await request.text());
      return new Response("", { status: 200 });
    }
    if (request.method === "DELETE") {
      storage.delete(path);
      return new Response("", { status: 204 });
    }

    return new Response("", { status: 405 });
  };

  try {
    await callback(storage);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function objectPathFromUrl(url: URL): string {
  const key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  return key.startsWith(testConfig.rootPrefix) ? key.slice(testConfig.rootPrefix.length) : key;
}

function createListObjectsXml(storage: Map<string, string>, fullPrefix: string, delimiter: string | null): string {
  const contents: string[] = [];
  const commonPrefixes = new Set<string>();

  for (const path of storage.keys()) {
    const key = `${testConfig.rootPrefix}${path}`;
    if (!key.startsWith(fullPrefix)) {
      continue;
    }

    const rest = key.slice(fullPrefix.length);
    if (delimiter === "/" && rest.includes("/")) {
      commonPrefixes.add(`${fullPrefix}${rest.slice(0, rest.indexOf("/") + 1)}`);
    } else {
      contents.push(key);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
    <ListBucketResult>
      ${contents.map((key) => `<Contents><Key>${escapeXml(key)}</Key><LastModified>2026-07-09T00:00:00.000Z</LastModified><ETag>"etag"</ETag><Size>${storage.get(key.slice(testConfig.rootPrefix.length))?.length || 0}</Size></Contents>`).join("")}
      ${Array.from(commonPrefixes).map((key) => `<CommonPrefixes><Prefix>${escapeXml(key)}</Prefix></CommonPrefixes>`).join("")}
    </ListBucketResult>`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
