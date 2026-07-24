// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { DriveAiQa } from "../src/drive/client/qa-chat";

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stubMedia(options: { reducedMotion?: boolean; coarsePointer?: boolean } = {}): void {
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)"
      ? Boolean(options.reducedMotion)
      : query === "(pointer: coarse)" && Boolean(options.coarsePointer),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
}

async function mountQa(scope: "global" | "topic" = "global"): Promise<DriveAiQa> {
  const qa = new DriveAiQa();
  qa.scope = scope;
  qa.topicId = scope === "topic" ? "t_abcdefghijkl" : "";
  qa.topicName = scope === "topic" ? "新能源" : "";
  qa.displayName = scope === "global" ? "汪旭" : "";
  qa.ready = true;
  document.body.appendChild(qa);
  await qa.updateComplete;
  return qa;
}

async function waitForAnswer(qa: DriveAiQa): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    await Promise.resolve();
    await qa.updateComplete;
    if (qa.textContent?.includes("回答完成")) return;
  }
}

async function waitForText(qa: DriveAiQa, text: string): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await qa.updateComplete;
    if (qa.textContent?.includes(text)) return;
  }
}

describe("drive AI Q&A component", () => {
  it("sends global scope and renders streamed Markdown safely", async () => {
    let requestBody: Record<string, unknown> | null = null;
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response('event: delta\ndata: {"content":"**可追溯回答**"}\n\nevent: done\ndata: {"ok":true}\n\n', {
        headers: { "content-type": "text/event-stream" },
      });
    }));
    const qa = await mountQa("global");
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "请比较专题";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);

    expect(requestBody).toMatchObject({ scope: "global" });
    expect(requestBody).not.toHaveProperty("prefix");
    expect(qa.querySelector("strong")?.textContent).toBe("可追溯回答");
    expect(qa.querySelector(".drive-ai-qa-heading p")).toBeNull();
  });

  it("shows a thinking status without rendering reasoning content, then streams the final answer", async () => {
    const encoder = new TextEncoder();
    let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller;
        controller.enqueue(encoder.encode('event: thinking\ndata: {"active":true}\n\n'));
      },
    }), { headers: { "content-type": "text/event-stream" } })));
    const qa = await mountQa("global");
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "需要深度分析";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForText(qa, "正在深度思考");

    expect(qa.textContent).toContain("正在深度思考");
    expect(qa.textContent).not.toContain("内部思维链");

    streamController?.enqueue(encoder.encode('event: thinking\ndata: {"active":false}\n\nevent: delta\ndata: {"content":"最终结论"}\n\nevent: done\ndata: {"ok":true}\n\n'));
    streamController?.close();
    await waitForAnswer(qa);
    expect(qa.textContent).toContain("最终结论");
    expect(qa.textContent).toContain("回答完成");
  });

  it("sends the topic prefix and resets when the topic changes", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('event: delta\ndata: {"content":"专题回答"}\n\n')));
    const qa = await mountQa("topic");
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "专题问题";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);
    expect(qa.textContent).toContain("专题回答");

    qa.topicId = "t_mnopqrstuvwx";
    qa.topicName = "半导体";
    await qa.updateComplete;
    expect(qa.textContent).not.toContain("专题回答");
    expect(qa.textContent).toContain("对半导体提问");
    expect(qa.querySelector(".drive-ai-qa-heading p")).toBeNull();
  });

  it("uses scope-specific empty-state titles", async () => {
    stubMedia({ reducedMotion: true });
    vi.spyOn(Math, "random").mockReturnValue(0);
    const globalQa = await mountQa("global");
    const topicQa = await mountQa("topic");

    expect(globalQa.querySelector(".drive-ai-qa-empty h3")?.textContent).toBe("欢迎回来，汪旭👋");
    expect(globalQa.querySelector(".drive-ai-qa-empty h3")?.getAttribute("aria-label")).toBe("欢迎回来，汪旭👋");
    expect(globalQa.querySelector(".drive-ai-qa-typewriter")?.getAttribute("aria-hidden")).toBe("true");
    expect(topicQa.querySelector(".drive-ai-qa-empty h3")?.textContent).toBe("对新能源提问");
    expect(globalQa.querySelector(".drive-ai-qa-scope")?.textContent).toContain("全部专题");
    expect(topicQa.querySelector(".drive-ai-qa-scope")?.textContent).toContain("新能源");
  });

  it("keeps ready empty states focused on direct questions", async () => {
    const globalQa = await mountQa("global");
    const topicQa = await mountQa("topic");

    expect(globalQa.querySelector(".drive-ai-qa-capabilities")).toBeNull();
    expect(globalQa.querySelector(".drive-ai-qa-suggestions")).toBeNull();
    expect(topicQa.querySelector(".drive-ai-qa-suggestions")).toBeNull();
    expect(globalQa.textContent).not.toContain("直接提问，或从下面三个方向开始");
    expect(topicQa.textContent).not.toContain("直接提问，或从下面三个方向开始");
  });

  it("renders all six localized greetings with the display name", async () => {
    stubMedia({ reducedMotion: true });
    const expected = [
      "欢迎回来，汪旭👋",
      "Welcome back, 汪旭 👋",
      "おかえりなさい、汪旭👋",
      "다시 오신 것을 환영합니다, 汪旭 👋",
      "Bon retour, 汪旭 👋",
      "Qué bueno verte de nuevo, 汪旭 👋",
    ];
    const random = vi.spyOn(Math, "random");

    for (let index = 0; index < expected.length; index += 1) {
      random.mockReturnValue((index + 0.1) / expected.length);
      const qa = await mountQa("global");
      expect(qa.querySelector(".drive-ai-qa-empty h3")?.textContent).toBe(expected[index]);
      qa.remove();
    }
  });

  it("types, holds, deletes whole graphemes, and picks a different next language", async () => {
    vi.useFakeTimers();
    stubMedia();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const qa = await mountQa("global");
    const title = qa.querySelector(".drive-ai-qa-empty h3")!;
    const typed = qa.querySelector(".drive-ai-qa-typewriter")!;

    expect(title.getAttribute("aria-label")).toBe("欢迎回来，汪旭👋");
    expect(typed.textContent).toBe("");

    await vi.advanceTimersByTimeAsync(70 * 8);
    await qa.updateComplete;
    expect(typed.textContent).toBe("欢迎回来，汪旭👋");

    await vi.advanceTimersByTimeAsync(1_800);
    await qa.updateComplete;
    expect(typed.textContent).toBe("欢迎回来，汪旭");
    expect(typed.textContent).not.toContain("\uFFFD");

    await vi.advanceTimersByTimeAsync(35 * 7 + 250);
    await qa.updateComplete;
    expect(title.getAttribute("aria-label")).toBe("Welcome back, 汪旭 👋");
    expect(typed.textContent).toBe("");
  });

  it("shows one complete random greeting when reduced motion is requested", async () => {
    vi.useFakeTimers();
    stubMedia({ reducedMotion: true });
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const qa = await mountQa("global");
    const title = qa.querySelector(".drive-ai-qa-empty h3")!;
    const typed = qa.querySelector(".drive-ai-qa-typewriter")!;

    expect(title.getAttribute("aria-live")).toBe("off");
    expect(title.getAttribute("aria-label")).toBe("Qué bueno verte de nuevo, 汪旭 👋");
    expect(typed.textContent).toBe("Qué bueno verte de nuevo, 汪旭 👋");
    expect(typed.classList.contains("is-active")).toBe(false);

    await vi.advanceTimersByTimeAsync(20_000);
    expect(typed.textContent).toBe("Qué bueno verte de nuevo, 汪旭 👋");
  });

  it("falls back to a friendly name and stops typing after disconnect", async () => {
    vi.useFakeTimers();
    stubMedia();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const qa = await mountQa("global");
    qa.displayName = " ";
    await qa.updateComplete;
    const title = qa.querySelector(".drive-ai-qa-empty h3")!;
    const typed = qa.querySelector(".drive-ai-qa-typewriter")!;

    expect(title.getAttribute("aria-label")).toContain("朋友");
    expect(title.getAttribute("aria-label")).not.toContain("汪旭");
    await vi.advanceTimersByTimeAsync(70);
    await qa.updateComplete;
    const beforeDisconnect = typed.textContent;
    qa.remove();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(typed.textContent).toBe(beforeDisconnect);
  });

  it("stops the greeting during a conversation and restarts after clearing it", async () => {
    vi.useFakeTimers();
    stubMedia();
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.stubGlobal("fetch", vi.fn(async () => new Response('event: delta\ndata: {"content":"回答"}\n\n')));
    const qa = await mountQa("global");
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "开始问答";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);

    expect(qa.querySelector(".drive-ai-qa-typewriter")).toBeNull();
    qa.querySelector<HTMLButtonElement>(".drive-ai-qa-clear")!.click();
    await qa.updateComplete;
    expect(qa.querySelector(".drive-ai-qa-typewriter")).not.toBeNull();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });

  it("marks only unavailable knowledge states as having a notice row", async () => {
    const readyQa = await mountQa("global");
    const waitingQa = new DriveAiQa();
    waitingQa.scope = "topic";
    waitingQa.topicName = "等待处理";
    waitingQa.ready = false;
    document.body.appendChild(waitingQa);
    await waitingQa.updateComplete;

    expect(readyQa.classList.contains("has-notice")).toBe(false);
    expect(readyQa.querySelector(".drive-ai-qa")?.classList.contains("has-notice")).toBe(false);
    expect(waitingQa.querySelector(".drive-ai-qa")?.classList.contains("has-notice")).toBe(true);
    expect(waitingQa.querySelector(".drive-ai-qa-empty h3")?.textContent).toBe("等待文件处理");
  });

  it("does not impose a product-level question length limit", async () => {
    const qa = await mountQa("global");
    expect(qa.querySelector("textarea")?.hasAttribute("maxlength")).toBe(false);
  });

  it("renders an integrated composer and submits with Enter on fine pointers", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('event: delta\ndata: {"content":"回答"}\n\n')));
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    const qa = await mountQa();
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    const submit = qa.querySelector<HTMLButtonElement>('.drive-ai-qa-action[type="submit"]')!;

    expect(qa.querySelector(".drive-ai-qa-field")).toBeNull();
    expect(textarea.getAttribute("aria-label")).toBe("您的问题");
    expect(submit.textContent?.trim()).toBe("");

    textarea.value = "使用回车发送";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    textarea.dispatchEvent(event);
    await waitForAnswer(qa);

    expect(event.defaultPrevented).toBe(true);
    expect(qa.textContent).toContain("回答");
  });

  it("keeps newlines for Shift+Enter, composition, and coarse pointers", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const qa = await mountQa();
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "多行问题";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;

    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true, cancelable: true }));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true }));
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("auto-grows the composer and resets it after submission", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('event: delta\ndata: {"content":"回答"}\n\n')));
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    const qa = await mountQa();
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    Object.defineProperty(textarea, "scrollHeight", { configurable: true, get: () => textarea.value ? 240 : 52 });

    textarea.value = "很长的问题";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;
    await Promise.resolve();
    expect(textarea.style.height).toBe("156px");

    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);
    await Promise.resolve();
    expect(textarea.style.height).toBe("52px");
  });

  it("shows the Codex CTA only after the latest assistant answer completes", async () => {
    const encoder = new TextEncoder();
    let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller;
      },
    }), { headers: { "content-type": "text/event-stream" } })));
    const qa = await mountQa();
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "继续研究";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await qa.updateComplete;
    expect(qa.querySelector(".drive-codex-handoff-cta")).toBeNull();

    streamController?.enqueue(encoder.encode('event: delta\ndata: {"content":"完成回答"}\n\n'));
    streamController?.close();
    await waitForAnswer(qa);
    expect(qa.querySelector<HTMLButtonElement>(".drive-codex-handoff-cta")?.textContent).toContain("在 Codex 继续");
  });

  it("renders four SVG handoff stages and follows real SSE stage events", async () => {
    let handoffBody: Record<string, unknown> | null = null;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/qa")) {
        return new Response('event: delta\ndata: {"content":"研究结论"}\n\n');
      }
      handoffBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        'event: stage\ndata: {"stage":"retrieving"}\n\n'
        + 'event: stage\ndata: {"stage":"packing"}\n\n'
        + 'event: stage\ndata: {"stage":"sealing"}\n\n'
        + 'event: ready\ndata: {"deepLink":"codex://new?prompt=test","contextUrl":"https://hzjhss.com/context","fallbackPrompt":"继续研究 https://hzjhss.com/context","expiresAt":"2026-07-24T14:00:00.000Z"}\n\n',
        { headers: { "content-type": "text/event-stream" } },
      );
    }));
    const qa = await mountQa("topic");
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "研究问题";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);
    qa.querySelector<HTMLButtonElement>(".drive-codex-handoff-cta")!.click();
    await waitForText(qa, "正在唤起 Codex");

    expect(handoffBody).toMatchObject({
      scope: "topic",
      topicId: "t_abcdefghijkl",
      messages: [
        { role: "user", content: "研究问题" },
        { role: "assistant", content: "研究结论" },
      ],
    });
    expect(qa.querySelectorAll(".drive-codex-handoff-step")).toHaveLength(4);
    expect(qa.querySelectorAll(".drive-codex-handoff-visual svg")).toHaveLength(8);
    expect(qa.querySelector('[data-handoff-stage="launching"]')).not.toBeNull();
  });

  it("shows elapsed time for a slow handoff and exposes recovery after launch timeout", async () => {
    vi.useFakeTimers();
    stubMedia({ reducedMotion: true });
    const encoder = new TextEncoder();
    let handoffController: ReadableStreamDefaultController<Uint8Array> | undefined;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/qa")) return new Response('event: delta\ndata: {"content":"回答"}\n\n');
      return new Response(new ReadableStream<Uint8Array>({
        start(controller) {
          handoffController = controller;
          controller.enqueue(encoder.encode('event: stage\ndata: {"stage":"retrieving"}\n\n'));
        },
      }), { headers: { "content-type": "text/event-stream" } });
    }));
    const qa = await mountQa();
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "慢速研究";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);
    qa.querySelector<HTMLButtonElement>(".drive-codex-handoff-cta")!.click();
    await vi.advanceTimersByTimeAsync(3_000);
    await qa.updateComplete;
    expect(qa.textContent).toContain("已等待 3 秒");

    handoffController?.enqueue(encoder.encode('event: stage\ndata: {"stage":"packing"}\n\nevent: stage\ndata: {"stage":"sealing"}\n\nevent: ready\ndata: {"deepLink":"codex://new?prompt=test","contextUrl":"https://hzjhss.com/context","fallbackPrompt":"继续研究","expiresAt":"2026-07-24T14:00:00.000Z"}\n\n'));
    handoffController?.close();
    await Promise.resolve();
    await qa.updateComplete;
    await vi.advanceTimersByTimeAsync(2_500);
    await qa.updateComplete;

    expect(qa.textContent).toContain("未检测到 Codex 打开");
    expect(qa.textContent).toContain("重新打开 Codex");
    expect(qa.textContent).toContain("复制交接提示");
    expect(qa.querySelector('a[href="https://hzjhss.com/docs/articles/codex-setup"]')).not.toBeNull();
  });

  it("marks the handoff complete when Codex takes window focus", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/qa")) return new Response('event: delta\ndata: {"content":"回答"}\n\n');
      return new Response('event: ready\ndata: {"deepLink":"codex://new?prompt=test","contextUrl":"https://hzjhss.com/context","fallbackPrompt":"继续研究","expiresAt":"2026-07-24T14:00:00.000Z"}\n\n');
    }));
    const qa = await mountQa();
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "切出测试";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);
    qa.querySelector<HTMLButtonElement>(".drive-codex-handoff-cta")!.click();
    await waitForText(qa, "正在唤起 Codex");
    window.dispatchEvent(new Event("blur"));
    await qa.updateComplete;

    expect(qa.textContent).toContain("已交接至 Codex");
    expect(qa.textContent).toContain("上下文链接将在");
    expect(qa.querySelector('[data-handoff-stage="complete"]')).not.toBeNull();
  });

  it("falls back to selectable prompt text when clipboard access fails", async () => {
    vi.useFakeTimers();
    stubMedia({ reducedMotion: true });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(async () => { throw new Error("denied"); }) },
    });
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/qa")) return new Response('event: delta\ndata: {"content":"回答"}\n\n');
      return new Response('event: ready\ndata: {"deepLink":"codex://new?prompt=test","contextUrl":"https://hzjhss.com/context","fallbackPrompt":"手动复制内容","expiresAt":"2026-07-24T14:00:00.000Z"}\n\n');
    }));
    const qa = await mountQa();
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "复制测试";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);
    qa.querySelector<HTMLButtonElement>(".drive-codex-handoff-cta")!.click();
    await Promise.resolve();
    await qa.updateComplete;
    await vi.advanceTimersByTimeAsync(2_500);
    await qa.updateComplete;
    const copy = Array.from(qa.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.includes("复制交接提示"));
    copy?.click();
    await Promise.resolve();
    await qa.updateComplete;

    expect(qa.querySelector<HTMLTextAreaElement>(".drive-codex-handoff-copy-fallback textarea")?.value).toBe("手动复制内容");
  });
});
