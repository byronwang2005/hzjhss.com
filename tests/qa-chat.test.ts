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
  qa.prefix = scope === "topic" ? "新能源/" : "";
  qa.topicName = scope === "topic" ? "新能源" : "";
  qa.contextCount = scope === "global" ? 2 : 0;
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

    qa.prefix = "半导体/";
    qa.topicName = "半导体";
    await qa.updateComplete;
    expect(qa.textContent).not.toContain("专题回答");
    expect(qa.textContent).toContain("半导体");
  });
});
