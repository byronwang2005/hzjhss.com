// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { normalizeLegacyCitations, renderAssistantMarkdown } from "../src/drive/client/assistant-markdown";

function render(source: string, documentId = "answer-a", streaming = false): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = renderAssistantMarkdown(source, { documentId, streaming });
  return container;
}

describe("assistant Markdown renderer", () => {
  it("renders complete prose semantics with safe links, images, and scrollable tables", () => {
    const container = render([
      "# 一级标题",
      "",
      "> 引用正文",
      "",
      "- 第一项",
      "  - 子项",
      "",
      "| 指标 | 数值 |",
      "| --- | ---: |",
      "| 收入 | 18 |",
      "",
      "[外部资料](https://example.com/report)",
      "",
      "![图表](https://example.com/chart.png)",
      "",
      "行内 `const value = 1`。",
      "",
      "<script>alert('xss')</script>",
    ].join("\n"));

    expect(container.querySelector("h1")?.textContent).toBe("一级标题");
    expect(container.querySelector("blockquote p")?.textContent).toBe("引用正文");
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector(".drive-ai-qa-table-scroll table")).not.toBeNull();
    expect(container.querySelector(".drive-ai-qa-table-scroll")?.getAttribute("tabindex")).toBe("0");
    const link = container.querySelector<HTMLAnchorElement>('a[href="https://example.com/report"]')!;
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener noreferrer");
    const image = container.querySelector<HTMLImageElement>("img")!;
    expect(image.loading).toBe("lazy");
    expect(image.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(container.querySelector("script")).toBeNull();
  });

  it("supports both math delimiter styles, CJK text, and invalid-expression fallback", () => {
    const container = render(String.raw`行内 $E=mc^2$ 与 \(a+b\)。

$$\text{净利润}=\text{收入}-\text{成本}$$

\[\begin{matrix}1&2\\3&4\end{matrix}\]

错误公式 $\notARealCommand{x}$。`);

    expect(container.querySelectorAll(".katex")).toHaveLength(5);
    expect(container.querySelectorAll(".katex-block")).toHaveLength(2);
    expect(container.querySelector("math")).not.toBeNull();
    expect(container.textContent).toContain("净利润");
    expect(container.querySelector(".cjk_fallback")).not.toBeNull();
    expect(container.querySelector(".katex-error")?.textContent).toContain("\\notARealCommand");

    const partial = render("流式公式尚未结束 $x + y", "partial", true);
    expect(partial.querySelector(".katex")).toBeNull();
    expect(partial.textContent).toContain("$x + y");
  });

  it("creates localized, message-scoped footnotes and converts only valid legacy citations", () => {
    const source = "结论一[^1]，再次引用[^1]。\n\n[^1]: 《年度报告.pdf》，第 12 页";
    const first = render(source, "answer-a");
    const second = render(source, "answer-b");

    expect(first.querySelector(".footnotes-title")?.textContent).toBe("资料来源");
    expect(first.querySelectorAll(".footnote-ref")).toHaveLength(2);
    expect(first.querySelector(".footnote-ref a")?.getAttribute("href")).toBe("#footnote-answer-a-1");
    expect(second.querySelector(".footnote-ref a")?.getAttribute("href")).toBe("#footnote-answer-b-1");
    expect(first.querySelector(".footnote-backref")?.getAttribute("aria-label")).toBe("返回正文引用 1");

    const legacy = render([
      "库存增长。[年度报告.pdf，第 12 页]",
      "",
      "普通文本 [不是来源] 与行内代码 `[报告.pdf，第 3 页]`。",
      "",
      "```text",
      "[代码.pdf，第 8 页]",
      "```",
    ].join("\n"), "legacy");
    expect(legacy.querySelectorAll(".footnote-ref")).toHaveLength(1);
    expect(legacy.querySelector(".footnote-item")?.textContent).toContain("年度报告.pdf");
    expect(legacy.textContent).toContain("[报告.pdf，第 3 页]");
    expect(legacy.querySelector("code")?.textContent).toContain("[报告.pdf，第 3 页]");
    expect(normalizeLegacyCitations("[无扩展名，第 1 页]")).toBe("[无扩展名，第 1 页]");
  });

  it("highlights supported fenced languages only after streaming and safely preserves unknown code", () => {
    const source = "```typescript\nconst total: number = 7;\n```\n";
    const complete = render(source);
    expect(complete.querySelector(".drive-ai-qa-code figcaption span")?.textContent).toBe("TypeScript");
    expect(complete.querySelector(".hljs-keyword")?.textContent).toBe("const");
    expect(complete.querySelector("[data-copy-code]")).not.toBeNull();
    expect(complete.querySelector("code")?.textContent).toBe("const total: number = 7;\n");

    const streaming = render(source, "streaming", true);
    expect(streaming.querySelector(".hljs-keyword")).toBeNull();
    expect(streaming.querySelector("[data-copy-code]")).toBeNull();
    expect(streaming.querySelector("code")?.textContent).toBe("const total: number = 7;\n");

    const unknown = render("```unknownlang\n<script>alert(1)</script>\n```");
    expect(unknown.querySelector(".drive-ai-qa-code figcaption span")?.textContent).toBe("unknownlang");
    expect(unknown.querySelector("script")).toBeNull();
    expect(unknown.querySelector("code")?.textContent).toBe("<script>alert(1)</script>\n");
  });

  it("keeps sanitization as the final boundary for Markdown and KaTeX output", () => {
    const container = render(String.raw`[危险链接](javascript:alert(1))

$\href{javascript:alert(1)}{危险公式链接}$

<img src=x onerror=alert(1)>`);

    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector(".katex a")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });
});
