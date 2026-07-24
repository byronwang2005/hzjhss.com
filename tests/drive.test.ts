import { afterEach, describe, expect, it } from "vitest";
import { getDriveConfig, KNOWLEDGE_ROOT_PREFIX, type DriveEnv } from "../src/drive/server/config";
import {
  completeUpload,
  createKnowledgeTopic,
  createUpload,
  filePolicy,
  listKnowledgeFiles,
  listKnowledgeTopics,
  processingStatusPath,
  sourcePath,
  tempUploadPath,
} from "../src/drive/server/knowledge";
import { createSessionCookie, getDriveSession, isDriveAdmin } from "../src/drive/server/session";
import { jsonResponse } from "../src/drive/server/http";
import { onRequestPost as uploadUrl } from "../functions/api/drive/upload-url";

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

afterEach(() => { globalThis.fetch = originalFetch; });

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
    expect(JSON.parse(storage.get(processingStatusPath(topic.id, relativePath))!.body)).toMatchObject({ state: "queued", sourceEtag: "etag-source" });

    const topics = await listKnowledgeTopics(config);
    expect(topics).toHaveLength(1);
    expect(topics[0]).toMatchObject({ id: topic.id, name: "新能源", ready: false });
    const files = await listKnowledgeFiles(config, topic.id, "");
    expect(files.folders[0].name).toBe("报告");
  });

  it("deletes a mismatched upload and refuses registration", async () => {
    const storage = installCosMock();
    const topic = await createKnowledgeTopic(config, "测试");
    const signature = await createUpload(config, { topicId: topic.id, relativePath: "a.txt", size: 3, contentType: "text/plain" });
    storage.set(tempUploadPath(signature.uploadId), { body: "wrong", contentType: "text/plain", etag: "etag" });
    await expect(completeUpload(config, { topicId: topic.id, uploadId: signature.uploadId, relativePath: "a.txt", size: 3, contentType: "text/plain", uploadedBy: "汪旭" })).rejects.toThrow("实际大小");
    expect(storage.has(tempUploadPath(signature.uploadId))).toBe(false);
  });
});

describe("administrator API enforcement", () => {
  it("returns 403 to viewers before issuing an upload URL", async () => {
    installCosMock();
    const cookie = (await createSessionCookie(env, "https://example.com", "王小明")).split(";", 1)[0];
    const response = await uploadUrl({
      request: new Request("https://example.com/api/drive/upload-url", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ topicId: "t_abcdefghijkl", relativePath: "a.txt", size: 1, contentType: "text/plain" }) }),
      env,
    } as never);
    expect(response.status).toBe(403);
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
