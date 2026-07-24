// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { DriveAiQa } from "../src/drive/client/qa-chat";

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

async function mountQa(scope: "global" | "topic" = "global"): Promise<DriveAiQa> {
  const qa = new DriveAiQa();
  qa.scope = scope;
  qa.topicId = scope === "topic" ? "t_abcdefghijkl" : "";
  qa.topicName = scope === "topic" ? "新能源" : "";
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
    const globalQa = await mountQa("global");
    const topicQa = await mountQa("topic");

    expect(globalQa.querySelector(".drive-ai-qa-empty h3")?.textContent).toBe("在全资料库内提问");
    expect(topicQa.querySelector(".drive-ai-qa-empty h3")?.textContent).toBe("对新能源提问");
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
});
