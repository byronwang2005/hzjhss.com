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
  qa.displayName = "汪旭";
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

  it("copies highlighted code with exact whitespace and announces success", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const answer = "```typescript\nconst total: number = 7;\n```\n";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      `event: delta\ndata: ${JSON.stringify({ content: answer })}\n\nevent: done\ndata: {"ok":true}\n\n`,
      { headers: { "content-type": "text/event-stream" } },
    )));
    const qa = await mountQa();
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "请给出代码";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);

    const copy = qa.querySelector<HTMLButtonElement>("[data-copy-code]")!;
    expect(qa.querySelector(".hljs-keyword")?.textContent).toBe("const");
    copy.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith("const total: number = 7;\n");
    expect(copy.textContent).toBe("已复制");
    expect(qa.querySelector("[data-code-copy-status]")?.textContent).toBe("代码已复制");
  });

  it("selects code for manual copying when clipboard access fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(async () => { throw new Error("denied"); }) },
    });
    const answer = "```text\n保留  两个空格\n```\n";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      `event: delta\ndata: ${JSON.stringify({ content: answer })}\n\nevent: done\ndata: {"ok":true}\n\n`,
      { headers: { "content-type": "text/event-stream" } },
    )));
    const qa = await mountQa();
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "复制失败回退";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);

    const copy = qa.querySelector<HTMLButtonElement>("[data-copy-code]")!;
    copy.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(copy.textContent).toBe("已选中");
    expect(window.getSelection()?.toString()).toBe("保留  两个空格\n");
    expect(qa.querySelector("[data-code-copy-status]")?.textContent).toContain("Command+C");
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
    await waitForText(qa, "深度思考已启用");

    expect(qa.textContent).toContain("深度思考已启用");
    expect(qa.textContent).not.toContain("内部思维链");

    streamController?.enqueue(encoder.encode('event: thinking\ndata: {"active":false}\n\nevent: delta\ndata: {"content":"最终结论"}\n\nevent: done\ndata: {"ok":true}\n\n'));
    streamController?.close();
    await waitForAnswer(qa);
    expect(qa.textContent).toContain("最终结论");
    expect(qa.textContent).toContain("回答完成");
  });

  it("renders real retrieval phases and collapses them into a completion summary", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response([
      'event: phase\ndata: {"stage":"parsing","state":"active","elapsedMs":0}',
      'event: phase\ndata: {"stage":"parsing","state":"complete","elapsedMs":1}',
      'event: phase\ndata: {"stage":"retrieving","state":"active","elapsedMs":1}',
      'event: phase\ndata: {"stage":"retrieving","state":"complete","elapsedMs":18}',
      'event: retrieval_summary\ndata: {"scope":"global","topicCount":12,"candidateCount":18,"evidenceCount":16,"methodologyCount":2,"sourceCount":4,"elapsedMs":17}',
      'event: phase\ndata: {"stage":"reasoning","state":"active","elapsedMs":19}',
      'event: thinking\ndata: {"active":true}',
      'event: thinking\ndata: {"active":false}',
      'event: phase\ndata: {"stage":"reasoning","state":"complete","elapsedMs":80}',
      'event: phase\ndata: {"stage":"composing","state":"active","elapsedMs":80}',
      'event: delta\ndata: {"content":"带引用的结论"}',
      'event: phase\ndata: {"stage":"composing","state":"complete","elapsedMs":1250}',
      'event: done\ndata: {"ok":true,"totalMs":1250}',
      "",
    ].join("\n\n"), { headers: { "content-type": "text/event-stream" } })));
    const qa = await mountQa("global");
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "比较所有专题";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);

    const summary = qa.querySelector<HTMLButtonElement>(".drive-ai-qa-progress-summary")!;
    expect(summary.textContent).toContain("已检索 12 个专题");
    expect(summary.textContent).toContain("引用 4 份资料");
    expect(summary.textContent).toContain("用时 1.3 秒");
    expect(summary.getAttribute("aria-expanded")).toBe("false");
    summary.click();
    await qa.updateComplete;
    expect(qa.querySelectorAll(".drive-ai-qa-progress-step")).toHaveLength(4);
    expect(qa.textContent).toContain("深度思考已启用");
    expect(qa.textContent).toContain("带引用的结论");
  });

  it("treats no retrieval matches as a neutral recoverable result", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response([
      'event: phase\ndata: {"stage":"parsing","state":"complete","elapsedMs":1}',
      'event: phase\ndata: {"stage":"retrieving","state":"active","elapsedMs":1}',
      'event: phase\ndata: {"stage":"retrieving","state":"complete","elapsedMs":20}',
      'event: retrieval_summary\ndata: {"scope":"global","topicCount":12,"candidateCount":0,"evidenceCount":0,"methodologyCount":0,"sourceCount":0,"elapsedMs":19}',
      'event: no_results\ndata: {"scope":"global","topicCount":12,"candidateCount":0,"evidenceCount":0,"methodologyCount":0,"sourceCount":0,"elapsedMs":19,"hint":"请补充指标或资料名称。"}',
      'event: done\ndata: {"ok":true,"totalMs":22}',
      "",
    ].join("\n\n"), { headers: { "content-type": "text/event-stream" } })));
    const qa = await mountQa("global");
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "一个没有命中的问题";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForText(qa, "暂未找到足以支持回答的资料");

    expect(qa.querySelector(".drive-ai-qa-no-results")).not.toBeNull();
    expect(qa.querySelector(".drive-ai-qa-message.is-error")).toBeNull();
    expect(qa.querySelector(".drive-ai-qa-error")).toBeNull();
    expect(qa.querySelector(".drive-codex-handoff-entry")).toBeNull();
    expect(qa.textContent).toContain("已检查 12 个可用专题");
    const skippedSteps = Array.from(qa.querySelectorAll(".drive-ai-qa-progress-step.is-skipped")).map((step) => step.textContent);
    expect(skippedSteps).toHaveLength(2);
    expect(skippedSteps[0]).toContain("分析证据");
    expect(skippedSteps[0]).toContain("未执行");
    expect(skippedSteps[1]).toContain("组织回答");
    expect(skippedSteps[1]).toContain("未执行");

    qa.querySelector<HTMLButtonElement>(".drive-ai-qa-no-results button")!.click();
    await qa.updateComplete;
    expect(qa.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe("一个没有命中的问题");
    expect(qa.querySelector(".drive-ai-qa-no-results")).toBeNull();
  });

  it("keeps a partial answer in a settled stopped state", async () => {
    const encoder = new TextEncoder();
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode([
          'event: phase\ndata: {"stage":"composing","state":"active","elapsedMs":120}',
          'event: delta\ndata: {"content":"已经生成的部分"}',
          "",
        ].join("\n\n")));
        init?.signal?.addEventListener("abort", () => {
          controller.error(new DOMException("Aborted", "AbortError"));
        }, { once: true });
      },
    }), { headers: { "content-type": "text/event-stream" } })));
    const qa = await mountQa("global");
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "生成一个较长回答";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForText(qa, "已经生成的部分");
    qa.querySelector<HTMLButtonElement>(".drive-ai-qa-action.is-stop")!.click();
    await waitForText(qa, "已停止生成");

    expect(qa.textContent).toContain("已经生成的部分");
    expect(qa.textContent).toContain("已停止生成");
    expect(qa.querySelector(".drive-ai-qa-progress-summary")).not.toBeNull();
    expect(qa.querySelector(".drive-ai-qa-message.is-error")).toBeNull();
  });

  it("respects non-retryable structured stream errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response([
      'event: phase\ndata: {"stage":"retrieving","state":"active","elapsedMs":1}',
      'event: error\ndata: {"stage":"retrieving","code":"RETRIEVAL_SCOPE_UNAVAILABLE","retryable":false,"message":"当前专题已不存在或暂不可用，请返回专题列表重新选择。"}',
      "",
    ].join("\n\n"), { headers: { "content-type": "text/event-stream" } })));
    const qa = await mountQa("topic");
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "查询已删除专题";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForText(qa, "当前专题已不存在");

    expect(qa.querySelector(".drive-ai-qa-message.is-error")).not.toBeNull();
    expect(qa.querySelector(".drive-ai-qa-error")?.textContent).toContain("当前专题已不存在");
    expect(qa.querySelector(".drive-ai-qa-error button")).toBeNull();
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
    expect(qa.textContent).toContain("从这个专题开始提问");
    expect(qa.querySelector(".drive-ai-qa")?.getAttribute("aria-label")).toBe("在半导体中提问");
  });

  it("uses static, scope-specific task titles", async () => {
    const globalQa = await mountQa("global");
    const topicQa = await mountQa("topic");

    expect(globalQa.querySelector(".drive-ai-qa-empty h3")?.textContent).toBe("今天想从资料里确认什么？");
    expect(topicQa.querySelector(".drive-ai-qa-empty h3")?.textContent).toBe("从这个专题开始提问");
    expect(topicQa.querySelector(".drive-ai-qa-empty .drive-eyebrow")?.textContent).toBe("欢迎回来，汪旭");
    expect(topicQa.textContent).not.toContain("当前专题 · 新能源");
    expect(globalQa.querySelector(".drive-ai-qa-typewriter")).toBeNull();
    expect(globalQa.querySelector(".drive-ai-qa-head")).toBeNull();
    expect(globalQa.textContent).not.toContain("回答将标注资料来源");
    expect(topicQa.querySelector(".drive-ai-qa")?.getAttribute("aria-label")).toBe("在新能源中提问");
  });

  it("offers scope-aware starter questions and copies a suggestion into the composer", async () => {
    const globalQa = await mountQa("global");
    const topicQa = await mountQa("topic");

    expect(globalQa.querySelector(".drive-ai-qa-capabilities")).toBeNull();
    expect(globalQa.querySelectorAll(".drive-ai-qa-suggestions button")).toHaveLength(3);
    expect(topicQa.querySelectorAll(".drive-ai-qa-suggestions button")).toHaveLength(3);
    const suggestion = globalQa.querySelector<HTMLButtonElement>(".drive-ai-qa-suggestions button")!;
    const suggestionText = suggestion.textContent!.trim();
    suggestion.click();
    await globalQa.updateComplete;
    expect(globalQa.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(suggestionText);
    expect(globalQa.querySelector(".drive-ai-qa-typewriter")).toBeNull();
  });

  it("returns to the static task state after clearing a conversation", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('event: delta\ndata: {"content":"回答"}\n\n')));
    const qa = await mountQa("global");
    const textarea = qa.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.value = "开始问答";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await qa.updateComplete;
    qa.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForAnswer(qa);

    expect(qa.querySelector(".drive-ai-qa-empty")).toBeNull();
    expect(qa.querySelector(".drive-ai-qa-head")).not.toBeNull();
    expect(qa.querySelector(".drive-ai-qa-head")?.children).toHaveLength(1);
    expect(qa.querySelector(".drive-ai-qa-clear")?.textContent).toContain("新对话");
    expect(qa.querySelector(".drive-ai-qa-scope")).toBeNull();
    expect(qa.textContent).not.toContain("回答将标注资料来源");
    qa.querySelector<HTMLButtonElement>(".drive-ai-qa-clear")!.click();
    await qa.updateComplete;
    expect(qa.querySelector(".drive-ai-qa-empty h3")?.textContent).toBe("今天想从资料里确认什么？");
    expect(qa.querySelector(".drive-ai-qa-head")).toBeNull();
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
