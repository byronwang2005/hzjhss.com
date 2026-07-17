import DOMPurify from "dompurify";
import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import MarkdownIt from "markdown-it";
import { renderIcon } from "./icons";

interface QaChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  error?: boolean;
  excludeFromHistory?: boolean;
}

const markdown = new MarkdownIt({ html: false, linkify: true, typographer: false });

export class DriveAiQa extends LitElement {
  static properties = {
    scope: { type: String },
    prefix: { type: String },
    ready: { type: Boolean },
    question: { state: true },
    messages: { state: true },
    streaming: { state: true },
    status: { state: true },
    statusTone: { state: true },
  };

  accessor scope: "global" | "topic" = "topic";
  accessor prefix = "";
  accessor ready = false;
  private accessor question = "";
  private accessor messages: QaChatMessage[] = [];
  private accessor streaming = false;
  private accessor status = "";
  private accessor statusTone: "neutral" | "danger" | "success" = "neutral";

  private abortController: AbortController | null = null;
  private conversationKey = "";

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  disconnectedCallback(): void {
    this.abortController?.abort();
    this.abortController = null;
    super.disconnectedCallback();
  }

  protected willUpdate(changed: PropertyValues): void {
    const nextKey = `${this.scope}:${this.scope === "topic" ? this.prefix : "all"}`;
    if (this.conversationKey && this.conversationKey !== nextKey) {
      this.clearConversation(false);
    }
    this.conversationKey = nextKey;
    if (changed.has("ready") && !this.ready && this.streaming) {
      this.abortController?.abort();
    }
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has("messages")) {
      this.scrollToLatest();
    }
  }

  protected render(): TemplateResult {
    const isGlobal = this.scope === "global";
    const title = isGlobal ? "全局 AI 问答" : "专题问答";
    return html`
      <section class=${classMap({ "drive-ai-qa": true, "is-global": isGlobal })} aria-label=${title} aria-busy=${String(this.streaming)}>
        <header class="drive-ai-qa-head">
          <div class="drive-ai-qa-heading">
            <span class="drive-ai-qa-symbol">${renderIcon("chat-circle-dots")}</span>
            <h2>${title}</h2>
          </div>
          ${this.messages.length
            ? html`<button class="drive-control drive-ai-qa-clear" type="button" @click=${() => this.clearConversation()} ?disabled=${this.streaming}>
                ${renderIcon("trash")}清空会话
              </button>`
            : nothing}
        </header>

        ${this.ready
          ? nothing
          : html`<div class="drive-ai-qa-notice is-warning" role="status">
              ${renderIcon("warning")}<span>${isGlobal ? "当前没有可用于全局问答的 Context。" : "当前专题还没有可用的最新版 Context，请联系专题负责人生成并回传。"}</span>
            </div>`}

        <div class="drive-ai-qa-messages" data-qa-messages aria-live="polite">
          ${this.messages.length
            ? repeat(this.messages, (message) => message.id, (message) => this.renderMessage(message))
            : this.renderEmptyState()}
        </div>

        <form class="drive-ai-qa-form" @submit=${this.handleSubmit}>
          <label class="drive-field drive-ai-qa-field">
            <span>您的问题</span>
            <textarea
              name="qaQuestion"
              rows="3"
              maxlength="3000"
              placeholder=${isGlobal ? "询问跨专题结论、风险或来源" : "请输入关于该专题的问题"}
              .value=${this.question}
              @input=${this.handleInput}
              ?disabled=${!this.ready || this.streaming}
            ></textarea>
          </label>
          <div class="drive-ai-qa-form-footer">
            <span class="drive-ai-qa-status ${this.statusTone === "danger" ? "is-danger" : this.statusTone === "success" ? "is-success" : ""}" role="status">
              ${this.status || (this.ready ? "对话仅保存在当前页面，刷新后清空。" : "Context 准备完成后即可使用。")}
            </span>
            ${this.streaming
              ? html`<button class="drive-control drive-control-danger" type="button" @click=${this.stop}>${renderIcon("stop-circle")}停止生成</button>`
              : html`<button class="drive-control drive-control-primary" type="submit" ?disabled=${!this.ready || !this.question.trim()}>
                  ${renderIcon("paper-plane-tilt", "bold")}发送问题
                </button>`}
          </div>
        </form>
      </section>
    `;
  }

  private renderEmptyState(): TemplateResult {
    const suggestions = this.scope === "global"
      ? [
          ["database", "汇总重点", "请汇总各专题当前最重要的结论，并标明来源。"],
          ["files", "比较专题", "哪些专题存在共同风险或相互影响？请分别说明依据。"],
          ["link", "查找来源", "请列出全局 Context 中可追溯的关键来源路径。"],
        ]
      : [
          ["database", "概括结论", "请概括这个专题的核心结论，并标明来源。"],
          ["warning", "检查风险", "当前有哪些风险、反例或待核验事项？"],
          ["link", "查找来源", "请列出回答范围和关键来源路径。"],
        ];
    return html`
      <div class="drive-ai-qa-empty">
        <div><h3>${this.ready ? "从 Context 开始提问" : "等待 Context"}</h3><p>${this.ready ? "选择一个方向，或直接输入您关心的问题。" : "准备完成后，这里会提供基于资料的可追溯回答。"}</p></div>
        ${this.ready
          ? html`<div class="drive-ai-qa-suggestions" aria-label="问题建议">
              ${suggestions.map(([icon, label, prompt]) => html`
                <button type="button" @click=${() => this.useSuggestion(prompt)}>${renderIcon(icon)}<span>${label}</span></button>
              `)}
            </div>`
          : nothing}
      </div>
    `;
  }

  private renderMessage(message: QaChatMessage): TemplateResult {
    const rendered = message.role === "assistant" && message.content
      ? DOMPurify.sanitize(markdown.render(message.content))
      : "";
    return html`
      <article class=${classMap({ "drive-ai-qa-message": true, "is-user": message.role === "user", "is-error": Boolean(message.error) })}>
        <header><span>${message.role === "user" ? "您" : "AI"}</span>${message.pending ? html`<small>生成中</small>` : nothing}</header>
        ${message.role === "assistant"
          ? message.content
            ? html`<div class="drive-ai-qa-markdown">${unsafeHTML(rendered)}</div>`
            : message.pending
              ? this.renderSkeleton()
              : nothing
          : html`<p>${message.content}</p>`}
        ${message.error
          ? html`<div class="drive-ai-qa-error"><span>本次生成失败。</span><button type="button" @click=${() => this.retry(message.id)}>${renderIcon("arrow-clockwise")}重试</button></div>`
          : nothing}
      </article>
    `;
  }

  private renderSkeleton(): TemplateResult {
    return html`<div class="drive-ai-qa-skeleton" aria-label="正在生成回答"><span></span><span></span><span></span></div>`;
  }

  private handleInput = (event: Event): void => {
    this.question = (event.target as HTMLTextAreaElement).value;
  };

  private handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    void this.submitQuestion();
  };

  private async submitQuestion(questionOverride?: string): Promise<void> {
    if (!this.ready || this.streaming) return;
    const question = (questionOverride ?? this.question).trim();
    if (!question) {
      this.setStatus("请输入问题。", "danger");
      return;
    }
    if (question.length > 3000) {
      this.setStatus("问题不能超过 3000 字。", "danger");
      return;
    }

    const history = this.completedHistory();
    const userMessage: QaChatMessage = { id: this.messageId(), role: "user", content: question };
    const assistantMessage: QaChatMessage = { id: this.messageId(), role: "assistant", content: "", pending: true };
    this.messages = [...this.messages, userMessage, assistantMessage];
    this.question = "";
    this.streaming = true;
    const controller = new AbortController();
    this.abortController = controller;
    this.setStatus("正在生成回答...");

    try {
      const response = await fetch("/api/drive/qa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({
          scope: this.scope,
          ...(this.scope === "topic" ? { prefix: this.prefix } : {}),
          messages: [...history, userMessage].map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: unknown };
        throw new Error(typeof data.error === "string" ? data.error : `问答请求失败（${response.status}）`);
      }
      if (!response.body) throw new Error("模型没有返回流式响应");
      await this.consumeStream(response.body, assistantMessage);
      if (this.abortController !== controller) return;
      if (!assistantMessage.content) throw new Error("模型没有返回可显示的流式内容");
      assistantMessage.pending = false;
      this.messages = [...this.messages];
      this.setStatus("回答完成。", "success");
    } catch (error) {
      if (this.abortController !== controller) return;
      assistantMessage.pending = false;
      if (this.isAbort(error)) {
        if (!assistantMessage.content) {
          this.messages = this.messages.filter((message) => message.id !== assistantMessage.id && message.id !== userMessage.id);
        } else {
          assistantMessage.excludeFromHistory = true;
          this.messages = [...this.messages];
        }
        this.setStatus("已停止生成。");
      } else {
        assistantMessage.error = true;
        this.messages = [...this.messages];
        this.setStatus(error instanceof Error ? error.message : "问答请求失败", "danger");
      }
    } finally {
      if (this.abortController === controller) {
        this.abortController = null;
        this.streaming = false;
      }
    }
  }

  private async consumeStream(stream: ReadableStream<Uint8Array>, assistantMessage: QaChatMessage): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const event = /^event:\s*(.+)$/m.exec(block)?.[1]?.trim();
        const dataText = block.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
        const data = dataText ? (JSON.parse(dataText) as { content?: unknown; error?: unknown }) : {};
        if (event === "delta" && typeof data.content === "string") {
          assistantMessage.content += data.content;
          this.messages = [...this.messages];
        } else if (event === "error") {
          throw new Error(typeof data.error === "string" ? data.error : "模型流式输出失败");
        }
        boundary = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
  }

  private stop = (): void => {
    this.abortController?.abort();
  };

  private clearConversation(announce = true): void {
    this.abortController?.abort();
    this.abortController = null;
    this.messages = [];
    this.streaming = false;
    this.question = "";
    this.setStatus(announce ? "当前浏览器会话已清空。" : "", announce ? "success" : "neutral");
  }

  private retry(messageId: string): void {
    if (this.streaming) return;
    const failedIndex = this.messages.findIndex((message) => message.id === messageId && message.role === "assistant" && message.error);
    if (failedIndex < 1) return;
    const question = this.messages[failedIndex - 1];
    if (question.role !== "user") return;
    this.messages = this.messages.filter((_, index) => index !== failedIndex && index !== failedIndex - 1);
    void this.submitQuestion(question.content);
  }

  private completedHistory(): QaChatMessage[] {
    const completed: QaChatMessage[] = [];
    for (let index = 0; index + 1 < this.messages.length; index += 2) {
      const user = this.messages[index];
      const assistant = this.messages[index + 1];
      if (user.role !== "user" || assistant.role !== "assistant" || assistant.pending || assistant.error || assistant.excludeFromHistory) continue;
      completed.push(user, assistant);
    }
    return completed.slice(-12);
  }

  private useSuggestion(prompt: string): void {
    this.question = prompt;
    void this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>("textarea")?.focus());
  }

  private setStatus(status: string, tone: "neutral" | "danger" | "success" = "neutral"): void {
    this.status = status;
    this.statusTone = tone;
  }

  private scrollToLatest(): void {
    void this.updateComplete.then(() => {
      const container = this.querySelector<HTMLElement>("[data-qa-messages]");
      if (container) container.scrollTop = container.scrollHeight;
    });
  }

  private messageId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private isAbort(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError";
  }
}

if (!customElements.get("drive-ai-qa")) {
  customElements.define("drive-ai-qa", DriveAiQa);
}

declare global {
  interface HTMLElementTagNameMap {
    "drive-ai-qa": DriveAiQa;
  }
}
