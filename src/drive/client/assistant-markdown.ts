import DOMPurify from "dompurify";
import { footnote } from "@mdit/plugin-footnote";
import { katex } from "@mdit/plugin-katex";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdownLanguage from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";

export interface AssistantMarkdownOptions {
  documentId: string;
  streaming?: boolean;
}

interface AssistantMarkdownEnv {
  docId: string;
  streaming: boolean;
}

const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Shell",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  css: "CSS",
  diff: "Diff",
  go: "Go",
  java: "Java",
  javascript: "JavaScript",
  json: "JSON",
  markdown: "Markdown",
  python: "Python",
  rust: "Rust",
  sql: "SQL",
  typescript: "TypeScript",
  xml: "HTML / XML",
  yaml: "YAML",
};

const LANGUAGE_ALIASES: Record<string, string> = {
  cjs: "javascript",
  cs: "csharp",
  html: "xml",
  js: "javascript",
  jsx: "javascript",
  md: "markdown",
  mjs: "javascript",
  py: "python",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  tsx: "typescript",
  yml: "yaml",
};

const LANGUAGE_DEFINITIONS = {
  bash,
  c,
  cpp,
  csharp,
  css,
  diff,
  go,
  java,
  javascript,
  json,
  markdown: markdownLanguage,
  python,
  rust,
  sql,
  typescript,
  xml,
  yaml,
};

for (const [name, definition] of Object.entries(LANGUAGE_DEFINITIONS)) {
  hljs.registerLanguage(name, definition);
}

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
})
  .use(footnote)
  .use(katex, {
    delimiters: "all",
    logger: () => "ignore",
    output: "htmlAndMathml",
    strict: false,
    throwOnError: false,
    transformer: (output: string, displayMode: boolean) => {
      if (!output.includes("<merror>") && !output.includes("#cc0000")) return output;
      return displayMode
        ? output.replace("class='katex-block'", "class='katex-block katex-error'")
        : `<span class="katex-error">${output}</span>`;
    },
    trust: false,
  });

configureRenderer(markdown);

export function renderAssistantMarkdown(source: string, options: AssistantMarkdownOptions): string {
  const normalized = normalizeLegacyCitations(source);
  const env: AssistantMarkdownEnv = {
    docId: sanitizeDocumentId(options.documentId),
    streaming: Boolean(options.streaming),
  };
  const rendered = markdown.render(normalized, env);
  const sanitized = DOMPurify.sanitize(`<div data-assistant-markdown-root>${rendered}</div>`, {
    ADD_ATTR: ["aria-label", "decoding", "loading", "referrerpolicy", "rel", "target"],
    RETURN_DOM: true,
  }) as HTMLElement;
  const root = sanitized.querySelector<HTMLElement>("[data-assistant-markdown-root]");
  return root?.innerHTML || sanitized.innerHTML;
}

export function normalizeLegacyCitations(source: string): string {
  const definitions: string[] = [];
  const labels = new Map<string, string>();
  let fenceMarker = "";
  const lines = source.split("\n");
  const normalized = lines.map((line) => {
    const fence = /^\s*(`{3,}|~{3,})/.exec(line)?.[1] || "";
    if (fence) {
      if (!fenceMarker) fenceMarker = fence[0];
      else if (fence[0] === fenceMarker) fenceMarker = "";
      return line;
    }
    if (fenceMarker || /^\s*\[\^[^\]]+\]:/.test(line)) return line;
    return replaceOutsideInlineCode(line, (segment) => segment.replace(LEGACY_CITATION_PATTERN, (_match, fileName: string, locator: string) => {
      const citation = `${fileName.trim()}，${locator.trim()}`;
      let label = labels.get(citation);
      if (!label) {
        label = `legacy-source-${labels.size + 1}`;
        labels.set(citation, label);
        definitions.push(`[^${label}]: 《${escapeMarkdownText(fileName.trim())}》，${escapeMarkdownText(locator.trim())}`);
      }
      return `[^${label}]`;
    }));
  }).join("\n");

  return definitions.length ? `${normalized.trimEnd()}\n\n${definitions.join("\n")}\n` : normalized;
}

const LEGACY_CITATION_PATTERN = new RegExp(
  String.raw`\[([^\]\r\n]{1,140}\.(?:pdf|docx?|xlsx?|pptx?|md|txt|html?|csv))\s*[,，]\s*`
    + String.raw`((?:第\s*\d+\s*(?:页|张幻灯片)|工作表(?:[:：][^\]\r\n]+)?|章节[:：][^\]\r\n]+|解析(?:片段\s*\d+|内容))`
    + String.raw`(?:\s*[,，]\s*片段\s*\d+)?)\](?!\()`,
  "gi",
);

function configureRenderer(md: MarkdownIt): void {
  const defaultFootnoteRef = md.renderer.rules.footnote_ref;
  const defaultFootnoteAnchor = md.renderer.rules.footnote_anchor;
  const defaultImage = md.renderer.rules.image;
  const defaultLinkOpen = md.renderer.rules.link_open;

  md.renderer.rules.footnote_block_open = (_tokens, _index, options) => `
<hr class="footnotes-sep"${options.xhtmlOut ? " /" : ""}>
<section class="footnotes" aria-label="资料来源">
<h3 class="footnotes-title">资料来源</h3>
<ol class="footnotes-list">
`;
  md.renderer.rules.footnote_ref = (tokens, index, options, env, self) => {
    const rendered = defaultFootnoteRef?.(tokens, index, options, env, self) || "";
    const number = Number(tokens[index].meta?.id ?? 0) + 1;
    return rendered.replace("<a href=", `<a aria-label="查看资料来源 ${number}" href=`);
  };
  md.renderer.rules.footnote_anchor = (tokens, index, options, env, self) => {
    const rendered = defaultFootnoteAnchor?.(tokens, index, options, env, self) || "";
    const number = Number(tokens[index].meta?.id ?? 0) + 1;
    return rendered.replace("<a href=", `<a aria-label="返回正文引用 ${number}" href=`);
  };
  md.renderer.rules.link_open = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const href = token.attrGet("href") || "";
    if (/^https?:\/\//i.test(href)) {
      token.attrSet("target", "_blank");
      token.attrSet("rel", "noopener noreferrer");
    }
    return defaultLinkOpen
      ? defaultLinkOpen(tokens, index, options, env, self)
      : self.renderToken(tokens, index, options);
  };
  md.renderer.rules.image = (tokens, index, options, env, self) => {
    const token = tokens[index];
    token.attrSet("loading", "lazy");
    token.attrSet("decoding", "async");
    token.attrSet("referrerpolicy", "no-referrer");
    return defaultImage
      ? defaultImage(tokens, index, options, env, self)
      : self.renderToken(tokens, index, options);
  };
  md.renderer.rules.table_open = () => '<div class="drive-ai-qa-table-scroll" role="region" aria-label="表格，可横向滚动" tabindex="0"><table>\n';
  md.renderer.rules.table_close = () => "</table></div>\n";
  md.renderer.rules.fence = (tokens, index, _options, env) => renderCodeBlock(tokens[index], env as AssistantMarkdownEnv);
  md.renderer.rules.code_block = (tokens, index, _options, env) => renderCodeBlock(tokens[index], env as AssistantMarkdownEnv);
}

function renderCodeBlock(token: Token, env: AssistantMarkdownEnv): string {
  const requestedLanguage = token.info.trim().split(/\s+/, 1)[0]?.toLowerCase() || "";
  const language = LANGUAGE_ALIASES[requestedLanguage] || requestedLanguage;
  const supported = Boolean(language && hljs.getLanguage(language));
  const label = supported
    ? LANGUAGE_LABELS[language] || language
    : /^[\w#+.-]{1,24}$/.test(requestedLanguage) ? requestedLanguage : "文本";
  const highlighted = supported && !env.streaming
    ? hljs.highlight(token.content, { language, ignoreIllegals: true }).value
    : mdEscape(token.content);
  const languageClass = supported ? ` language-${mdEscape(language)}` : "";
  const controls = env.streaming ? "" : `
    <button class="drive-ai-qa-code-copy" type="button" data-copy-code aria-label="复制${mdEscape(label)}代码">复制</button>`;
  return `<figure class="drive-ai-qa-code">
  <figcaption><span>${mdEscape(label)}</span>${controls}
  </figcaption>
  <pre tabindex="0"><code class="hljs${languageClass}">${highlighted}</code></pre>
</figure>
`;
}

function replaceOutsideInlineCode(line: string, replace: (segment: string) => string): string {
  let cursor = 0;
  let output = "";
  while (cursor < line.length) {
    const opening = line.indexOf("`", cursor);
    if (opening < 0) return output + replace(line.slice(cursor));
    output += replace(line.slice(cursor, opening));
    const marker = /^`+/.exec(line.slice(opening))?.[0] || "`";
    const closing = line.indexOf(marker, opening + marker.length);
    if (closing < 0) return output + line.slice(opening);
    const end = closing + marker.length;
    output += line.slice(opening, end);
    cursor = end;
  }
  return output;
}

function escapeMarkdownText(value: string): string {
  return value.replace(/([\\`*_[\]<>])/g, "\\$1");
}

function sanitizeDocumentId(value: string): string {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
  return sanitized || "assistant-answer";
}

function mdEscape(value: string): string {
  return markdown.utils.escapeHtml(value);
}
