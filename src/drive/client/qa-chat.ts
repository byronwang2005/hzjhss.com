import DOMPurify from "dompurify";
import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import MarkdownIt from "markdown-it";
import { renderIcon } from "./icons";
import { DRIVE_API_ROOT } from "../shared/runtime";
import type {
  CodexHandoffReady,
  CodexHandoffRequest,
  CodexHandoffServerStage,
  CodexHandoffStage,
} from "../shared/contracts";

interface QaChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  error?: boolean;
  excludeFromHistory?: boolean;
}

interface CodexHandoffUi {
  mode: "idle" | "working" | "launching" | "complete" | "error";
  stage: CodexHandoffStage;
  failedStage?: CodexHandoffStage;
  error?: string;
  result?: CodexHandoffReady;
  elapsedSeconds: number;
  showCopyFallback: boolean;
  copied: boolean;
}

const markdown = new MarkdownIt({ html: false, linkify: true, typographer: false });
const GREETING_TYPE_SPEED_MS = 70;
const GREETING_HOLD_MS = 1_800;
const GREETING_DELETE_SPEED_MS = 35;
const GREETING_GAP_MS = 250;
const CODEX_LAUNCH_CONFIRM_MS = 2_500;

function initialHandoffUi(): CodexHandoffUi {
  return {
    mode: "idle",
    stage: "preparing",
    elapsedSeconds: 0,
    showCopyFallback: false,
    copied: false,
  };
}

function greetingOptions(displayName: string): string[] {
  const name = displayName.trim() || "朋友";
  return [
    `欢迎回来，${name}👋`,
    `Welcome back, ${name} 👋`,
    `おかえりなさい、${name}👋`,
    `다시 오신 것을 환영합니다, ${name} 👋`,
    `Bon retour, ${name} 👋`,
    `Qué bueno verte de nuevo, ${name} 👋`,
  ];
}

function splitGraphemes(value: string): string[] {
  if (typeof Intl.Segmenter === "function") {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value)].map(({ segment }) => segment);
  }
  return Array.from(value);
}

export class DriveAiQa extends LitElement {
  static properties = {
    scope: { type: String },
    topicId: { type: String, attribute: "topic-id" },
    topicName: { type: String, attribute: "topic-name" },
    displayName: { type: String, attribute: "display-name" },
    ready: { type: Boolean },
    question: { state: true },
    messages: { state: true },
    streaming: { state: true },
    status: { state: true },
    statusTone: { state: true },
    typedGreeting: { state: true },
    greetingLabel: { state: true },
    reduceGreetingMotion: { state: true },
    handoff: { state: true },
  };

  accessor scope: "global" | "topic" = "topic";
  accessor topicId = "";
  accessor topicName = "";
  accessor displayName = "";
  accessor ready = false;
  private accessor question = "";
  private accessor messages: QaChatMessage[] = [];
  private accessor streaming = false;
  private accessor status = "";
  private accessor statusTone: "neutral" | "danger" | "success" = "neutral";
  private accessor typedGreeting = "";
  private accessor greetingLabel = "";
  private accessor reduceGreetingMotion = false;
  private accessor handoff: CodexHandoffUi = initialHandoffUi();

  private abortController: AbortController | null = null;
  private handoffAbortController: AbortController | null = null;
  private conversationKey = "";
  private greetingTimer: number | undefined;
  private greetingGeneration = 0;
  private greetingIndex = -1;
  private greetingMotionQuery: MediaQueryList | null = null;
  private handoffElapsedTimer: number | undefined;
  private handoffLaunchTimer: number | undefined;
  private handoffResizeObserver: ResizeObserver | null = null;
  private handoffObservedRail: HTMLElement | null = null;
  private handoffLaunchObserved = false;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof window.matchMedia === "function") {
      this.greetingMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.reduceGreetingMotion = this.greetingMotionQuery.matches;
      this.greetingMotionQuery.addEventListener?.("change", this.handleGreetingMotionChange);
    }
    if (this.hasUpdated) this.reconcileGreetingAnimation();
  }

  disconnectedCallback(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.resetHandoff();
    this.stopGreetingAnimation();
    this.greetingMotionQuery?.removeEventListener?.("change", this.handleGreetingMotionChange);
    this.greetingMotionQuery = null;
    super.disconnectedCallback();
  }

  protected willUpdate(changed: PropertyValues): void {
    const nextKey = `${this.scope}:${this.scope === "topic" ? this.topicId : "all"}`;
    if (this.conversationKey && this.conversationKey !== nextKey) {
      this.clearConversation(false);
    }
    this.conversationKey = nextKey;
    if (changed.has("ready") && !this.ready && this.streaming) {
      this.abortController?.abort();
    }
    if (
      changed.has("scope")
      || changed.has("ready")
      || changed.has("displayName")
      || changed.has("messages")
      || changed.has("reduceGreetingMotion")
    ) {
      this.reconcileGreetingAnimation();
    }
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has("messages")) {
      this.scrollToLatest();
    }
    if (changed.has("question")) {
      this.syncTextareaHeight();
    }
    if (changed.has("handoff") || changed.has("messages")) {
      this.syncHandoffVisuals();
    }
  }

  protected render(): TemplateResult {
    const isGlobal = this.scope === "global";
    const title = isGlobal ? "向全部资料提问" : "专题问答";
    return html`
      <section class=${classMap({ "drive-ai-qa": true, "is-global": isGlobal, "has-notice": !this.ready })} aria-label=${title} aria-busy=${String(this.streaming)}>
        <header class="drive-ai-qa-head">
          <div class="drive-ai-qa-heading">
            <span class="drive-ai-qa-symbol">${renderIcon("chat-circle-dots")}</span>
            <div><span class="drive-eyebrow">${isGlobal ? "AI 检索" : "当前专题"}</span><h2>${title}</h2></div>
          </div>
          <div class="drive-ai-qa-head-actions">
            <span class="drive-ai-qa-scope">${renderIcon(isGlobal ? "files" : "folder")}${isGlobal ? "全部专题" : this.topicName || "当前专题"}</span>
            ${this.messages.length
              ? html`<button class="drive-control drive-ai-qa-clear" type="button" @click=${() => this.clearConversation()} ?disabled=${this.streaming}>
                  ${renderIcon("trash")}清空会话
                </button>`
              : nothing}
          </div>
        </header>

        ${this.ready
          ? nothing
          : html`<div class="drive-ai-qa-notice is-warning" role="status">
              ${renderIcon("warning")}<span>${isGlobal ? "当前没有可检索的已处理文件。" : "当前专题还没有可检索的已处理文件。"}</span>
            </div>`}

        <div class="drive-ai-qa-messages" data-qa-messages aria-live="polite">
          ${this.messages.length
            ? repeat(this.messages, (message) => message.id, (message, index) => this.renderMessage(message, index))
            : this.renderEmptyState()}
        </div>

        <form class=${classMap({ "drive-ai-qa-form": true, "is-danger": this.statusTone === "danger" })} @submit=${this.handleSubmit}>
          <div class="drive-ai-qa-composer">
            <textarea
              name="qaQuestion"
              rows="2"
              aria-label="您的问题"
              placeholder=${isGlobal ? "询问跨专题结论、风险或来源" : "请输入关于该专题的问题"}
              .value=${this.question}
              @input=${this.handleInput}
              @keydown=${this.handleKeydown}
              ?disabled=${!this.ready || this.streaming}
            ></textarea>
            ${this.streaming
              ? html`<button class="drive-ai-qa-action is-stop" type="button" aria-label="停止生成" title="停止生成" @click=${this.stop}>${renderIcon("stop-circle")}</button>`
              : html`<button class="drive-ai-qa-action" type="submit" aria-label="发送问题" title="发送问题" ?disabled=${!this.ready || !this.question.trim()}>
                  ${renderIcon("paper-plane-tilt", "bold")}
                </button>`}
          </div>
          <span class="drive-ai-qa-status" role="status">
            ${this.status || (this.ready ? "对话仅保存在当前页面，刷新后清空。" : "文件处理和索引完成后即可使用。")}
          </span>
        </form>
      </section>
    `;
  }

  private renderEmptyState(): TemplateResult {
    const isAnimatedGreeting = this.scope === "global" && this.ready;
    const fallbackGreeting = greetingOptions(this.displayName)[0];
    const readyTitle = isAnimatedGreeting ? fallbackGreeting : `对${this.topicName || "当前专题"}提问`;
    return html`
      <div class="drive-ai-qa-empty">
        <div><h3
          class=${isAnimatedGreeting ? "drive-ai-qa-typewriter-title" : nothing}
          aria-label=${isAnimatedGreeting ? this.greetingLabel || fallbackGreeting : nothing}
          aria-live=${isAnimatedGreeting ? "off" : nothing}
        >${this.ready
            ? isAnimatedGreeting
              ? html`<span class=${classMap({ "drive-ai-qa-typewriter": true, "is-active": !this.reduceGreetingMotion })} aria-hidden="true">${this.typedGreeting}</span>`
              : readyTitle
            : "等待文件处理"}</h3>${this.ready ? nothing : html`<p>索引完成后，这里会提供基于资料的可追溯回答。</p>`}</div>
      </div>
    `;
  }

  private handleGreetingMotionChange = (event: MediaQueryListEvent): void => {
    this.reduceGreetingMotion = event.matches;
  };

  private reconcileGreetingAnimation(): void {
    if (!this.shouldAnimateGreeting()) {
      this.stopGreetingAnimation();
      return;
    }
    if (this.reduceGreetingMotion) {
      this.showStaticGreeting();
      return;
    }
    this.startGreetingAnimation();
  }

  private shouldAnimateGreeting(): boolean {
    return this.isConnected && this.scope === "global" && this.ready && this.messages.length === 0;
  }

  private showStaticGreeting(): void {
    this.stopGreetingAnimation();
    const greeting = this.selectNextGreeting();
    this.greetingLabel = greeting;
    this.typedGreeting = greeting;
  }

  private startGreetingAnimation(): void {
    this.stopGreetingAnimation();
    const generation = this.greetingGeneration;
    this.typeNextGreeting(generation);
  }

  private typeNextGreeting(generation: number): void {
    if (!this.isGreetingGenerationActive(generation)) return;
    const greeting = this.selectNextGreeting();
    const graphemes = splitGraphemes(greeting);
    let length = 0;
    this.greetingLabel = greeting;
    this.typedGreeting = "";

    const typeNext = (): void => {
      if (!this.isGreetingGenerationActive(generation)) return;
      length += 1;
      this.typedGreeting = graphemes.slice(0, length).join("");
      if (length < graphemes.length) {
        this.scheduleGreeting(typeNext, GREETING_TYPE_SPEED_MS);
      } else {
        this.scheduleGreeting(deleteNext, GREETING_HOLD_MS);
      }
    };

    const deleteNext = (): void => {
      if (!this.isGreetingGenerationActive(generation)) return;
      length -= 1;
      this.typedGreeting = graphemes.slice(0, length).join("");
      if (length > 0) {
        this.scheduleGreeting(deleteNext, GREETING_DELETE_SPEED_MS);
      } else {
        this.scheduleGreeting(() => this.typeNextGreeting(generation), GREETING_GAP_MS);
      }
    };

    this.scheduleGreeting(typeNext, GREETING_TYPE_SPEED_MS);
  }

  private selectNextGreeting(): string {
    const greetings = greetingOptions(this.displayName);
    if (this.greetingIndex < 0) {
      this.greetingIndex = Math.floor(Math.random() * greetings.length);
    } else {
      const candidate = Math.floor(Math.random() * (greetings.length - 1));
      this.greetingIndex = candidate >= this.greetingIndex ? candidate + 1 : candidate;
    }
    return greetings[this.greetingIndex];
  }

  private scheduleGreeting(callback: () => void, delay: number): void {
    this.greetingTimer = window.setTimeout(callback, delay);
  }

  private stopGreetingAnimation(): void {
    this.greetingGeneration += 1;
    if (this.greetingTimer !== undefined) {
      window.clearTimeout(this.greetingTimer);
      this.greetingTimer = undefined;
    }
  }

  private isGreetingGenerationActive(generation: number): boolean {
    return generation === this.greetingGeneration && !this.reduceGreetingMotion && this.shouldAnimateGreeting();
  }

  private renderMessage(message: QaChatMessage, index: number): TemplateResult {
    const rendered = message.role === "assistant" && message.content
      ? DOMPurify.sanitize(markdown.render(message.content))
      : "";
    const showHandoff = this.shouldRenderHandoff(message, index);
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
        ${showHandoff ? this.renderCodexHandoff() : nothing}
      </article>
    `;
  }

  private shouldRenderHandoff(message: QaChatMessage, index: number): boolean {
    return index === this.messages.length - 1
      && message.role === "assistant"
      && Boolean(message.content)
      && !message.pending
      && !message.error
      && !this.streaming;
  }

  private renderCodexHandoff(): TemplateResult {
    if (this.handoff.mode === "idle") {
      return html`
        <section class="drive-codex-handoff-entry" aria-label="继续在 Codex 研究">
          <div>
            <strong>需要继续研究或创建文件？</strong>
            <span>把当前对话和相关资料片段交接给 Codex。</span>
          </div>
          <button class="drive-codex-handoff-cta" type="button" @click=${this.startCodexHandoff}>
            <span>在 Codex 继续</span>
            <span class="drive-codex-handoff-cta-icon">${renderIcon("arrow-square-out")}</span>
          </button>
        </section>
      `;
    }

    const steps: Array<{ stage: CodexHandoffStage; label: string }> = [
      { stage: "preparing", label: "整理对话" },
      { stage: "retrieving", label: "匹配资料" },
      { stage: "packing", label: "封装上下文" },
      { stage: "launching", label: "打开 Codex" },
    ];
    const activeIndex = handoffStageIndex(this.handoff.failedStage || this.handoff.stage);
    const completed = this.handoff.mode === "complete";
    return html`
      <section
        class=${classMap({
          "drive-codex-handoff": true,
          "is-error": this.handoff.mode === "error",
          "is-complete": completed,
        })}
        data-handoff-stage=${this.handoff.stage}
        aria-label="Codex 交接进度"
      >
        <div class="drive-codex-handoff-core">
          <div class="drive-codex-handoff-heading">
            <div>
              <strong>${completed ? "已交接至 Codex" : this.handoff.mode === "error" ? "交接未完成" : "正在准备 Codex 上下文"}</strong>
              <span>${this.handoffStatusText()}</span>
            </div>
            ${this.handoff.elapsedSeconds >= 3 && this.handoff.mode === "working"
              ? html`<small>已等待 ${formatElapsed(this.handoff.elapsedSeconds)}</small>`
              : nothing}
          </div>

          <div class="drive-codex-handoff-rail" data-handoff-rail>
            <span class="drive-codex-handoff-line" aria-hidden="true"></span>
            <span class="drive-codex-handoff-line-progress" aria-hidden="true"></span>
            <span class="drive-codex-handoff-signal" data-handoff-signal aria-hidden="true"></span>
            <div class="drive-codex-handoff-steps">
              ${steps.map((step, index) => {
                const isDone = completed || index < activeIndex;
                const isActive = !completed && index === activeIndex && this.handoff.mode !== "error";
                const isError = this.handoff.mode === "error" && index === activeIndex;
                return html`
                  <div
                    class=${classMap({
                      "drive-codex-handoff-step": true,
                      "is-done": isDone,
                      "is-active": isActive,
                      "is-error": isError,
                    })}
                    data-handoff-node=${index}
                  >
                    <span class="drive-codex-handoff-node">
                      ${this.renderHandoffStepVisual(index)}
                      <span class="drive-codex-handoff-check">${renderIcon("check-circle-fill")}</span>
                    </span>
                    <span class="drive-codex-handoff-label">${step.label}</span>
                  </div>
                `;
              })}
            </div>
          </div>

          <div class="drive-codex-handoff-status" role="status" aria-live="polite">
            <span>${this.handoffStatusText()}</span>
          </div>

          ${this.handoff.mode === "error" ? this.renderHandoffRecovery() : nothing}
          ${completed && this.handoff.result
            ? html`<div class="drive-codex-handoff-expiry">上下文链接将在 ${formatExpiry(this.handoff.result.expiresAt)} 失效。</div>`
            : nothing}
        </div>
      </section>
    `;
  }

  private renderHandoffStepVisual(index: number): TemplateResult {
    if (index === 0) {
      return html`<span class="drive-codex-handoff-visual is-dialogue">${renderIcon("chat-circle-dots")}${renderIcon("copy")}</span>`;
    }
    if (index === 1) {
      return html`<span class="drive-codex-handoff-visual is-retrieval">${renderIcon("files")}${renderIcon("database")}</span>`;
    }
    if (index === 2) {
      return html`<span class="drive-codex-handoff-visual is-package">${renderIcon("package")}${renderIcon("link")}</span>`;
    }
    return html`<span class="drive-codex-handoff-visual is-codex">${renderIcon("terminal-window")}${renderIcon("arrow-square-out")}</span>`;
  }

  private renderHandoffRecovery(): TemplateResult {
    const canReopen = this.handoff.failedStage === "launching" && Boolean(this.handoff.result);
    return html`
      <div class="drive-codex-handoff-recovery">
        <p>${this.handoff.error || "Codex 交接失败，请重试。"}</p>
        <div>
          ${canReopen
            ? html`<button class="drive-control drive-control-primary" type="button" @click=${this.reopenCodex}>${renderIcon("arrow-square-out")}重新打开 Codex</button>`
            : html`<button class="drive-control drive-control-primary" type="button" @click=${this.startCodexHandoff}>${renderIcon("arrow-clockwise")}重试交接</button>`}
          ${this.handoff.result
            ? html`<button class="drive-control" type="button" @click=${this.copyHandoffPrompt}>${renderIcon(this.handoff.copied ? "check" : "copy")}${this.handoff.copied ? "已复制" : "复制交接提示"}</button>`
            : nothing}
          <a class="drive-control" href="https://hzjhss.com/docs/articles/codex-setup" target="_blank" rel="noopener noreferrer">${renderIcon("book-open")}Codex 配置教程</a>
        </div>
        ${this.handoff.showCopyFallback && this.handoff.result
          ? html`<label class="drive-codex-handoff-copy-fallback"><span>请手动复制以下提示</span><textarea readonly .value=${this.handoff.result.fallbackPrompt}></textarea></label>`
          : nothing}
      </div>
    `;
  }

  private handoffStatusText(): string {
    if (this.handoff.mode === "complete") return "上下文已就绪，可在 Codex 中确认发送。";
    if (this.handoff.mode === "error") return this.handoff.error || "交接未完成。";
    if (this.handoff.stage === "preparing") return "正在收拢完整对话和专题范围。";
    if (this.handoff.stage === "retrieving") return "正在匹配证据和方法论片段。";
    if (this.handoff.stage === "packing") return "正在整理可供 Codex 阅读的上下文。";
    if (this.handoff.stage === "sealing") return "正在生成 2 小时有效的安全链接。";
    return "交接已就绪，正在唤起 Codex。";
  }

  private renderSkeleton(): TemplateResult {
    return html`<div class="drive-ai-qa-skeleton" aria-label="正在生成回答"><span></span><span></span><span></span></div>`;
  }

  private handleInput = (event: Event): void => {
    this.question = (event.target as HTMLTextAreaElement).value;
  };

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing || event.keyCode === 229 || this.hasCoarsePointer()) return;
    event.preventDefault();
    void this.submitQuestion();
  };

  private handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    void this.submitQuestion();
  };

  private startCodexHandoff = async (): Promise<void> => {
    if (this.handoff.mode === "working" || this.handoff.mode === "launching") return;
    const messages = this.completedHistory().map(({ role, content }) => ({ role, content }));
    if (!messages.length || messages.at(-1)?.role !== "assistant") {
      this.handoff = {
        ...initialHandoffUi(),
        mode: "error",
        stage: "error",
        failedStage: "preparing",
        error: "当前没有可交接的完整问答。",
      };
      return;
    }

    this.cancelHandoffWork();
    const controller = new AbortController();
    this.handoffAbortController = controller;
    this.handoff = { ...initialHandoffUi(), mode: "working", stage: "preparing" };
    this.startHandoffElapsedTimer();

    try {
      const requestBody: CodexHandoffRequest = {
        scope: this.scope,
        ...(this.scope === "topic" ? { topicId: this.topicId } : {}),
        messages,
      };
      const response = await fetch(`${DRIVE_API_ROOT}/codex-handoff`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: unknown };
        throw new Error(typeof data.error === "string" ? data.error : `Codex 交接请求失败（${response.status}）`);
      }
      if (!response.body) throw new Error("Codex 交接没有返回流式状态");
      await this.consumeHandoffStream(response.body);
      if (this.handoffAbortController !== controller) return;
      if (!this.handoff.result) throw new Error("Codex 交接没有返回可用链接");
    } catch (error) {
      if (this.handoffAbortController !== controller || this.isAbort(error)) return;
      this.stopHandoffElapsedTimer();
      const failedStage = this.handoff.stage === "error" ? this.handoff.failedStage || "preparing" : this.handoff.stage;
      this.handoff = {
        ...this.handoff,
        mode: "error",
        stage: "error",
        failedStage,
        error: error instanceof Error ? error.message : "Codex 交接失败",
      };
    } finally {
      if (this.handoffAbortController === controller) this.handoffAbortController = null;
    }
  };

  private async consumeHandoffStream(stream: ReadableStream<Uint8Array>): Promise<void> {
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
        const data = dataText ? JSON.parse(dataText) as Record<string, unknown> : {};
        if (event === "stage" && isServerHandoffStage(data.stage)) {
          this.handoff = { ...this.handoff, mode: "working", stage: data.stage };
        } else if (event === "ready") {
          const result = parseHandoffReady(data);
          this.stopHandoffElapsedTimer();
          this.handoff = {
            ...this.handoff,
            mode: "launching",
            stage: "launching",
            result,
            error: undefined,
          };
          this.launchCodex(result.deepLink);
        } else if (event === "error") {
          if (isServerHandoffStage(data.stage)) {
            this.handoff = { ...this.handoff, stage: data.stage };
          }
          const message = typeof data.message === "string"
            ? data.message
            : typeof data.error === "string"
              ? data.error
              : "Codex 交接失败";
          throw new Error(message);
        }
        boundary = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
  }

  private launchCodex(deepLink: string): void {
    this.clearHandoffLaunchWatch();
    this.handoffLaunchObserved = false;
    document.addEventListener("visibilitychange", this.handleHandoffVisibilityChange);
    window.addEventListener("pagehide", this.handleHandoffPageHide);
    window.addEventListener("blur", this.handleHandoffWindowBlur);
    this.handoffLaunchTimer = window.setTimeout(() => {
      if (this.handoffLaunchObserved) return;
      this.clearHandoffLaunchWatch();
      this.handoff = {
        ...this.handoff,
        mode: "error",
        stage: "error",
        failedStage: "launching",
        error: "未检测到 Codex 打开，可能未安装或被浏览器拦截。",
      };
    }, CODEX_LAUNCH_CONFIRM_MS);

    const anchor = document.createElement("a");
    anchor.href = deepLink;
    anchor.hidden = true;
    anchor.setAttribute("aria-hidden", "true");
    this.appendChild(anchor);
    try {
      anchor.click();
    } catch {
      this.clearHandoffLaunchWatch();
      this.handoff = {
        ...this.handoff,
        mode: "error",
        stage: "error",
        failedStage: "launching",
        error: "浏览器阻止了 Codex 唤起，请重试或复制交接提示。",
      };
    } finally {
      anchor.remove();
    }
  }

  private handleHandoffVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") this.markHandoffLaunched();
  };

  private handleHandoffPageHide = (): void => {
    this.markHandoffLaunched();
  };

  private handleHandoffWindowBlur = (): void => {
    this.markHandoffLaunched();
  };

  private markHandoffLaunched(): void {
    if (!this.handoff.result) return;
    this.handoffLaunchObserved = true;
    this.clearHandoffLaunchWatch();
    this.handoff = {
      ...this.handoff,
      mode: "complete",
      stage: "complete",
      failedStage: undefined,
      error: undefined,
    };
  }

  private reopenCodex = (): void => {
    const result = this.handoff.result;
    if (!result) return;
    this.handoff = {
      ...this.handoff,
      mode: "launching",
      stage: "launching",
      failedStage: undefined,
      error: undefined,
      showCopyFallback: false,
    };
    this.launchCodex(result.deepLink);
  };

  private copyHandoffPrompt = async (): Promise<void> => {
    const prompt = this.handoff.result?.fallbackPrompt;
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      this.handoff = { ...this.handoff, copied: true, showCopyFallback: false };
    } catch {
      this.handoff = { ...this.handoff, copied: false, showCopyFallback: true };
    }
  };

  private startHandoffElapsedTimer(): void {
    this.stopHandoffElapsedTimer();
    const startedAt = Date.now();
    this.handoffElapsedTimer = window.setInterval(() => {
      this.handoff = {
        ...this.handoff,
        elapsedSeconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      };
    }, 1_000);
  }

  private stopHandoffElapsedTimer(): void {
    if (this.handoffElapsedTimer !== undefined) {
      window.clearInterval(this.handoffElapsedTimer);
      this.handoffElapsedTimer = undefined;
    }
  }

  private clearHandoffLaunchWatch(): void {
    if (this.handoffLaunchTimer !== undefined) {
      window.clearTimeout(this.handoffLaunchTimer);
      this.handoffLaunchTimer = undefined;
    }
    document.removeEventListener("visibilitychange", this.handleHandoffVisibilityChange);
    window.removeEventListener("pagehide", this.handleHandoffPageHide);
    window.removeEventListener("blur", this.handleHandoffWindowBlur);
  }

  private cancelHandoffWork(): void {
    this.handoffAbortController?.abort();
    this.handoffAbortController = null;
    this.stopHandoffElapsedTimer();
    this.clearHandoffLaunchWatch();
  }

  private resetHandoff(): void {
    this.cancelHandoffWork();
    this.handoffResizeObserver?.disconnect();
    this.handoffResizeObserver = null;
    this.handoffObservedRail = null;
    this.handoff = initialHandoffUi();
  }

  private syncHandoffVisuals(): void {
    const rail = this.querySelector<HTMLElement>("[data-handoff-rail]");
    if (!rail) {
      this.handoffResizeObserver?.disconnect();
      this.handoffResizeObserver = null;
      this.handoffObservedRail = null;
      return;
    }
    if (this.handoffObservedRail !== rail) {
      this.handoffResizeObserver?.disconnect();
      this.handoffObservedRail = rail;
      if (typeof ResizeObserver === "function") {
        this.handoffResizeObserver = new ResizeObserver(() => this.positionHandoffSignal());
        this.handoffResizeObserver.observe(rail);
      }
    }
    this.positionHandoffSignal();
  }

  private positionHandoffSignal(): void {
    const rail = this.querySelector<HTMLElement>("[data-handoff-rail]");
    const signal = rail?.querySelector<HTMLElement>("[data-handoff-signal]");
    if (!rail || !signal) return;
    const index = handoffStageIndex(this.handoff.failedStage || this.handoff.stage);
    const node = rail.querySelector<HTMLElement>(`[data-handoff-node="${index}"] .drive-codex-handoff-node`);
    if (!node) return;
    const railRect = rail.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const x = nodeRect.left + nodeRect.width / 2 - railRect.left;
    signal.style.setProperty("--handoff-signal-x", `${x}px`);
    rail.style.setProperty("--handoff-progress", String(index / 3));
  }

  private async submitQuestion(questionOverride?: string): Promise<void> {
    if (!this.ready || this.streaming) return;
    const question = (questionOverride ?? this.question).trim();
    if (!question) {
      this.setStatus("请输入问题。", "danger");
      return;
    }
    this.resetHandoff();
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
      const response = await fetch(`${DRIVE_API_ROOT}/qa`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({
          scope: this.scope,
          ...(this.scope === "topic" ? { topicId: this.topicId } : {}),
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
        const data = dataText ? (JSON.parse(dataText) as { active?: unknown; content?: unknown; error?: unknown }) : {};
        if (event === "thinking" && typeof data.active === "boolean") {
          this.setStatus(data.active ? "正在深度思考…" : "正在生成回答…");
        } else if (event === "delta" && typeof data.content === "string") {
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
    this.resetHandoff();
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
    return completed;
  }

  private syncTextareaHeight(): void {
    void this.updateComplete.then(() => {
      const textarea = this.querySelector<HTMLTextAreaElement>("textarea");
      if (!textarea) return;
      textarea.style.height = "auto";
      if (textarea.scrollHeight > 0) {
        textarea.style.height = `${Math.min(textarea.scrollHeight, 156)}px`;
      }
    });
  }

  private hasCoarsePointer(): boolean {
    return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
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

function isServerHandoffStage(value: unknown): value is CodexHandoffServerStage {
  return value === "retrieving" || value === "packing" || value === "sealing";
}

function parseHandoffReady(value: Record<string, unknown>): CodexHandoffReady {
  const deepLink = value.deepLink;
  const contextUrl = value.contextUrl;
  const fallbackPrompt = value.fallbackPrompt;
  const expiresAt = value.expiresAt;
  if (
    typeof deepLink !== "string"
    || !deepLink.startsWith("codex://new?")
    || typeof contextUrl !== "string"
    || !contextUrl.startsWith("http")
    || typeof fallbackPrompt !== "string"
    || typeof expiresAt !== "string"
    || !Number.isFinite(Date.parse(expiresAt))
  ) {
    throw new Error("Codex 交接响应格式无效");
  }
  return { deepLink, contextUrl, fallbackPrompt, expiresAt };
}

function handoffStageIndex(stage: CodexHandoffStage): number {
  if (stage === "retrieving") return 1;
  if (stage === "packing" || stage === "sealing") return 2;
  if (stage === "launching" || stage === "complete") return 3;
  return 0;
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes}:${String(remainder).padStart(2, "0")}` : `${remainder} 秒`;
}

function formatExpiry(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

if (!customElements.get("drive-ai-qa")) {
  customElements.define("drive-ai-qa", DriveAiQa);
}

declare global {
  interface HTMLElementTagNameMap {
    "drive-ai-qa": DriveAiQa;
  }
}
