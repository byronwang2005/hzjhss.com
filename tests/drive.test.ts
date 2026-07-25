import { afterEach, describe, expect, it, vi } from "vitest";
import { getAiConfig, getDriveConfig, KNOWLEDGE_ROOT_PREFIX, type DriveEnv } from "../src/drive/server/config";
import {
  brandedMethodologyPath,
  completeUpload,
  createDownloadUrl,
  createKnowledgeTopic,
  createUpload,
  deleteKnowledgeFile,
  deleteKnowledgeTopic,
  filePolicy,
  listKnowledgeFiles,
  listKnowledgeTopics,
  METHODOLOGY_PATH,
  patchKnowledgeFile,
  patchKnowledgeFolderIncorporation,
  processingStatusPath,
  readKnowledgeTopic,
  sourcePath,
  tempUploadPath,
  updateKnowledgeTopic,
} from "../src/drive/server/knowledge";
import { createSessionCookie, getDriveSession, isDriveAdmin } from "../src/drive/server/session";
import { jsonResponse } from "../src/drive/server/http";
import { onRequestPost as uploadUrl } from "../functions/api/drive/upload-url";
import { onRequestPost as uploadComplete } from "../functions/api/drive/upload-complete";
import { onRequestGet as listFiles } from "../functions/api/drive/list";
import { onRequestPatch as patchFolder } from "../functions/api/drive/folder";

const env: DriveEnv = {
  COS_SECRET_ID: "id",
  COS_SECRET_KEY: "key",
  COS_BUCKET: "bucket-1250000000",
  COS_REGION: "ap-guangzhou",
  COS_ENDPOINT: "https://cos.example.com",
  DRIVE_ACCESS_CODE: "code",
  DRIVE_SESSION_SECRET: "secret",
};
const config = getDriveConfig(env);
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("new COS namespace and policies", () => {
  it("round-trips the signed session cookie and preserves Set-Cookie headers", async () => {
    const cookie = await createSessionCookie(env, "https://example.com", "汪旭");
    const session = await getDriveSession(env, cookie.split(";", 1)[0]);
    expect(session?.displayName).toBe("汪旭");
    const response = jsonResponse({ ok: true }, 200, { "set-cookie": cookie });
    expect(response.headers.get("set-cookie")).toBe(cookie);
  });

  it("uses only the new knowledge-base prefix", () => {
    expect(KNOWLEDGE_ROOT_PREFIX).toBe("ai-knowledge-base/");
    expect(config.rootPrefix).toBe("ai-knowledge-base/");
  });

  it("enforces the exact administrator and file limits", () => {
    expect(isDriveAdmin("汪旭")).toBe(true);
    expect(isDriveAdmin(" 汪旭 ")).toBe(false);
    expect(filePolicy("a.pdf").maxBytes).toBe(100 * 1024 * 1024);
    expect(filePolicy("a.xlsx").maxBytes).toBe(10 * 1024 * 1024);
    expect(() => filePolicy("a.csv")).toThrow("仅支持");
  });

  it("requires an explicit AI context window larger than the output budget", () => {
    expect(() => getAiConfig({ AI_API_KEY: "key", AI_BASE_URL: "https://ai.example.com", AI_MODEL: "long" })).toThrow("AI_CONTEXT_WINDOW_TOKENS");
    const aiConfig = getAiConfig({
      AI_API_KEY: "key",
      AI_BASE_URL: "https://ai.example.com",
      AI_MODEL: "long",
      AI_CONTEXT_WINDOW_TOKENS: "1000000",
    });
    expect(aiConfig).toMatchObject({
      contextWindowTokens: 1_000_000,
      provider: "openai-compatible",
      reasoningEffort: "high",
      requestTimeoutMs: 300_000,
    });
    expect(getAiConfig({
      AI_API_KEY: "key",
      AI_BASE_URL: "https://ai.example.com",
      AI_MODEL: "long",
      AI_CONTEXT_WINDOW_TOKENS: "1000000",
      AI_PROVIDER: "deepseek",
      AI_REASONING_EFFORT: "max",
      AI_REQUEST_TIMEOUT_MS: "450000",
    })).toMatchObject({ provider: "deepseek", reasoningEffort: "max", requestTimeoutMs: 450_000 });
    expect(getAiConfig({
      AI_API_KEY: "key",
      AI_BASE_URL: "https://api.deepseek.com",
      AI_MODEL: "deepseek-v4-pro",
      AI_CONTEXT_WINDOW_TOKENS: "1000000",
    }).provider).toBe("deepseek");
    expect(() => getAiConfig({
      AI_API_KEY: "key",
      AI_BASE_URL: "https://ai.example.com",
      AI_MODEL: "long",
      AI_CONTEXT_WINDOW_TOKENS: "1000000",
      AI_PROVIDER: "unknown",
    })).toThrow("AI_PROVIDER 只支持");
    expect(() => getAiConfig({
      AI_API_KEY: "key",
      AI_BASE_URL: "https://ai.example.com",
      AI_MODEL: "long",
      AI_CONTEXT_WINDOW_TOKENS: "1000000",
      AI_REASONING_EFFORT: "medium",
    })).toThrow("只支持 high 或 max");
    expect(() => getAiConfig({
      AI_API_KEY: "key",
      AI_BASE_URL: "https://ai.example.com",
      AI_MODEL: "long",
      AI_CONTEXT_WINDOW_TOKENS: "1000",
      AI_MAX_OUTPUT_TOKENS: "960",
    })).toThrow("5% 输入安全余量");
  });
});

describe("knowledge topic and upload flow", () => {
  it("creates topics, verifies COS HEAD metadata, and exposes processing state", async () => {
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "新能源");
    const relativePath = "报告/年度.pdf";
    const signature = await createUpload(config, { topicId: topic.id, relativePath, size: 3, contentType: "application/pdf", pdfPages: 12 });
    expect(signature.url).toContain("/system/temp/");
    expect(signature.path).toBe(relativePath);

    storage.set(tempUploadPath(signature.uploadId), { body: "pdf", contentType: "application/pdf", etag: "etag-source" });
    const metadata = await completeUpload(config, { topicId: topic.id, uploadId: signature.uploadId, relativePath, size: 3, contentType: "application/pdf", pdfPages: 12, uploadedBy: "汪旭" });
    expect(metadata).toMatchObject({ etag: "etag-source", processingKind: "document-parse", pdfPages: 12 });
    await expect(completeUpload(config, {
      topicId: topic.id,
      uploadId: signature.uploadId,
      relativePath,
      size: 3,
      contentType: "application/pdf",
      pdfPages: 12,
      uploadedBy: "汪旭",
    })).resolves.toEqual(metadata);
    expect(JSON.parse(storage.get(processingStatusPath(topic.id, "evidence", relativePath))!.body)).toMatchObject({ state: "queued", sourceEtag: "etag-source" });

    const topics = await listKnowledgeTopics(config);
    expect(topics).toHaveLength(1);
    expect(topics[0]).toMatchObject({
      id: topic.id,
      name: "新能源",
      methodologyPath: "嘉合杉升新能源方法论.md",
      ready: false,
    });
    const files = await listKnowledgeFiles(config, topic.id, "evidence", "");
    expect(files.folders[0].name).toBe("报告");
    storage.set(processingStatusPath(topic.id, "evidence", relativePath), {
      body: JSON.stringify({
        version: 1,
        topicId: topic.id,
        path: relativePath,
        sourceEtag: "etag-source",
        state: "failed",
        processingKind: "document-parse",
        updatedAt: "2026-07-25T00:00:00.000Z",
        error: "Secret upstream provider detail",
      }),
      contentType: "application/json",
      etag: "status-etag",
    });
    const nested = await listKnowledgeFiles(config, topic.id, "evidence", "报告/");
    expect(nested.files[0].processing).toMatchObject({
      state: "failed",
      failureCode: "PROCESSING_FAILED",
      retryable: true,
    });
    expect(nested.files[0].processing).not.toHaveProperty("error");
  });

  it("hides topics that predate the role-tree storage layout", async () => {
    const storage = installCosMock();
    const visible = await createKnowledgeTopic(config, "新版专题");
    const hidden = await createKnowledgeTopic(config, "旧测试专题");
    removeTopicStorageLayout(storage, hidden.id);

    await expect(listKnowledgeTopics(config)).resolves.toEqual([
      expect.objectContaining({ id: visible.id, storageLayout: "role-trees-v1" }),
    ]);
    expect(storage.has(`topics/${hidden.id}/topic.json`)).toBe(true);
  });

  it("deletes a mismatched upload and refuses registration", async () => {
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "测试");
    const signature = await createUpload(config, { topicId: topic.id, relativePath: "a.txt", size: 3, contentType: "text/plain" });
    storage.set(tempUploadPath(signature.uploadId), { body: "wrong", contentType: "text/plain", etag: "etag" });
    await expect(completeUpload(config, { topicId: topic.id, uploadId: signature.uploadId, relativePath: "a.txt", size: 3, contentType: "text/plain", uploadedBy: "汪旭" })).rejects.toThrow("实际大小");
    expect(storage.has(tempUploadPath(signature.uploadId))).toBe(false);
  });

  it("requires exact topic and nested file names before permanent deletion", async () => {
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "删除确认");
    const relativePath = "报告/年度总结.txt";
    const signature = await createUpload(config, {
      topicId: topic.id,
      relativePath,
      size: 3,
      contentType: "text/plain",
    });
    storage.set(tempUploadPath(signature.uploadId), { body: "txt", contentType: "text/plain", etag: "etag-delete" });
    await completeUpload(config, {
      topicId: topic.id,
      uploadId: signature.uploadId,
      relativePath,
      size: 3,
      contentType: "text/plain",
      uploadedBy: "汪旭",
    });

    const versionBeforeDelete = (await readKnowledgeTopic(config, topic.id)).indexVersion;
    await expect(deleteKnowledgeFile(config, topic.id, "evidence", relativePath, undefined)).rejects.toThrow("文件名称确认不匹配");
    await expect(deleteKnowledgeFile(config, topic.id, "evidence", relativePath, " 年度总结.txt")).rejects.toThrow("文件名称确认不匹配");
    await expect(deleteKnowledgeFile(config, topic.id, "evidence", relativePath, "报告/年度总结.txt")).rejects.toThrow("文件名称确认不匹配");
    expect(storage.has(sourcePath(topic.id, "evidence", relativePath))).toBe(true);
    expect((await readKnowledgeTopic(config, topic.id)).indexVersion).toBe(versionBeforeDelete);

    await expect(deleteKnowledgeFile(config, topic.id, "evidence", relativePath, "年度总结.txt")).resolves.toMatchObject({ indexChanged: true });
    expect(storage.has(sourcePath(topic.id, "evidence", relativePath))).toBe(false);

    await expect(deleteKnowledgeTopic(config, topic.id, "删除确认 ")).rejects.toThrow("专题名称确认不匹配");
    await expect(readKnowledgeTopic(config, topic.id)).resolves.toMatchObject({ name: "删除确认" });
    await expect(deleteKnowledgeTopic(config, topic.id, "删除确认")).resolves.toMatchObject({ deletedCount: expect.any(Number) });
    await expect(readKnowledgeTopic(config, topic.id)).rejects.toThrow("专题不存在");
  });

  it("stores references without processing and gives new topics one branded methodology path", async () => {
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "机器人");

    const reference = await createUpload(config, {
      topicId: topic.id,
      relativePath: "研报/深度报告.pdf",
      size: 3,
      contentType: "application/pdf",
      knowledgeRole: "reference",
    });
    storage.set(tempUploadPath(reference.uploadId), { body: "pdf", contentType: "application/pdf", etag: "etag-reference" });
    await completeUpload(config, {
      topicId: topic.id,
      uploadId: reference.uploadId,
      relativePath: reference.path,
      size: 3,
      contentType: "application/pdf",
      knowledgeRole: "reference",
      uploadedBy: "汪旭",
    });
    expect(storage.has(processingStatusPath(topic.id, "reference", reference.path))).toBe(false);
    expect((await readKnowledgeTopic(config, topic.id)).indexVersion).toBe(1);

    const methodology = await createUpload(config, {
      topicId: topic.id,
      relativePath: "任意名称.md",
      size: 8,
      contentType: "text/markdown",
      knowledgeRole: "methodology",
    });
    expect(methodology.path).toBe("嘉合杉升机器人方法论.md");
    storage.set(tempUploadPath(methodology.uploadId), { body: "# 方法", contentType: "text/markdown", etag: "etag-method" });
    const firstMethodology = await completeUpload(config, {
      topicId: topic.id,
      uploadId: methodology.uploadId,
      relativePath: methodology.path,
      size: 8,
      contentType: "text/markdown",
      knowledgeRole: "methodology",
      uploadedBy: "汪旭",
    });
    expect(firstMethodology).toMatchObject({
      path: "嘉合杉升机器人方法论.md",
      name: "嘉合杉升机器人方法论.md",
      knowledgeRole: "methodology",
    });

    const replacement = await createUpload(config, {
      topicId: topic.id,
      relativePath: "另一份框架.md",
      size: 11,
      contentType: "text/markdown",
      knowledgeRole: "methodology",
    });
    expect(replacement.path).toBe(methodology.path);
    storage.set(tempUploadPath(replacement.uploadId), { body: "# 新方法", contentType: "text/markdown", etag: "etag-method-new" });
    await completeUpload(config, {
      topicId: topic.id,
      uploadId: replacement.uploadId,
      relativePath: "伪造名称.md",
      size: 11,
      contentType: "text/markdown",
      knowledgeRole: "methodology",
      uploadedBy: "汪旭",
    });

    const memberFiles = await listKnowledgeFiles(config, topic.id, "methodology", "");
    const adminFiles = await listKnowledgeFiles(config, topic.id, "methodology", "", null, { includeMethodology: true });
    expect(memberFiles.files.some((file) => file.knowledgeRole === "methodology")).toBe(false);
    expect(adminFiles.files.filter((file) => file.knowledgeRole === "methodology")).toHaveLength(1);
    expect(adminFiles.files.find((file) => file.knowledgeRole === "methodology")).toMatchObject({
      path: methodology.path,
      name: methodology.path,
      etag: "etag-method-new",
    });
    await expect(createDownloadUrl(config, topic.id, "methodology", methodology.path)).rejects.toThrow("无权下载");
    await expect(createDownloadUrl(config, topic.id, "methodology", methodology.path, { includeMethodology: true })).resolves.toMatchObject({ name: methodology.path });

    const patched = await patchKnowledgeFile(config, {
      topicId: topic.id,
      knowledgeRole: "reference",
      relativePath: reference.path,
      incorporated: true,
      updatedBy: "汪旭",
    });
    expect(patched.indexChanged).toBe(false);
    expect(patched.metadata).toMatchObject({ incorporatedBy: "汪旭" });
  });

  it("recursively summarizes and batch-updates reference incorporation", async () => {
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "批量纳入");
    const upload = async (relativePath: string, knowledgeRole: "reference" | "evidence") => {
      const signature = await createUpload(config, {
        topicId: topic.id,
        relativePath,
        size: 3,
        contentType: "application/pdf",
        knowledgeRole,
        ...(knowledgeRole === "evidence" ? { pdfPages: 1 } : {}),
      });
      storage.set(tempUploadPath(signature.uploadId), { body: "pdf", contentType: "application/pdf", etag: `etag-${storage.size}` });
      await completeUpload(config, {
        topicId: topic.id,
        uploadId: signature.uploadId,
        relativePath,
        size: 3,
        contentType: "application/pdf",
        knowledgeRole,
        ...(knowledgeRole === "evidence" ? { pdfPages: 1 } : {}),
        uploadedBy: "汪旭",
      });
    };
    await upload("研报/根目录.pdf", "reference");
    await upload("研报/子目录/嵌套.pdf", "reference");
    await upload("研报/子目录/时效资料.pdf", "evidence");

    const before = await listKnowledgeFiles(config, topic.id, "reference", "");
    expect(before.folders).toContainEqual(expect.objectContaining({
      path: "研报/",
      referenceCount: 2,
      incorporatedCount: 0,
    }));
    const versionBefore = (await readKnowledgeTopic(config, topic.id)).indexVersion;

    await expect(patchKnowledgeFolderIncorporation(config, {
      topicId: topic.id,
      prefix: "研报/",
      incorporated: true,
      updatedBy: "汪旭",
    })).resolves.toMatchObject({ matchedCount: 2, changedCount: 2, skippedCount: 0, failedCount: 0 });

    const after = await listKnowledgeFiles(config, topic.id, "reference", "");
    expect(after.folders).toContainEqual(expect.objectContaining({ path: "研报/", referenceCount: 2, incorporatedCount: 2 }));
    const nested = await listKnowledgeFiles(config, topic.id, "reference", "研报/子目录/");
    expect(nested.folders).toHaveLength(0);
    expect(nested.files).toContainEqual(expect.objectContaining({ path: "研报/子目录/嵌套.pdf", incorporatedAt: expect.any(String) }));
    expect(nested.files).not.toContainEqual(expect.objectContaining({ path: "研报/子目录/时效资料.pdf", incorporatedAt: expect.any(String) }));
    expect((await readKnowledgeTopic(config, topic.id)).indexVersion).toBe(versionBefore);

    await expect(patchKnowledgeFolderIncorporation(config, {
      topicId: topic.id,
      prefix: "研报/",
      incorporated: true,
      updatedBy: "汪旭",
    })).resolves.toMatchObject({ matchedCount: 2, changedCount: 0, skippedCount: 2, failedCount: 0 });
    await expect(patchKnowledgeFolderIncorporation(config, {
      topicId: topic.id,
      prefix: "研报/",
      incorporated: false,
      updatedBy: "汪旭",
    })).resolves.toMatchObject({ matchedCount: 2, changedCount: 2, skippedCount: 0, failedCount: 0 });

    const mockFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const key = decodeURIComponent(new URL(request.url).pathname.replace(/^\//, "")).replace(/^ai-knowledge-base\//, "");
      if (request.method === "PUT" && key === `topics/${topic.id}/file-meta/reference/研报/子目录/嵌套.pdf.json`) {
        return new Response("", { status: 500 });
      }
      return mockFetch(input, init);
    };
    await expect(patchKnowledgeFolderIncorporation(config, {
      topicId: topic.id,
      prefix: "研报/",
      incorporated: true,
      updatedBy: "汪旭",
    })).resolves.toMatchObject({ matchedCount: 2, changedCount: 1, skippedCount: 0, failedCount: 1 });
    globalThis.fetch = mockFetch;
    const partial = await listKnowledgeFiles(config, topic.id, "reference", "");
    expect(partial.folders).toContainEqual(expect.objectContaining({ path: "研报/", referenceCount: 2, incorporatedCount: 1 }));
  });

  it("treats the configured methodology path as hidden even when its metadata is missing", async () => {
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "异常状态");
    const methodologyPath = brandedMethodologyPath(topic.name);
    storage.set(sourcePath(topic.id, "methodology", methodologyPath), {
      body: "# 不应泄露",
      contentType: "text/markdown",
      etag: "etag-orphan-method",
    });

    const memberFiles = await listKnowledgeFiles(config, topic.id, "methodology", "");
    const adminFiles = await listKnowledgeFiles(config, topic.id, "methodology", "", null, { includeMethodology: true });
    expect(memberFiles.files).toHaveLength(0);
    expect(adminFiles.files[0]).toMatchObject({ path: methodologyPath, knowledgeRole: "methodology" });
    await expect(createDownloadUrl(config, topic.id, "methodology", methodologyPath)).rejects.toThrow("无权下载");
  });

  it("keeps historical topics on the legacy methodology path without migration", async () => {
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "历史专题");
    makeTopicLegacy(storage, topic.id);

    const methodology = await createUpload(config, {
      topicId: topic.id,
      relativePath: "任意历史名称.md",
      size: 11,
      contentType: "text/markdown",
      knowledgeRole: "methodology",
    });
    expect(methodology.path).toBe(METHODOLOGY_PATH);
    storage.set(tempUploadPath(methodology.uploadId), { body: "# 旧方法", contentType: "text/markdown", etag: "etag-legacy-method" });
    await completeUpload(config, {
      topicId: topic.id,
      uploadId: methodology.uploadId,
      relativePath: methodology.path,
      size: 11,
      contentType: "text/markdown",
      knowledgeRole: "methodology",
      uploadedBy: "汪旭",
    });

    expect(storage.has(sourcePath(topic.id, "methodology", METHODOLOGY_PATH))).toBe(true);
    expect(storage.has(sourcePath(topic.id, "methodology", brandedMethodologyPath(topic.name)))).toBe(false);
    const memberFiles = await listKnowledgeFiles(config, topic.id, "methodology", "");
    expect(memberFiles.files).toHaveLength(0);
    await expect(createDownloadUrl(config, topic.id, "methodology", METHODOLOGY_PATH)).rejects.toThrow("无权下载");
  });

  it("keeps methodology names independent across physical role trees", async () => {
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "路径保护");
    const evidence = await createUpload(config, {
      topicId: topic.id,
      relativePath: topic.methodologyPath,
      size: 1,
      contentType: "text/markdown",
      knowledgeRole: "evidence",
    });
    storage.set(tempUploadPath(evidence.uploadId), { body: "x", contentType: "text/markdown", etag: "etag-evidence-method-name" });
    await completeUpload(config, {
      topicId: topic.id,
      uploadId: evidence.uploadId,
      relativePath: evidence.path,
      size: 1,
      contentType: "text/markdown",
      knowledgeRole: "evidence",
      uploadedBy: "汪旭",
    });

    expect(sourcePath(topic.id, "evidence", evidence.path)).not.toBe(sourcePath(topic.id, "methodology", evidence.path));
    expect(storage.has(sourcePath(topic.id, "evidence", evidence.path))).toBe(true);
    expect(storage.has(sourcePath(topic.id, "methodology", evidence.path))).toBe(false);
  });

  it("rejects path separators in topic names and keeps the stored methodology path on rename", async () => {
    installCosMock();
    await expect(createKnowledgeTopic(config, "行业/机器人")).rejects.toThrow("不能包含");
    await expect(createKnowledgeTopic(config, "行业\\机器人")).rejects.toThrow("不能包含");

    const topic = await createKnowledgeTopic(config, "机器人");
    const renamed = await updateKnowledgeTopic(config, topic.id, "具身智能");
    expect(renamed).toMatchObject({
      name: "具身智能",
      methodologyPath: "嘉合杉升机器人方法论.md",
    });
    await expect(updateKnowledgeTopic(config, topic.id, "具身/智能")).rejects.toThrow("不能包含");
  });

  it("rejects unknown roles and allows the same logical path in isolated role trees", async () => {
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "角色校验");
    await expect(createUpload(config, {
      topicId: topic.id,
      relativePath: "报告.pdf",
      size: 3,
      contentType: "application/pdf",
      knowledgeRole: "evdience",
    })).rejects.toThrow("资料类型无效");

    const evidence = await createUpload(config, {
      topicId: topic.id,
      relativePath: "报告.pdf",
      size: 3,
      contentType: "application/pdf",
      pdfPages: 1,
      knowledgeRole: "evidence",
    });
    storage.set(tempUploadPath(evidence.uploadId), { body: "pdf", contentType: "application/pdf", etag: "etag-evidence" });
    await completeUpload(config, {
      topicId: topic.id,
      uploadId: evidence.uploadId,
      relativePath: evidence.path,
      size: 3,
      contentType: "application/pdf",
      pdfPages: 1,
      knowledgeRole: "evidence",
      uploadedBy: "汪旭",
    });
    const versionBefore = (await readKnowledgeTopic(config, topic.id)).indexVersion;

    const reference = await createUpload(config, {
      topicId: topic.id,
      relativePath: "报告.pdf",
      size: 3,
      contentType: "application/pdf",
      knowledgeRole: "reference",
    });
    storage.set(tempUploadPath(reference.uploadId), { body: "new", contentType: "application/pdf", etag: "etag-reference" });
    await completeUpload(config, {
      topicId: topic.id,
      uploadId: reference.uploadId,
      relativePath: reference.path,
      size: 3,
      contentType: "application/pdf",
      knowledgeRole: "reference",
      uploadedBy: "汪旭",
    });
    expect((await readKnowledgeTopic(config, topic.id)).indexVersion).toBe(versionBefore);
    expect(storage.has(sourcePath(topic.id, "evidence", "报告.pdf"))).toBe(true);
    expect(storage.has(sourcePath(topic.id, "reference", "报告.pdf"))).toBe(true);
    await expect(listKnowledgeFiles(config, topic.id, "evidence", "")).resolves.toMatchObject({
      role: "evidence",
      files: [expect.objectContaining({ path: "报告.pdf", knowledgeRole: "evidence" })],
    });
    await expect(listKnowledgeFiles(config, topic.id, "reference", "")).resolves.toMatchObject({
      role: "reference",
      files: [expect.objectContaining({ path: "报告.pdf", knowledgeRole: "reference" })],
    });
  });
});

describe("administrator API enforcement", () => {
  it("requires an administrator session for folder incorporation", async () => {
    const response = await patchFolder({
      request: new Request("https://example.com/api/drive/folder", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicId: "t_abcdefghijkl", prefix: "研报/", incorporated: true }),
      }),
      env,
    } as never);
    expect(response.status).toBe(401);
  });

  it("preserves JSON list responses and streams real file-list phases in order", async () => {
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "流式列表");
    const signature = await createUpload(config, {
      topicId: topic.id,
      relativePath: "报告.txt",
      size: 3,
      contentType: "text/plain",
    });
    storage.set(tempUploadPath(signature.uploadId), { body: "abc", contentType: "text/plain", etag: "etag-stream" });
    await completeUpload(config, {
      topicId: topic.id,
      uploadId: signature.uploadId,
      relativePath: signature.path,
      size: 3,
      contentType: "text/plain",
      uploadedBy: "汪旭",
    });
    const cookie = (await createSessionCookie(env, "https://example.com", "汪旭")).split(";", 1)[0];
    const url = `https://example.com/api/drive/list?topicId=${topic.id}&role=evidence&prefix=`;

    const json = await listFiles({
      request: new Request(url, { headers: { cookie } }),
      env,
    } as never);
    expect(json.headers.get("content-type")).toContain("application/json");
    expect(await json.json()).toMatchObject({ prefix: "", files: [expect.objectContaining({ path: "报告.txt" })] });

    const stream = await listFiles({
      request: new Request(url, { headers: { cookie, accept: "text/event-stream" } }),
      env,
    } as never);
    const body = await stream.text();
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const phases = [...body.matchAll(/event: phase\ndata: (.+)/g)].map((match) => JSON.parse(match[1]) as {
      stage: string;
      state: string;
      completed?: number;
      total?: number;
    });
    expect(phases.map(({ stage, state }) => `${stage}:${state}`)).toEqual([
      "topic:active",
      "topic:complete",
      "objects:active",
      "objects:complete",
      "metadata:active",
      "metadata:active",
      "metadata:complete",
      "assembling:active",
      "assembling:complete",
    ]);
    expect(phases.find((phase) => phase.stage === "metadata" && phase.state === "complete")).toMatchObject({
      completed: 1,
      total: 1,
    });
    expect(body).toContain("event: result");
    expect(body).toContain("event: done");
  });

  it("reports a complete zero-of-zero metadata phase for an empty directory", async () => {
    installCosMock();
    const topic = await createKnowledgeTopic(config, "空目录");
    const updates: Array<{ stage: string; state: string; completed?: number; total?: number }> = [];
    const result = await listKnowledgeFiles(config, topic.id, "evidence", "", null, {
      onProgress: (update) => updates.push(update),
    });
    expect(result.files).toEqual([]);
    expect(updates).toContainEqual({ stage: "metadata", state: "complete", completed: 0, total: 0 });
    expect(updates.at(-1)).toEqual({ stage: "assembling", state: "complete" });
  });

  it("reports the real failing stage when COS directory listing fails", async () => {
    installCosMock();
    const topic = await createKnowledgeTopic(config, "异常目录");
    const workingFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const url = new URL(request.url);
      if (url.searchParams.get("list-type") === "2" && url.searchParams.get("delimiter") === "/") {
        return new Response("upstream unavailable", { status: 503 });
      }
      return workingFetch(input, init);
    };
    const cookie = (await createSessionCookie(env, "https://example.com", "汪旭")).split(";", 1)[0];
    const response = await listFiles({
      request: new Request(`https://example.com/api/drive/list?topicId=${topic.id}&role=evidence&prefix=`, {
        headers: { cookie, accept: "text/event-stream" },
      }),
      env,
    } as never);
    const body = await response.text();
    expect(body).toContain('event: phase\ndata: {"stage":"objects","state":"active"');
    expect(body).toContain('event: error\ndata: {"stage":"objects","code":"FILE_LIST_FAILED"');
    expect(body).not.toContain("event: result");
    expect(body).not.toContain("event: done");
  });

  it("returns 403 to viewers before issuing an upload URL", async () => {
    installCosMock();
    const cookie = (await createSessionCookie(env, "https://example.com", "王小明")).split(";", 1)[0];
    const response = await uploadUrl({
      request: new Request("https://example.com/api/drive/upload-url", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ topicId: "t_abcdefghijkl", relativePath: "a.txt", size: 1, contentType: "text/plain" }) }),
      env,
    } as never);
    expect(response.status).toBe(403);
  });

  it("returns per-file registration results without exposing internal failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "批量登记");
    const valid = await createUpload(config, {
      topicId: topic.id,
      relativePath: "valid.txt",
      size: 3,
      contentType: "text/plain",
      knowledgeRole: "evidence",
    });
    storage.set(tempUploadPath(valid.uploadId), { body: "abc", contentType: "text/plain", etag: "etag-valid" });
    const cookie = (await createSessionCookie(env, "https://example.com", "汪旭")).split(";", 1)[0];
    const response = await uploadComplete({
      request: new Request("https://example.com/api/drive/upload-complete", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({
          topicId: topic.id,
          files: [
            {
              uploadId: valid.uploadId,
              relativePath: valid.path,
              size: 3,
              contentType: "text/plain",
              knowledgeRole: "evidence",
            },
            {
              uploadId: "u_abcdefghijklmnopqrstuvwx",
              relativePath: "missing.txt",
              size: 3,
              contentType: "text/plain",
              knowledgeRole: "evidence",
            },
            null,
          ],
        }),
      }),
      env,
    } as never);
    const body = await response.json() as {
      ok: boolean;
      files: Array<{ path: string }>;
      failures: Array<{ relativePath: string; code: string; requestId: string; message: string }>;
    };
    expect(response.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.files).toEqual([expect.objectContaining({ path: "valid.txt" })]);
    expect(body.failures).toEqual([
      expect.objectContaining({
        relativePath: "missing.txt",
        code: "FILE_REGISTRATION_FAILED",
        retryable: true,
        message: "文件登记失败，请重新上传该文件。",
        requestId: expect.any(String),
      }),
      expect.objectContaining({
        relativePath: "",
        code: "FILE_REGISTRATION_FAILED",
        retryable: true,
        message: "文件登记失败，请重新上传该文件。",
        requestId: expect.any(String),
      }),
    ]);
    expect(body.failures[0].requestId).toBe(body.failures[1].requestId);
    expect(JSON.stringify(body)).not.toContain("COS");
  });
});

type Stored = { body: string; contentType: string; etag: string };

function installCosMock(): Map<string, Stored> {
  const storage = new Map<string, Stored>();
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.replace(/^\//, "")).replace(/^ai-knowledge-base\//, "");
    if (url.searchParams.get("list-type") === "2") return listResponse(storage, url.searchParams.get("prefix") || "", url.searchParams.get("delimiter"));
    if (request.method === "PUT") {
      const copySource = request.headers.get("x-cos-copy-source");
      if (copySource) {
        const sourceKey = decodeURIComponent(copySource.slice(copySource.indexOf("/") + 1)).replace(/^ai-knowledge-base\//, "");
        const source = storage.get(sourceKey);
        if (!source) return new Response("", { status: 404 });
        storage.set(key, { ...source });
        return new Response("", { status: 200 });
      }
      const body = await request.text();
      storage.set(key, { body, contentType: request.headers.get("content-type") || "application/octet-stream", etag: `etag-${storage.size + 1}` });
      return new Response("", { status: 200 });
    }
    if (request.method === "DELETE") {
      storage.delete(key);
      return new Response(null, { status: 204 });
    }
    const stored = storage.get(key);
    if (!stored) return new Response("", { status: 404 });
    if (request.method === "HEAD") return new Response(null, { headers: { "content-length": String(new TextEncoder().encode(stored.body).length), "content-type": stored.contentType, etag: `"${stored.etag}"` } });
    return new Response(stored.body, { headers: { "content-type": stored.contentType, etag: `"${stored.etag}"` } });
  };
  return storage;
}

function makeTopicLegacy(storage: Map<string, Stored>, topicId: string): void {
  const key = `topics/${topicId}/topic.json`;
  const stored = storage.get(key);
  if (!stored) throw new Error("topic fixture missing");
  const topic = JSON.parse(stored.body) as Record<string, unknown>;
  delete topic.methodologyPath;
  storage.set(key, { ...stored, body: JSON.stringify(topic, null, 2) });
}

function removeTopicStorageLayout(storage: Map<string, Stored>, topicId: string): void {
  const key = `topics/${topicId}/topic.json`;
  const stored = storage.get(key);
  if (!stored) throw new Error("topic fixture missing");
  const topic = JSON.parse(stored.body) as Record<string, unknown>;
  delete topic.storageLayout;
  storage.set(key, { ...stored, body: JSON.stringify(topic, null, 2) });
}

function listResponse(storage: Map<string, Stored>, rawPrefix: string, delimiter: string | null): Response {
  const prefix = rawPrefix.replace(/^ai-knowledge-base\//, "");
  const folders = new Set<string>();
  const contents: string[] = [];
  for (const [key, value] of storage) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    if (delimiter && rest.includes(delimiter)) {
      folders.add(`${prefix}${rest.split(delimiter, 1)[0]}${delimiter}`);
      continue;
    }
    contents.push(`<Contents><Key>ai-knowledge-base/${key}</Key><LastModified>2026-07-21T00:00:00.000Z</LastModified><ETag>\"${value.etag}\"</ETag><Size>${new TextEncoder().encode(value.body).length}</Size></Contents>`);
  }
  const common = [...folders].map((folder) => `<CommonPrefixes><Prefix>ai-knowledge-base/${folder}</Prefix></CommonPrefixes>`).join("");
  return new Response(`<?xml version="1.0"?><ListBucketResult>${common}${contents.join("")}</ListBucketResult>`, { headers: { "content-type": "application/xml" } });
}
