import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { normalizeFileName, normalizeObjectPath, normalizePrefix, normalizeRelativeFilePath } from "../src/drive/paths";
import { parseListObjectsXml, parseObjectPathsXml, presignObjectUrl } from "../src/drive/cos";
import { toDriveOverviewApiResponse, toTopicDetailApiResponse } from "../src/drive/api-responses";
import {
  createAgentOutputToken,
  createSessionCookie,
  getAgentOutputCapability,
  getDriveSession,
  isDriveAdmin,
  allowsAgentOutputPath,
  verifyAccessCode,
  verifySessionCookie,
} from "../src/drive/session";
import {
  DRIVE_META_FILENAME,
  GENERATE_PROMPT_FILENAME,
  MATERIALS_FOLDER_NAME,
  OUTPUTS_FOLDER_NAME,
  TOPIC_META_FILENAME,
  WEEKLY_FOLDER_NAME,
  assertAllowedMaterialPath,
  assertExistingTopicMaterialPath,
  createAgentContextPrompt,
  createAgentOutputPath,
  createTopic,
  deleteTopic,
  hasSystemPathSegment,
  isAgentReadableFile,
  isAgentReadableFolder,
  isPreviewableOutput,
  mergeListMetadata,
  normalizeTopicPrefix,
  readDriveOverview,
  readTopic,
  removeFileMetadata,
  recordUploadsComplete,
  transferTopicOwner,
  updateTopic,
} from "../src/drive/topic";
import { DRIVE_USERS_FILENAME, listDriveUserCandidates, registerDriveUser, removeDriveUserCandidate } from "../src/drive/users";
import { getDriveConfig, type DriveConfig } from "../src/drive/config";
import type { DriveEnv } from "../src/drive/config";
import { onRequestPost as createAgentUploadUrl } from "../functions/api/drive/agent-output-upload-url";
import { onRequestPost as completeAgentUpload } from "../functions/api/drive/agent-output-upload-complete";
import { onRequestPost as createAgentContextTask } from "../functions/api/drive/agent-context-task";
import { onRequestPost as loginToDrive } from "../functions/api/drive/login";
import { onRequestDelete as deleteOwnerCandidate } from "../functions/api/drive/owner-candidates";

const env: DriveEnv = {
  DRIVE_ACCESS_CODE: "open-sesame",
  DRIVE_SESSION_SECRET: "test-secret",
  DRIVE_SESSION_MAX_AGE_SECONDS: "60",
};

const apiEnv: DriveEnv = {
  ...env,
  COS_SECRET_ID: "test-id",
  COS_SECRET_KEY: "test-key",
  COS_BUCKET: "test-bucket",
  COS_REGION: "ap-guangzhou",
  COS_ENDPOINT: "https://cos.example.com",
  DRIVE_ROOT_PREFIX: "cloud-drive/",
  DRIVE_MAX_FILE_MB: "1",
  DRIVE_SIGN_EXPIRES_SECONDS: "900",
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

describe("drive configuration", () => {
  it("recognizes 汪旭 as the drive administrator", () => {
    expect(isDriveAdmin("汪旭")).toBe(true);
    expect(isDriveAdmin("王小明")).toBe(false);
  });

  it("fixes all presigned upload and download URLs at 30 minutes", async () => {
    const config = getDriveConfig({ ...apiEnv, DRIVE_SIGN_EXPIRES_SECONDS: "30" });
    expect(config.signExpiresSeconds).toBe(1800);
    expect(getDriveConfig({ ...apiEnv, DRIVE_SIGN_EXPIRES_SECONDS: "3600" }).signExpiresSeconds).toBe(1800);

    const [downloadUrl, uploadUrl] = await Promise.all([
      presignObjectUrl(config, "GET", "新能源/report.pdf"),
      presignObjectUrl(config, "PUT", "新能源/outputs/report.pdf", { "content-type": "application/pdf" }),
    ]);
    expect(new URL(downloadUrl).searchParams.get("X-Amz-Expires")).toBe("1800");
    expect(new URL(uploadUrl).searchParams.get("X-Amz-Expires")).toBe("1800");
  });
});

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

  it("creates a path-scoped agent output capability", async () => {
    const allowedPaths = ["新能源/outputs/report.pdf"];
    const result = await createAgentOutputToken(env, {
      displayName: "王小明",
      topicPrefix: "新能源/",
      topicInstanceId: "topicinstance1",
      allowedPaths,
    });
    const capability = await getAgentOutputCapability(env, `Bearer ${result.token}`);

    expect(result.expiresIn).toBe(3600);
    expect(capability).toMatchObject({ displayName: "王小明", topicPrefix: "新能源/", allowedPaths });
    expect(allowsAgentOutputPath(capability!, allowedPaths[0])).toBe(true);
    expect(allowsAgentOutputPath(capability!, "新能源/outputs/report.html")).toBe(false);
    expect(allowsAgentOutputPath(capability!, "其他/outputs/report.pdf")).toBe(false);
    await expect(getAgentOutputCapability(env, `Bearer ${result.token}x`)).resolves.toBeNull();
    await expect(getAgentOutputCapability(env, null)).resolves.toBeNull();
    await expect(getDriveSession(env, `jhss_drive_session=${result.token}`)).resolves.toBeNull();
  });

  it("rejects expired agent output capabilities", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-07-10T00:00:00.000Z"));
      const result = await createAgentOutputToken(env, {
        displayName: "王小明",
        topicPrefix: "新能源/",
        topicInstanceId: "topicinstance1",
        allowedPaths: ["新能源/outputs/report.pdf"],
      });
      vi.setSystemTime(new Date("2026-07-10T01:00:01.000Z"));
      await expect(getAgentOutputCapability(env, `Bearer ${result.token}`)).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("registers the normalized display name after a successful login", async () => {
    await withMockCos([], async (storage) => {
      const response = await loginToDrive({
        request: new Request("https://example.com/api/drive/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ displayName: " 王小明 ", accessCode: "open-sesame" }),
        }),
        env: apiEnv,
      } as any);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ ok: true, displayName: "王小明" });
      expect(JSON.parse(storage.get(DRIVE_USERS_FILENAME) || "{}").users["王小明"]).toBeDefined();
    });
  });
});

describe("topic prompts", () => {
  it("creates Beijing-time Markdown Context paths with millisecond precision", () => {
    expect(createAgentOutputPath({ name: "新能源", prefix: "新能源/" }, new Date("2026-07-09T16:00:00.007Z"))).toBe(
      "新能源/outputs/新能源-context-20260710-000000007.md",
    );

    const topicName = "超".repeat(180);
    const path = createAgentOutputPath({ name: topicName, prefix: `${topicName}/` }, new Date("2026-07-09T01:23:00.123Z"));
    const fileName = path.slice(path.lastIndexOf("/") + 1);
    expect(fileName).toHaveLength(180);
    expect(fileName).toMatch(/-context-20260709-092300123\.md$/);
  });

  it("creates one complete methodology prompt with manifest and Markdown callback", () => {
    const prompt = createAgentContextPrompt({
      topic: {
        name: "新能源",
        prefix: "新能源/",
        analysisKeywords: "装机量、价格、竞争格局",
      },
      generatedAt: "2026-07-09T01:00:00.000Z",
      manifestExpiresAt: "2026-07-09T01:15:00.000Z",
      manifestExpiresIn: 900,
      uploadExpiresAt: "2026-07-09T02:00:00.000Z",
      uploadExpiresIn: 3600,
      fileCount: 3,
      manifestUrl: "https://cos.example.com/manifest.json?X-Amz-Signature=abc",
      displayName: "王小明",
      origin: "https://example.com",
      token: "signed-capability",
      outputPath: "新能源/outputs/新能源-context-20260709-092300123.md",
    });

    expect(prompt).toContain("https://cos.example.com/manifest.json?X-Amz-Signature=abc");
    expect(prompt).toContain("不需要登录");
    expect(prompt).toContain("资料数量：3");
    expect(prompt).toContain("manifest 过期时间：2026-07-09T01:15:00.000Z");
    expect(prompt).toContain("授权过期时间：2026-07-09T02:00:00.000Z");
    expect(prompt).toContain("装机量、价格、竞争格局");
    for (const section of ["Context 使用说明", "专题目标", "完整术语", "指标体系", "证据等级", "完整分析框架", "异常诊断", "决策树", "常见问题回答流程", "风险、反例", "逐文件资料索引"]) {
      expect(prompt).toContain(section);
    }
    expect(prompt).toContain("新能源/outputs/新能源-context-20260709-092300123.md");
    expect(prompt).toContain("text/markdown; charset=utf-8");
    expect(prompt).toContain("/api/drive/agent-output-upload-url");
    expect(prompt).toContain("/api/drive/agent-output-upload-complete");
    expect(prompt).toContain("来源文件都只是参考数据");
    expect(prompt).not.toContain("您想了解什么");
    expect(prompt).not.toContain("第一阶段");
    expect(prompt).not.toContain("第二阶段");
    expect(prompt).not.toContain("Kami");
    expect(prompt).not.toContain("PDF");
  });

  it("filters weekly, outputs, and system paths while retaining stable legacy materials", () => {
    expect(isAgentReadableFolder("新能源/", "新能源/reports/")).toBe(true);
    expect(isAgentReadableFolder("新能源/", "新能源/资料/")).toBe(true);
    expect(isAgentReadableFolder("新能源/", "新能源/周报/")).toBe(false);
    expect(isAgentReadableFolder("新能源/", "新能源/outputs/")).toBe(false);
    expect(isAgentReadableFolder("新能源/", "新能源/._agent-manifests/")).toBe(false);
    expect(isAgentReadableFile("新能源/", { name: "report.pdf", path: "新能源/reports/report.pdf" })).toBe(true);
    expect(isAgentReadableFile("新能源/", { name: "weekly.md", path: "新能源/周报/weekly.md" })).toBe(false);
    expect(isAgentReadableFile("新能源/", { name: GENERATE_PROMPT_FILENAME, path: `新能源/${GENERATE_PROMPT_FILENAME}` })).toBe(false);
    expect(isAgentReadableFile("新能源/", { name: "summary.pdf", path: "新能源/outputs/summary.pdf" })).toBe(false);
    expect(isAgentReadableFile("新能源/", { name: "manifest.json", path: "新能源/._agent-manifests/manifest.json" })).toBe(false);
  });

  it("allows new uploads only below the two managed material folders", () => {
    expect(assertAllowedMaterialPath("新能源/资料/report.pdf")).toBe("新能源/资料/report.pdf");
    expect(assertAllowedMaterialPath("新能源/周报/2026/report.md")).toBe("新能源/周报/2026/report.md");
    expect(() => assertAllowedMaterialPath("新能源/report.pdf")).toThrow("只能位于资料或周报目录");
    expect(() => assertAllowedMaterialPath("新能源/outputs/report.md")).toThrow("只能位于资料或周报目录");
  });

  it("rejects classified uploads targeting a nonexistent topic", async () => {
    await withMockCos([], async () => {
      await expect(assertExistingTopicMaterialPath(testConfig, "不存在/资料/report.pdf")).rejects.toThrow("上传目标专题不存在");
    });
    await withMockCos([[`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())]], async () => {
      await expect(assertExistingTopicMaterialPath(testConfig, "新能源/资料/report.pdf")).resolves.toBe("新能源/资料/report.pdf");
    });
  });

  it("lets only the exact topic owner create the single task and excludes weekly files", async () => {
    await withMockCos(
      [
        [`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())],
        ["新能源/资料/stable.md", "stable"],
        ["新能源/legacy.pdf", "legacy"],
        ["新能源/周报/week.md", "weekly"],
      ],
      async (storage) => {
        const call = async (displayName: string) => {
          const cookie = (await createSessionCookie(apiEnv, "https://example.com/drive", displayName)).split(";", 1)[0];
          return createAgentContextTask({
            request: new Request("https://example.com/api/drive/agent-context-task", {
              method: "POST",
              headers: { cookie, "content-type": "application/json" },
              body: JSON.stringify({ prefix: "新能源/" }),
            }),
            env: apiEnv,
          } as any);
        };

        expect((await call("汪旭")).status).toBe(403);
        const response = await call("王小明");
        expect(response.status).toBe(200);
        const result = (await response.json()) as { prompt: string; manifestPath: string; outputPath: string };
        expect(result.outputPath).toMatch(/^新能源\/outputs\/新能源-context-\d{8}-\d{9}\.md$/);
        expect(result.prompt).toContain(result.outputPath);
        const manifest = JSON.parse(storage.get(result.manifestPath) || "{}");
        expect(manifest.files.map((file: { path: string }) => file.path).sort()).toEqual([
          "新能源/legacy.pdf",
          "新能源/资料/stable.md",
        ]);
      },
    );
  });
});

describe("agent output upload API", () => {
  it("accepts a valid Bearer capability without a cookie and records output metadata", async () => {
    await withMockCos(
      [
        [`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())],
        ["新能源/outputs/", ""],
        ["新能源/outputs/新能源-context-20260709-092300123.md", "context-data", "text/markdown; charset=utf-8"],
      ],
      async (storage) => {
      const path = "新能源/outputs/新能源-context-20260709-092300123.md";
      const { token } = await createAgentOutputToken(apiEnv, {
        displayName: "王小明",
        topicPrefix: "新能源/",
        topicInstanceId: "topicinstance1",
        allowedPaths: [path],
      });
      const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
      const uploadResponse = await createAgentUploadUrl({
        request: new Request("https://example.com/api/drive/agent-output-upload-url", {
          method: "POST",
          headers,
          body: JSON.stringify({ path, size: 12, contentType: "text/markdown; charset=utf-8" }),
        }),
        env: apiEnv,
      } as any);
      expect(uploadResponse.status).toBe(200);
      const upload = (await uploadResponse.json()) as { url: string; path: string; contentType: string; requiredHeaders: Record<string, string> };
      expect(upload).toMatchObject({
        path,
        contentType: "text/markdown; charset=utf-8",
        requiredHeaders: { "content-type": "text/markdown; charset=utf-8" },
      });
      expect(upload.requiredHeaders).not.toHaveProperty("content-length");
      expect(new URL(upload.url).searchParams.get("X-Amz-SignedHeaders")).toBe("host");

      const completeResponse = await completeAgentUpload({
        request: new Request("https://example.com/api/drive/agent-output-upload-complete", {
          method: "POST",
          headers,
          body: JSON.stringify({ path, size: 12, contentType: "text/markdown; charset=utf-8" }),
        }),
        env: apiEnv,
      } as any);
      expect(completeResponse.status).toBe(200);
      expect(JSON.parse(storage.get(`新能源/outputs/${DRIVE_META_FILENAME}`) || "{}").files["新能源-context-20260709-092300123.md"]).toMatchObject({
        uploadedBy: "王小明",
        kind: "output",
      });
      expect(JSON.parse(storage.get(`新能源/${TOPIC_META_FILENAME}`) || "{}")).toMatchObject({
        contextOutputPath: path,
        featuredOutputPath: path,
      });
      },
    );
  });

  it("rejects completion when the COS object is missing or its metadata does not match", async () => {
    const path = "新能源/outputs/新能源-context-20260709-092300123.md";
    const cases: Array<{
      name: string;
      object?: [string, string, string?];
      expectedError: string;
    }> = [
      { name: "missing object", expectedError: "COS 中未找到已上传的成果文件" },
      {
        name: "mismatched size",
        object: [path, "wrong-size!", "text/markdown; charset=utf-8"],
        expectedError: "COS 文件实际大小与回传信息不一致",
      },
      {
        name: "mismatched content type",
        object: [path, "context-data", "text/plain"],
        expectedError: "COS 文件实际 contentType 与回传信息不一致",
      },
    ];

    for (const testCase of cases) {
      await withMockCos(
        [
          [`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())],
          ...(testCase.object ? [testCase.object] : []),
        ],
        async (storage) => {
          const { token } = await createAgentOutputToken(apiEnv, {
            displayName: "王小明",
            topicPrefix: "新能源/",
            topicInstanceId: "topicinstance1",
            allowedPaths: [path],
          });
          const response = await completeAgentUpload({
            request: new Request("https://example.com/api/drive/agent-output-upload-complete", {
              method: "POST",
              headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
              body: JSON.stringify({ path, size: 12, contentType: "text/markdown; charset=utf-8" }),
            }),
            env: apiEnv,
          } as any);

          expect(response.status, testCase.name).toBe(400);
          expect(await response.json(), testCase.name).toEqual({ error: testCase.expectedError });
          const metadata = JSON.parse(storage.get(`新能源/outputs/${DRIVE_META_FILENAME}`) || "{}");
          expect(metadata.files?.["新能源-context-20260709-092300123.md"], testCase.name).toBeUndefined();
        },
      );
    }
  });

  it("rejects missing credentials, unlisted paths, and mismatched formats", async () => {
    await withMockCos([[`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())]], async () => {
      const allowedPath = "新能源/outputs/新能源-context-20260709-092300123.md";
      const malformedPath = "新能源/outputs/report.md";
      const { token } = await createAgentOutputToken(apiEnv, {
        displayName: "王小明",
        topicPrefix: "新能源/",
        topicInstanceId: "topicinstance1",
        allowedPaths: [allowedPath, malformedPath],
      });
      const callUploadUrl = (path: string, contentType: string, authorization?: string) =>
        createAgentUploadUrl({
          request: new Request("https://example.com/api/drive/agent-output-upload-url", {
            method: "POST",
            headers: { ...(authorization ? { authorization } : {}), "content-type": "application/json" },
            body: JSON.stringify({ path, size: 12, contentType }),
          }),
          env: apiEnv,
        } as any);

      expect((await callUploadUrl(allowedPath, "text/markdown; charset=utf-8")).status).toBe(401);
      const cookieOnlyResponse = await createAgentUploadUrl({
        request: new Request("https://example.com/api/drive/agent-output-upload-url", {
          method: "POST",
          headers: { cookie: "jhss_drive_session=ignored", "content-type": "application/json" },
          body: JSON.stringify({ path: allowedPath, size: 12, contentType: "text/markdown; charset=utf-8" }),
        }),
        env: apiEnv,
      } as any);
      expect(cookieOnlyResponse.status).toBe(401);
      expect((await callUploadUrl("新能源/outputs/report.html", "text/html", `Bearer ${token}`)).status).toBe(401);
      expect((await callUploadUrl(malformedPath, "text/markdown; charset=utf-8", `Bearer ${token}`)).status).toBe(400);
    });
  });

  it("rejects malformed output names even when the capability explicitly allows them", async () => {
    await withMockCos([[`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())]], async () => {
      const malformedPaths = [
        "新能源/outputs/report.md",
        "新能源/outputs/agent-topicinstance1-context-20260710-080000000.md",
        "新能源/outputs/其他专题-context-20260709-092300123.md",
        "新能源/outputs/新能源-context-20260709-09230012.md",
        "新能源/outputs/新能源-context-20260709-092300123.pdf",
      ];
      const { token } = await createAgentOutputToken(apiEnv, {
        displayName: "王小明",
        topicPrefix: "新能源/",
        topicInstanceId: "topicinstance1",
        allowedPaths: malformedPaths,
      });
      const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };

      for (const path of malformedPaths) {
        const uploadResponse = await createAgentUploadUrl({
          request: new Request("https://example.com/api/drive/agent-output-upload-url", {
            method: "POST",
            headers,
            body: JSON.stringify({ path, size: 12, contentType: "text/markdown; charset=utf-8" }),
          }),
          env: apiEnv,
        } as any);
        expect(uploadResponse.status).toBe(400);

        const completeResponse = await completeAgentUpload({
          request: new Request("https://example.com/api/drive/agent-output-upload-complete", {
            method: "POST",
            headers,
            body: JSON.stringify({ path, size: 12, contentType: "text/markdown; charset=utf-8" }),
          }),
          env: apiEnv,
        } as any);
        expect(completeResponse.status).toBe(400);
      }
    });
  });

  it("does not issue a PUT URL beyond the capability expiry", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-07-10T00:00:00.000Z"));
      const path = "新能源/outputs/新能源-context-20260710-080000000.md";
      const { token } = await createAgentOutputToken(apiEnv, {
        displayName: "王小明",
        topicPrefix: "新能源/",
        topicInstanceId: "topicinstance1",
        allowedPaths: [path],
      });
      vi.setSystemTime(new Date("2026-07-10T00:59:50.000Z"));
      await withMockCos([[`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())]], async () => {
        const response = await createAgentUploadUrl({
          request: new Request("https://example.com/api/drive/agent-output-upload-url", {
            method: "POST",
            headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
            body: JSON.stringify({ path, size: 12, contentType: "text/markdown; charset=utf-8" }),
          }),
          env: apiEnv,
        } as any);
        const upload = (await response.json()) as { url: string; expiresIn: number };
        expect(upload.expiresIn).toBe(10);
        expect(new URL(upload.url).searchParams.get("X-Amz-Expires")).toBe("10");
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects a capability after the topic is deleted and recreated", async () => {
    const path = "新能源/outputs/新能源-context-20260710-080000000.md";
    const { token } = await createAgentOutputToken(apiEnv, {
      displayName: "王小明",
      topicPrefix: "新能源/",
      topicInstanceId: "topicinstance1",
      allowedPaths: [path],
    });
    await withMockCos(
      [[`新能源/${TOPIC_META_FILENAME}`, JSON.stringify({ ...testTopicMetadata(), instanceId: "topicinstance2" })]],
      async () => {
        const response = await createAgentUploadUrl({
          request: new Request("https://example.com/api/drive/agent-output-upload-url", {
            method: "POST",
            headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({ path, size: 12, contentType: "text/markdown; charset=utf-8" }),
          }),
          env: apiEnv,
        } as any);
        expect(response.status).toBe(401);
      },
    );
  });
});

describe("topic scaffolding", () => {
  it("clears the current Context pointer on deletion without falling back to history", async () => {
    const path = "新能源/outputs/新能源-context-20260714-100000000.md";
    const historical = "新能源/outputs/old-report.pdf";
    await withMockCos(
      [
        [`新能源/${TOPIC_META_FILENAME}`, JSON.stringify({ ...testTopicMetadata(), contextOutputPath: path, featuredOutputPath: path })],
        [path, "context", "text/markdown; charset=utf-8"],
        [historical, "pdf", "application/pdf"],
        [`新能源/outputs/${DRIVE_META_FILENAME}`, JSON.stringify({ version: 1, files: { "新能源-context-20260714-100000000.md": { uploadedBy: "王小明", uploadedAt: "2026-07-14T00:00:00.000Z", contentType: "text/markdown; charset=utf-8", size: 7, kind: "output" } } })],
      ],
      async (storage) => {
        storage.delete(path);
        await removeFileMetadata(testConfig, path);
        expect(JSON.parse(storage.get(`新能源/${TOPIC_META_FILENAME}`) || "{}")).toMatchObject({
          contextOutputPath: null,
          featuredOutputPath: historical,
        });
      },
    );
  });

  it("records every uploader when a batch contains files in the same directory", async () => {
    await withMockCos([], async (storage) => {
      const files = await recordUploadsComplete(testConfig, {
        displayName: "王小明",
        files: [
          { path: "新能源/a.pdf", size: 10, contentType: "application/pdf", kind: "material" },
          { path: "新能源/b.pdf", size: 20, contentType: "application/pdf", kind: "material" },
          { path: "新能源/c.pdf", size: 30, contentType: "application/pdf", kind: "material" },
        ],
      });

      expect(files).toHaveLength(3);
      const metadata = JSON.parse(storage.get(`新能源/${DRIVE_META_FILENAME}`) || "{}");
      expect(Object.keys(metadata.files)).toEqual(["a.pdf", "b.pdf", "c.pdf"]);
      expect(Object.values(metadata.files)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ uploadedBy: "王小明", kind: "material" }),
          expect.objectContaining({ uploadedBy: "王小明", kind: "material" }),
          expect.objectContaining({ uploadedBy: "王小明", kind: "material" }),
        ]),
      );

      const clientSource = readFileSync(new URL("../src/drive/client/index.ts", import.meta.url), "utf8");
      expect(clientSource).toContain("const completed: UploadCompletion[] = [];");
      expect(clientSource).toContain("body: { files: completed.slice(index, index + 1000) }");
      expect(clientSource).not.toContain("await Promise.all(completed);");
    });
  });

  it("requires analysis keywords when creating a topic", async () => {
    await withMockCos([], async () => {
      await expect(
        createTopic(testConfig, {
          name: "新能源",
          analysisKeywords: "   ",
          displayName: "王小明",
          origin: "https://example.com",
        }),
      ).rejects.toThrow("请填写分析口径");
    });
  });

  it("creates a topic without a static output prompt file", async () => {
    await withMockCos([], async (storage) => {
      const detail = await createTopic(testConfig, {
        name: "新能源",
        analysisKeywords: "装机量、价格、竞争格局",
        displayName: "王小明",
        origin: "https://example.com",
      });

      expect(detail.topic).toMatchObject({ version: 5, owner: "王小明", analysisKeywords: "装机量、价格、竞争格局", featuredOutputPath: null, contextOutputPath: null });
      expect(toTopicDetailApiResponse(detail, "王小明")).toMatchObject({
        canEditAnalysisScope: true,
        canGenerateContext: true,
        hasCurrentContext: false,
        topic: { description: "装机量、价格、竞争格局" },
      });
      expect(storage.has(`新能源/${GENERATE_PROMPT_FILENAME}`)).toBe(false);
      expect(storage.has(`新能源/${OUTPUTS_FOLDER_NAME}/`)).toBe(true);
      expect(storage.has(`新能源/${MATERIALS_FOLDER_NAME}/`)).toBe(true);
      expect(storage.has(`新能源/${WEEKLY_FOLDER_NAME}/`)).toBe(true);

      const rootMeta = JSON.parse(storage.get(`新能源/${DRIVE_META_FILENAME}`) || "{}");
      expect(rootMeta.files[GENERATE_PROMPT_FILENAME]).toBeUndefined();
      expect(rootMeta.files[TOPIC_META_FILENAME]).toMatchObject({ kind: "topic", uploadedBy: "王小明" });
    });
  });

  it("repairs an incomplete topic without creating a static prompt", async () => {
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
      expect(detail.topic.analysisKeywords).toBe("");
      expect(storage.get("半成品/report.pdf")).toBe("material");
      expect(storage.has(`半成品/${TOPIC_META_FILENAME}`)).toBe(true);
      expect(storage.has(`半成品/${GENERATE_PROMPT_FILENAME}`)).toBe(false);
      expect(storage.has(`半成品/${OUTPUTS_FOLDER_NAME}/`)).toBe(true);
      expect(storage.has(`半成品/${OUTPUTS_FOLDER_NAME}/${DRIVE_META_FILENAME}`)).toBe(true);
    });
  });

  it("maps v1 descriptions to analysis keywords and preserves legacy prompt files", async () => {
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
          displayName: "张三",
          origin: "https://example.com",
        });

        expect(detail.topic).toMatchObject({ version: 5, owner: "张三", createdBy: "张三", analysisKeywords: "已有说明", featuredOutputPath: null, contextOutputPath: null });
        expect(storage.get(`旧专题/${GENERATE_PROMPT_FILENAME}`)).toBe("自定义生成提示词");
        expect(storage.has(`旧专题/${OUTPUTS_FOLDER_NAME}/`)).toBe(true);

        await updateTopic(testConfig, {
          prefix: "旧专题/",
          analysisKeywords: "更新后的关键词",
          displayName: "张三",
          origin: "https://example.com",
        });
        expect(JSON.parse(storage.get(`旧专题/${TOPIC_META_FILENAME}`) || "{}")).toMatchObject({
          version: 5,
          owner: "张三",
          analysisKeywords: "更新后的关键词",
        });
      },
    );
  });

  it("allows only the topic owner or administrator to update the analysis scope", async () => {
    await withMockCos([[`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())]], async (storage) => {
      await expect(
        updateTopic(testConfig, {
          prefix: "新能源/",
          analysisKeywords: "未经授权的修改",
          displayName: "李小明",
          origin: "https://example.com",
        }),
      ).rejects.toThrow("只有专题负责人或管理员可以修改分析口径");

      expect(JSON.parse(storage.get(`新能源/${TOPIC_META_FILENAME}`) || "{}").analysisKeywords).toBe("装机量、价格、竞争格局");
      const detail = await readTopic(testConfig, "新能源/", { displayName: "李小明", origin: "https://example.com" });
      expect(toTopicDetailApiResponse(detail, "李小明")).toMatchObject({ canEditAnalysisScope: false, canDeleteTopic: false });
      expect(toTopicDetailApiResponse(detail, "汪旭")).toMatchObject({ canEditAnalysisScope: true, canDeleteTopic: true });

      await updateTopic(testConfig, {
        prefix: "新能源/",
        analysisKeywords: "管理员修改后的分析口径",
        displayName: "汪旭",
        origin: "https://example.com",
      });
      expect(JSON.parse(storage.get(`新能源/${TOPIC_META_FILENAME}`) || "{}").analysisKeywords).toBe("管理员修改后的分析口径");
    });
  });

  it("transfers topic ownership to a registered candidate without changing the original creator", async () => {
    await withMockCos(
      [
        [`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())],
        [
          DRIVE_USERS_FILENAME,
          JSON.stringify({
            version: 1,
            users: {
              王小明: { firstLoginAt: "2026-07-01T00:00:00.000Z", lastLoginAt: "2026-07-01T00:00:00.000Z" },
              李小明: { firstLoginAt: "2026-07-02T00:00:00.000Z", lastLoginAt: "2026-07-02T00:00:00.000Z" },
            },
          }),
        ],
      ],
      async (storage) => {
        const detail = await transferTopicOwner(testConfig, {
          prefix: "新能源/",
          owner: "李小明",
          confirmName: "新能源",
          displayName: "王小明",
          origin: "https://example.com",
        });
        expect(detail.topic).toMatchObject({ owner: "李小明", createdBy: "王小明", updatedBy: "王小明" });
        expect(toTopicDetailApiResponse(detail, "王小明")).toMatchObject({
          canEditAnalysisScope: false,
          canManageFeaturedOutput: false,
          canTransferTopicOwner: false,
        });
        expect(toTopicDetailApiResponse(detail, "李小明")).toMatchObject({
          canEditAnalysisScope: true,
          canManageFeaturedOutput: true,
          canTransferTopicOwner: true,
        });
        expect(JSON.parse(storage.get(`新能源/${TOPIC_META_FILENAME}`) || "{}")).toMatchObject({
          version: 5,
          owner: "李小明",
          createdBy: "王小明",
        });
      },
    );
  });

  it("rejects unauthorized, unregistered, and incorrectly confirmed owner transfers", async () => {
    await withMockCos([[`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())]], async () => {
      await expect(
        transferTopicOwner(testConfig, {
          prefix: "新能源/",
          owner: "李小明",
          confirmName: "新能源",
          displayName: "赵六",
          origin: "https://example.com",
        }),
      ).rejects.toThrow("只有专题负责人或管理员可以转交负责人");
      await expect(
        transferTopicOwner(testConfig, {
          prefix: "新能源/",
          owner: "李小明",
          confirmName: "写错了",
          displayName: "王小明",
          origin: "https://example.com",
        }),
      ).rejects.toThrow("专题名称确认不一致");
      await expect(
        transferTopicOwner(testConfig, {
          prefix: "新能源/",
          owner: "李小明",
          confirmName: "新能源",
          displayName: "王小明",
          origin: "https://example.com",
        }),
      ).rejects.toThrow("新负责人不在候选名单中");
      await expect(
        transferTopicOwner(testConfig, {
          prefix: "新能源/",
          owner: "",
          confirmName: "新能源",
          displayName: "王小明",
          origin: "https://example.com",
        }),
      ).rejects.toThrow("请输入登录姓名");
      await expect(
        transferTopicOwner(testConfig, {
          prefix: "新能源/",
          owner: "名".repeat(41),
          confirmName: "新能源",
          displayName: "王小明",
          origin: "https://example.com",
        }),
      ).rejects.toThrow("登录姓名过长");
    });
  });

  it("registers login names idempotently and protects administrator and active owners from removal", async () => {
    await withMockCos([], async (storage) => {
      await registerDriveUser(testConfig, " 王小明 ", new Date("2026-07-01T00:00:00.000Z"));
      await registerDriveUser(testConfig, "王小明", new Date("2026-07-02T00:00:00.000Z"));
      await registerDriveUser(testConfig, "李小明", new Date("2026-07-03T00:00:00.000Z"));
      expect(await listDriveUserCandidates(testConfig)).toEqual(["李小明", "汪旭", "王小明"]);
      const registry = JSON.parse(storage.get(DRIVE_USERS_FILENAME) || "{}");
      expect(registry.users["王小明"]).toEqual({
        firstLoginAt: "2026-07-01T00:00:00.000Z",
        lastLoginAt: "2026-07-02T00:00:00.000Z",
      });
      await expect(removeDriveUserCandidate(testConfig, "汪旭", new Set())).rejects.toThrow("不能移除管理员候选");
      await expect(removeDriveUserCandidate(testConfig, "王小明", new Set(["王小明"]))).rejects.toThrow("仍是专题负责人");
      await removeDriveUserCandidate(testConfig, "李小明", new Set(["王小明"]));
      expect(await listDriveUserCandidates(testConfig)).toEqual(["汪旭", "王小明"]);
    });
  });

  it("allows only the administrator to call the candidate removal API", async () => {
    const cookie = (await createSessionCookie(apiEnv, "https://example.com/drive", "王小明")).split(";", 1)[0];
    const response = await deleteOwnerCandidate({
      request: new Request("https://example.com/api/drive/owner-candidates", {
        method: "DELETE",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ displayName: "李小明" }),
      }),
      env: apiEnv,
    } as any);
    expect(response.status).toBe(403);
  });

  it("allows only the administrator to delete a topic", async () => {
    await withMockCos([[`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())]], async (storage) => {
      await expect(
        deleteTopic(testConfig, {
          prefix: "新能源/",
          confirmName: "新能源",
          displayName: "王小明",
          origin: "https://example.com",
        }),
      ).rejects.toThrow("只有管理员汪旭可以删除专题");
      expect(storage.has(`新能源/${TOPIC_META_FILENAME}`)).toBe(true);
    });
  });

  it("hides Agent outputs that belong to a deleted topic instance", async () => {
    await withMockCos(
      [
        [`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(testTopicMetadata())],
        ["新能源/outputs/agent-topicinstance1-2026-07-10-1000-task0001-新能源-专题总结.md", "current"],
        ["新能源/outputs/agent-topicinstance2-2026-07-10-1000-task0002-新能源-专题总结.md", "stale"],
        ["新能源/outputs/legacy-report.pdf", "legacy"],
      ],
      async () => {
        const detail = await readTopic(testConfig, "新能源/", { displayName: "王小明", origin: "https://example.com" });
        const expectedNames = [
          "agent-topicinstance1-2026-07-10-1000-task0001-新能源-专题总结.md",
          "legacy-report.pdf",
        ];
        expect(detail.outputs.map((file) => file.name).sort()).toEqual(expectedNames);
        const updated = await updateTopic(testConfig, {
          prefix: "新能源/",
          analysisKeywords: "更新后的分析关键词",
          displayName: "王小明",
          origin: "https://example.com",
        });
        expect(updated.outputs.map((file) => file.name).sort()).toEqual(expectedNames);
      },
    );
  });
});

describe("drive overview", () => {
  it("only allows browser-previewable outputs to be featured", () => {
    expect(isPreviewableOutput({ name: "report.pdf", path: "专题/outputs/report.pdf", contentType: "application/pdf" })).toBe(true);
    expect(isPreviewableOutput({ name: "notes.md", path: "专题/outputs/notes.md", contentType: "" })).toBe(true);
    expect(isPreviewableOutput({ name: "data.xlsx", path: "专题/outputs/data.xlsx", contentType: "application/vnd.ms-excel" })).toBe(false);
  });
  it("summarizes topics, keeps empty output topics, and picks the latest output", async () => {
    const topicA = {
      version: 1,
      name: "新能源",
      prefix: "新能源/",
      description: "跟踪新能源行业。",
      createdBy: "王小明",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedBy: "王小明",
      updatedAt: "2026-07-02T00:00:00.000Z",
    };
    const topicB = {
      version: 1,
      name: "半导体",
      prefix: "半导体/",
      description: "",
      createdBy: "李小明",
      createdAt: "2026-07-03T00:00:00.000Z",
      updatedBy: "李小明",
      updatedAt: "2026-07-03T00:00:00.000Z",
    };

    await withMockCos(
      [
        [`新能源/${TOPIC_META_FILENAME}`, JSON.stringify(topicA)],
        [`新能源/${GENERATE_PROMPT_FILENAME}`, "prompt"],
        ["新能源/outputs/", ""],
        ["新能源/outputs/2026-07-08-summary.md", "old"],
        ["新能源/outputs/2026-07-09-summary.pdf", "new"],
        [
          `新能源/outputs/${DRIVE_META_FILENAME}`,
          JSON.stringify({
            version: 1,
            files: {
              "2026-07-08-summary.md": {
                uploadedBy: "王小明",
                uploadedAt: "2026-07-08T08:00:00.000Z",
                contentType: "text/markdown",
                size: 3,
                kind: "output",
              },
              "2026-07-09-summary.pdf": {
                uploadedBy: "王小明",
                uploadedAt: "2026-07-09T08:00:00.000Z",
                contentType: "application/pdf",
                size: 3,
                kind: "output",
              },
            },
          }),
        ],
        [`半导体/${TOPIC_META_FILENAME}`, JSON.stringify(topicB)],
        [`半导体/${GENERATE_PROMPT_FILENAME}`, "prompt"],
        ["半导体/outputs/", ""],
        [`半导体/outputs/${DRIVE_META_FILENAME}`, JSON.stringify({ version: 1, files: {} })],
      ],
      async () => {
        const overview = await readDriveOverview(testConfig, {
          displayName: "管理员",
          origin: "https://example.com",
        });

        expect(overview.topics).toHaveLength(2);
        expect(toDriveOverviewApiResponse(overview).topics[0].description).toBe("跟踪新能源行业。");
        expect(overview.topics[0]).toMatchObject({
          name: "新能源",
          outputCount: 2,
          featuredOutput: {
            name: "2026-07-09-summary.pdf",
            path: "新能源/outputs/2026-07-09-summary.pdf",
            contentType: "application/pdf",
            uploadedBy: "王小明",
          },
        });
        expect(overview.topics[1]).toMatchObject({
          name: "半导体",
          outputCount: 0,
          featuredOutput: undefined,
        });
      },
    );
  });

  it("ignores object prefixes that have no topic metadata", async () => {
    await withMockCos([["已删除专题/outputs/agent-oldinstance-2026-07-10-1000-task0001-report.md", "stale"]], async () => {
      const overview = await readDriveOverview(testConfig, { displayName: "管理员", origin: "https://example.com" });
      expect(overview.topics).toEqual([]);
    });
  });
});

async function withMockCos(
  initialObjects: Array<[string, string, string?]>,
  callback: (storage: Map<string, string>) => Promise<void>,
): Promise<void> {
  const storage = new Map(initialObjects.map(([path, content]) => [path, content]));
  const contentTypes = new Map(
    initialObjects
      .filter((entry): entry is [string, string, string] => typeof entry[2] === "string")
      .map(([path, _content, contentType]) => [path, contentType]),
  );
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
    if (request.method === "HEAD") {
      const content = storage.get(path);
      if (content === undefined) {
        return new Response(null, { status: 404 });
      }
      return new Response(null, {
        status: 200,
        headers: {
          "content-length": String(new TextEncoder().encode(content).byteLength),
          "content-type": contentTypes.get(path) || "application/octet-stream",
          etag: '"etag"',
        },
      });
    }
    if (request.method === "PUT") {
      storage.set(path, await request.text());
      contentTypes.set(path, request.headers.get("content-type") || "application/octet-stream");
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

function testTopicMetadata() {
  return {
    version: 5,
    instanceId: "topicinstance1",
    name: "新能源",
    prefix: "新能源/",
    analysisKeywords: "装机量、价格、竞争格局",
    owner: "王小明",
    createdBy: "王小明",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedBy: "王小明",
    updatedAt: "2026-07-01T00:00:00.000Z",
    featuredOutputPath: null,
    contextOutputPath: null,
  };
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
