import { describe, expect, it, vi } from "vitest";
import type { DriveEnv } from "../src/drive/server/config";
import {
  buildCodexHandoffMarkdown,
  CODEX_HANDOFF_STORAGE_PREFIX,
  CODEX_HANDOFF_TTL_SECONDS,
  codexHandoffObjectPath,
  codexHandoffQuery,
  createCodexContinuationPrompt,
  createCodexHandoffAccess,
  normalizeCodexHandoffMessages,
  verifyCodexHandoffAccess,
} from "../src/drive/server/codex-handoff";
import { createSessionCookie } from "../src/drive/server/session";
import {
  onRequestGet as readHandoff,
  onRequestPost as createHandoff,
} from "../functions/api/drive/codex-handoff";

const env: DriveEnv = {
  DRIVE_SESSION_SECRET: "secret",
};
const messages = [
  { role: "user", content: "请分析新能源行业" },
  { role: "assistant", content: "行业正在扩张。[周报.pdf，第 2 页]" },
] as const;

describe("Codex handoff context", () => {
  it("validates complete alternating conversations and builds the retrieval query", () => {
    const normalized = normalizeCodexHandoffMessages(messages);
    expect(normalized).toEqual(messages);
    expect(codexHandoffQuery(normalized)).toBe("请分析新能源行业");
    expect(() => normalizeCodexHandoffMessages(messages.slice(0, 1))).toThrow("完整问答");
    expect(() => normalizeCodexHandoffMessages([
      messages[0],
      { role: "user", content: "顺序错误" },
    ])).toThrow("顺序无效");
  });

  it("packs the full conversation plus evidence and methodology excerpts without download URLs", () => {
    const markdown = buildCodexHandoffMarkdown(
      { contextWindowTokens: 20_000, maxOutputTokens: 2_000 },
      {
        messages: [...messages],
        scopeLabel: "专题：新能源",
        createdAt: new Date("2026-07-24T12:00:00Z"),
        expiresAt: new Date("2026-07-24T14:00:00Z"),
        retrieved: {
          evidence: [{
            id: "e1",
            topicId: "t_abcdefghijkl",
            topicName: "新能源",
            path: "周报.pdf",
            fileName: "周报.pdf",
            content: "装机量继续增长。",
            locator: "第 2 页",
            etag: "e",
            score: 10,
            knowledgeRole: "evidence",
            reportDate: "2026-07-20",
          }],
          methodology: [{
            id: "m1",
            topicId: "t_abcdefghijkl",
            topicName: "新能源",
            path: "__methodology__.md",
            fileName: "__methodology__.md",
            content: "先分析需求，再分析供给。",
            locator: "行业框架",
            etag: "m",
            score: 8,
            knowledgeRole: "methodology",
          }],
        },
      },
    );

    expect(markdown).toContain("## 完整对话");
    expect(markdown).toContain("请分析新能源行业");
    expect(markdown).toContain("装机量继续增长");
    expect(markdown).toContain("先分析需求，再分析供给");
    expect(markdown).toContain("来源：专题方法论");
    expect(markdown).not.toContain("__methodology__.md");
    expect(markdown).not.toContain("行业框架");
    expect(markdown).not.toContain("不可信数据");
    expect(markdown).not.toMatch(/https?:\/\/.*周报/);
  });

  it("refuses to silently truncate a conversation that exceeds the transport budget", () => {
    expect(() => buildCodexHandoffMarkdown(
      { contextWindowTokens: 120, maxOutputTokens: 20 },
      {
        messages: [
          { role: "user", content: "问题".repeat(100) },
          { role: "assistant", content: "回答".repeat(100) },
        ],
        scopeLabel: "全部专题",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1_000),
        retrieved: { evidence: [], methodology: [] },
      },
    )).toThrow("完整对话超过交接容量");
  });

  it("creates purpose-signed two-hour bearer links and rejects tampering or expiry", async () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const now = new Date("2026-07-24T12:00:00Z");
    const expiresAt = new Date(now.getTime() + CODEX_HANDOFF_TTL_SECONDS * 1_000);
    const access = await createCodexHandoffAccess(env, "https://hzjhss.com/", id, expiresAt);
    expect(access.contextUrl).toContain("/api/drive/codex-handoff?");
    expect(codexHandoffObjectPath(id)).toBe(`${CODEX_HANDOFF_STORAGE_PREFIX}${id}.md`);
    await expect(verifyCodexHandoffAccess(env, access.contextUrl, now)).resolves.toMatchObject({ status: "valid", id });

    const tampered = new URL(access.contextUrl);
    tampered.searchParams.set("id", "223e4567-e89b-42d3-a456-426614174000");
    await expect(verifyCodexHandoffAccess(env, tampered.toString(), now)).resolves.toEqual({ status: "invalid" });
    await expect(verifyCodexHandoffAccess(env, access.contextUrl, expiresAt)).resolves.toMatchObject({ status: "expired", id });
  });

  it("keeps safety policy out of the visible fallback prompt and pre-fills a Codex deep link", () => {
    const continuation = createCodexContinuationPrompt("https://hzjhss.com/api/drive/codex-handoff?token=short");
    expect(continuation.fallbackPrompt).toContain("临时上下文链接");
    expect(continuation.fallbackPrompt).not.toContain("不可信数据");
    expect(new URL(continuation.deepLink).searchParams.get("prompt")).toContain("不可信数据");
    expect(new URL(continuation.deepLink).searchParams.get("prompt")).toContain(continuation.fallbackPrompt);
    expect(continuation.deepLink).toMatch(/^codex:\/\/new\?prompt=/);
  });

  it("requires a signed-in site session before creating a handoff", async () => {
    const response = await createHandoff({
      request: new Request("https://hzjhss.com/api/drive/codex-handoff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope: "global", messages }),
      }),
      env,
    } as never);
    expect(response.status).toBe(401);
  });

  it("rejects an oversized body while streaming even without Content-Length", async () => {
    const requestEnv: DriveEnv = {
      ...env,
      AI_API_KEY: "test",
      AI_BASE_URL: "https://ai.example.com",
      AI_MODEL: "test-model",
      AI_CONTEXT_WINDOW_TOKENS: "1000",
      AI_MAX_OUTPUT_TOKENS: "100",
    };
    const cookie = (await createSessionCookie(requestEnv, "https://hzjhss.com/", "测试用户")).split(";")[0];
    const response = await createHandoff({
      request: new Request("https://hzjhss.com/api/drive/codex-handoff", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          scope: "global",
          messages: [
            { role: "user", content: "问题".repeat(40_000) },
            { role: "assistant", content: "回答" },
          ],
        }),
      }),
      env: requestEnv,
    } as never);

    expect(response.status).toBe(413);
  });

  it("serves a valid bearer link without a site cookie and disables caching", async () => {
    const driveEnv: DriveEnv = {
      ...env,
      COS_SECRET_ID: "id",
      COS_SECRET_KEY: "key",
      COS_BUCKET: "bucket",
      COS_REGION: "ap-shanghai",
    };
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const access = await createCodexHandoffAccess(
      driveEnv,
      "https://hzjhss.com/",
      id,
      new Date(Date.now() + 60_000),
    );
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("# 已签名的交接内容", { status: 200 }),
    );
    const response = await readHandoff({
      request: new Request(access.contextUrl),
      env: driveEnv,
      waitUntil: vi.fn(),
    } as never);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("已签名的交接内容");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockRestore();
  });
});
