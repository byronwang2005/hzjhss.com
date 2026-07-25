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
  QaErrorEventData,
  QaNoResultsEventData,
  QaProgressStage,
  QaRetrievalSummary,
} from "../shared/contracts";

interface QaProgressUi {
  mode: "working" | "complete" | "no-results" | "stopped" | "error";
  stage: QaProgressStage;
  completed: QaProgressStage[];
  deepThinking: boolean;
  elapsedSeconds: number;
  expanded: boolean;
  retrieval?: QaRetrievalSummary;
  noResults?: QaNoResultsEventData;
  totalMs?: number;
}

interface QaChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  error?: boolean;
  excludeFromHistory?: boolean;
  failure?: QaErrorEventData;
  progress?: QaProgressUi;
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
const QA_PROGRESS_STAGES: Array<{ stage: QaProgressStage; label: string; icon: string }> = [
  { stage: "parsing", label: "解析问题", icon: "chat-circle-dots" },
  { stage: "retrieving", label: "检索资料", icon: "magnifying-glass" },
  { stage: "reasoning", label: "分析证据", icon: "brain" },
  { stage: "composing", label: "组织回答", icon: "article" },
];

function initialHandoffUi(): CodexHandoffUi {
  return {
    mode: "idle",
    stage: "preparing",
    elapsedSeconds: 0,
    showCopyFallback: false,
    copied: false,
  };
}

function initialQaProgress(): QaProgressUi {
  return {
    mode: "working",
    stage: "parsing",
    completed: [],
    deepThinking: false,
    elapsedSeconds: 0,
    expanded: true,
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
  private qaElapsedTimer: number | undefined;
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
    this.stopQaElapsedTimer();
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
    const title = isGlobal ? "向全部资料提问" : `在${this.topicName || "当前专题"}中提问`;
    return html`
      <section class=${classMap({
        "drive-ai-qa": true,
        "is-global": isGlobal,
        "is-empty": this.messages.length === 0,
        "has-notice": !this.ready,
      })} aria-label=${title} aria-busy=${String(this.streaming)}>
        ${this.messages.length ? html`
          <header class="drive-ai-qa-head is-actions-only">
            <button class="drive-control drive-ai-qa-clear" type="button" @click=${() => this.clearConversation()} ?disabled=${this.streaming}>
              ${renderIcon("plus")}新对话
            </button>
          </header>
        ` : nothing}

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
          <div class="drive-ai-qa-composer-meta">
            <span>${renderIcon(isGlobal ? "files" : "folder")}${isGlobal ? "检索全部资料" : `仅检索「${this.topicName || "当前专题"}」`}</span>
            <span>Enter 发送 · Shift + Enter 换行</span>
          </div>
          <span
            class="drive-ai-qa-status"
            role=${this.streaming ? nothing : "status"}
            aria-live=${this.streaming ? "off" : "polite"}
          >
            ${this.status || (this.ready ? "对话仅保存在当前页面，刷新后清空。" : "文件处理和索引完成后即可使用。")}
          </span>
        </form>
      </section>
    `;
  }

  private renderEmptyState(): TemplateResult {
    const isGlobal = this.scope === "global";
    const name = this.displayName.trim();
    const suggestions = isGlobal
      ? ["比较不同专题的共同结论", "找出资料中的主要风险", "按来源汇总关键证据"]
      : ["概括这个专题的核心结论", "提取最重要的数据和日期", "哪些判断仍存在不确定性"];
    return html`
      <div class="drive-ai-qa-empty">
        <div class="drive-ai-qa-empty-copy">
          <span class="drive-eyebrow">${isGlobal ? name ? `欢迎回来，${name}` : "AI 知识检索" : `当前专题 · ${this.topicName || "未命名专题"}`}</span>
          <h3>${this.ready ? isGlobal ? "今天想从资料里确认什么？" : "从这个专题开始提问" : "等待文件处理"}</h3>
          <p>${this.ready ? "描述你想比较、核实或追溯的问题，回答会尽量关联到原始资料。" : "索引完成后，这里会提供基于资料的可追溯回答。"}</p>
        </div>
        ${this.ready ? html`
          <div class="drive-ai-qa-suggestions" aria-label="建议问题">
            ${suggestions.map((suggestion) => html`
              <button type="button" @click=${() => this.applySuggestion(suggestion)}>${renderIcon("arrow-right")}<span>${suggestion}</span></button>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private applySuggestion(suggestion: string): void {
    if (!this.ready || this.streaming) return;
    this.question = suggestion;
    void this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>('textarea[name="qaQuestion"]')?.focus());
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
    return false;
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
        <header><span>${message.role === "user" ? "您" : "AI"}</span>${message.pending ? html`<small>处理中</small>` : nothing}</header>
        ${message.role === "assistant"
          ? html`
              ${message.progress ? this.renderQaProgress(message) : nothing}
              ${message.progress?.mode === "no-results"
                ? this.renderNoResults(message)
                : message.content
                  ? html`<div class="drive-ai-qa-markdown">${unsafeHTML(rendered)}</div>`
                  : message.pending && !message.progress
                    ? this.renderSkeleton()
                    : nothing}
            `
          : html`<p>${message.content}</p>`}
        ${message.error
          ? html`<div class="drive-ai-qa-error">
              <span>${message.failure?.message || "本次生成失败。"}</span>
              ${message.failure?.retryable === false
                ? nothing
                : html`<button type="button" @click=${() => this.retry(message.id)}>${renderIcon("arrow-clockwise")}重试</button>`}
            </div>`
          : nothing}
        ${showHandoff ? this.renderCodexHandoff() : nothing}
      </article>
    `;
  }

  private renderQaProgress(message: QaChatMessage): TemplateResult {
    const progress = message.progress!;
    const isCompact = progress.mode === "complete" || progress.mode === "stopped" || (Boolean(message.content) && !progress.expanded);
    const summary = this.qaProgressSummary(progress);
    if (isCompact) {
      return html`
        <button
          class="drive-ai-qa-progress-summary"
          type="button"
          aria-expanded=${String(progress.expanded)}
          @click=${() => this.toggleQaProgress(message.id)}
        >
          <span class="drive-ai-qa-progress-summary-icon">${renderIcon(progress.mode === "complete" ? "check-circle-fill" : "spinner-gap")}</span>
          <span>${summary}</span>
          ${renderIcon(progress.expanded ? "caret-up" : "caret-down")}
        </button>
        ${progress.expanded ? this.renderQaProgressSteps(progress) : nothing}
      `;
    }
    return this.renderQaProgressSteps(progress);
  }

  private renderQaProgressSteps(progress: QaProgressUi): TemplateResult {
    const activeText = this.qaProgressStatus(progress);
    const activeIndex = qaProgressStageIndex(progress.stage);
    return html`
      <section
        class=${classMap({
          "drive-ai-qa-progress": true,
          "is-complete": progress.mode === "complete",
          "is-no-results": progress.mode === "no-results",
          "is-stopped": progress.mode === "stopped",
          "is-error": progress.mode === "error",
        })}
        aria-label="AI 回答处理进度"
      >
        <div class="drive-ai-qa-progress-head">
          <div>
            <strong>${progress.mode === "no-results"
              ? "检索已完成"
              : progress.mode === "stopped"
                ? "已停止生成"
                : progress.mode === "error"
                  ? "处理未完成"
                  : activeText}</strong>
            ${progress.retrieval && progress.mode !== "no-results"
              ? html`<span>${this.qaRetrievalDetail(progress.retrieval)}</span>`
              : nothing}
          </div>
          ${progress.elapsedSeconds >= 3 && progress.mode === "working"
            ? html`<small aria-hidden="true">已等待 ${formatElapsed(progress.elapsedSeconds)}</small>`
            : nothing}
        </div>
        <div class="drive-ai-qa-progress-live" role="status" aria-live="polite">${activeText}</div>
        <ol class="drive-ai-qa-progress-steps">
          ${QA_PROGRESS_STAGES.map((item, index) => {
            const isDone = progress.completed.includes(item.stage) || progress.mode === "complete";
            const isSkipped = progress.mode === "no-results" && index > qaProgressStageIndex("retrieving");
            const isActive = progress.mode === "working" && index === activeIndex && !isDone;
            const isError = progress.mode === "error" && index === activeIndex;
            return html`
              <li class=${classMap({
                "drive-ai-qa-progress-step": true,
                "is-done": isDone,
                "is-active": isActive,
                "is-skipped": isSkipped,
                "is-error": isError,
              })}>
                <span class="drive-ai-qa-progress-node">
                  <span class="drive-ai-qa-progress-icon">${renderIcon(item.icon)}</span>
                  <span class="drive-ai-qa-progress-check">${renderIcon("check-circle-fill")}</span>
                </span>
                <span class="drive-ai-qa-progress-copy">
                  <strong>${item.label}</strong>
                  <small>${isSkipped ? "未执行" : this.qaStageDetail(item.stage, progress)}</small>
                </span>
              </li>
            `;
          })}
        </ol>
      </section>
    `;
  }

  private renderNoResults(message: QaChatMessage): TemplateResult {
    const progress = message.progress!;
    const result = progress.noResults || progress.retrieval;
    const scopeText = result?.scope === "global"
      ? `已检查 ${result.topicCount} 个可用专题`
      : "已检查当前专题";
    return html`
      <div class="drive-ai-qa-no-results">
        <span class="drive-ai-qa-no-results-icon">${renderIcon("magnifying-glass")}</span>
        <div>
          <strong>已完成检索，但暂未找到足以支持回答的资料。</strong>
          <p>${scopeText}。${progress.noResults?.hint || "可尝试补充时间、对象、指标或资料名称后重新提问。"}</p>
        </div>
        <button type="button" @click=${() => this.modifyQuestion(message.id)}>
          ${renderIcon("pencil-simple")}修改问题
        </button>
      </div>
    `;
  }

  private qaProgressStatus(progress: QaProgressUi): string {
    if (progress.mode === "no-results") return "资料检索完成，未发现有效依据";
    if (progress.mode === "complete") return this.qaProgressSummary(progress);
    if (progress.mode === "stopped") return "已停止生成，已保留当前回答";
    if (progress.mode === "error") return `${qaProgressStageLabel(progress.stage)}未完成`;
    if (progress.stage === "parsing") return "正在确认问题与检索范围";
    if (progress.stage === "retrieving") {
      return this.scope === "global" ? "正在检索全部可用专题" : "正在检索当前专题";
    }
    if (progress.stage === "reasoning") {
      return `正在分析证据${progress.deepThinking ? " · 深度思考已启用" : ""}`;
    }
    return "正在组织可追溯回答";
  }

  private qaStageDetail(stage: QaProgressStage, progress: QaProgressUi): string {
    if (stage === "parsing") return progress.completed.includes(stage) ? "范围已确认" : "确认问题与资料范围";
    if (stage === "retrieving") {
      return progress.retrieval
        ? this.qaRetrievalDetail(progress.retrieval)
        : this.scope === "global" ? "扫描可用专题索引" : "扫描当前专题索引";
    }
    if (stage === "reasoning") {
      if (progress.deepThinking) return "深度思考已启用";
      return progress.completed.includes(stage) ? "证据分析完成" : "核对证据与方法框架";
    }
    return progress.completed.includes(stage) ? "回答组织完成" : "生成可追溯回答";
  }

  private qaRetrievalDetail(summary: QaRetrievalSummary): string {
    const range = summary.scope === "global" ? `${summary.topicCount} 个专题` : "当前专题";
    const methodology = summary.methodologyCount
      ? ` · ${summary.methodologyCount} 个方法片段`
      : "";
    return `${range} · ${summary.evidenceSourceCount} 份证据资料 · ${summary.evidenceCount} 个证据片段${methodology}`;
  }

  private qaProgressSummary(progress: QaProgressUi): string {
    const summary = progress.retrieval;
    const range = summary
      ? summary.scope === "global" ? `已检索 ${summary.topicCount} 个专题` : "已检索当前专题"
      : "处理过程";
    const sources = summary ? ` · 引用 ${summary.evidenceSourceCount} 份资料` : "";
    const durationMs = progress.totalMs ?? progress.elapsedSeconds * 1_000;
    const duration = durationMs > 0 ? ` · 用时 ${formatDurationMs(durationMs)}` : "";
    return `${range}${sources}${duration}`;
  }

  private toggleQaProgress(messageId: string): void {
    const message = this.messages.find((item) => item.id === messageId);
    if (!message?.progress) return;
    message.progress = { ...message.progress, expanded: !message.progress.expanded };
    this.messages = [...this.messages];
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
    const assistantMessage: QaChatMessage = {
      id: this.messageId(),
      role: "assistant",
      content: "",
      pending: true,
      progress: initialQaProgress(),
    };
    this.messages = [...this.messages, userMessage, assistantMessage];
    this.question = "";
    this.streaming = true;
    const controller = new AbortController();
    this.abortController = controller;
    this.startQaElapsedTimer(assistantMessage);
    this.setStatus("正在确认问题与检索范围...");

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
      if (assistantMessage.progress?.mode === "no-results") {
        assistantMessage.pending = false;
        assistantMessage.excludeFromHistory = true;
        this.messages = [...this.messages];
        this.setStatus("检索完成，未找到有效资料。");
        return;
      }
      if (!assistantMessage.content) throw new Error("模型没有返回可显示的流式内容");
      assistantMessage.pending = false;
      assistantMessage.progress = {
        ...(assistantMessage.progress || initialQaProgress()),
        mode: "complete",
        stage: "composing",
        completed: QA_PROGRESS_STAGES.map(({ stage }) => stage),
        expanded: false,
      };
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
          if (assistantMessage.progress) {
            assistantMessage.progress = {
              ...assistantMessage.progress,
              mode: "stopped",
              expanded: false,
              totalMs: assistantMessage.progress.elapsedSeconds * 1_000,
            };
          }
          this.messages = [...this.messages];
        }
        this.setStatus("已停止生成。");
      } else {
        assistantMessage.error = true;
        if (assistantMessage.progress) {
          assistantMessage.progress = { ...assistantMessage.progress, mode: "error", expanded: true };
        }
        this.messages = [...this.messages];
        this.setStatus(error instanceof Error ? error.message : "问答请求失败", "danger");
      }
    } finally {
      this.stopQaElapsedTimer();
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
        const data = dataText ? JSON.parse(dataText) as Record<string, unknown> : {};
        if (event === "phase" && isQaProgressStage(data.stage) && isQaProgressState(data.state)) {
          this.applyQaPhase(assistantMessage, data.stage, data.state);
        } else if (event === "retrieval_summary") {
          const summary = parseQaRetrievalSummary(data);
          if (summary) {
            assistantMessage.progress = {
              ...(assistantMessage.progress || initialQaProgress()),
              retrieval: summary,
            };
            this.messages = [...this.messages];
          }
        } else if (event === "no_results") {
          const noResults = parseQaNoResults(data);
          if (noResults) {
            assistantMessage.progress = {
              ...(assistantMessage.progress || initialQaProgress()),
              mode: "no-results",
              stage: "retrieving",
              completed: ["parsing", "retrieving"],
              retrieval: noResults,
              noResults,
              expanded: true,
            };
            assistantMessage.pending = false;
            assistantMessage.excludeFromHistory = true;
            this.messages = [...this.messages];
          }
        } else if (event === "thinking" && typeof data.active === "boolean") {
          const progress = assistantMessage.progress || initialQaProgress();
          assistantMessage.progress = {
            ...progress,
            stage: qaProgressStageIndex(progress.stage) > qaProgressStageIndex("reasoning") ? progress.stage : "reasoning",
            deepThinking: data.active || progress.deepThinking,
          };
          this.messages = [...this.messages];
        } else if (event === "delta" && typeof data.content === "string") {
          const progress = assistantMessage.progress || initialQaProgress();
          assistantMessage.progress = {
            ...progress,
            stage: "composing",
            completed: mergeQaCompleted(progress.completed, ["parsing", "retrieving", "reasoning"]),
            expanded: false,
          };
          assistantMessage.content += data.content;
          this.messages = [...this.messages];
        } else if (event === "done" && typeof data.totalMs === "number" && Number.isFinite(data.totalMs)) {
          const progress = assistantMessage.progress || initialQaProgress();
          assistantMessage.progress = { ...progress, totalMs: Math.max(0, data.totalMs) };
          this.messages = [...this.messages];
        } else if (event === "error") {
          const failure = parseQaError(data);
          if (failure) {
            assistantMessage.failure = failure;
            if (assistantMessage.progress) {
              assistantMessage.progress = { ...assistantMessage.progress, stage: failure.stage, mode: "error" };
            }
          }
          throw new Error(
            failure
              ? failure.message
              : typeof data.message === "string"
                ? data.message
                : typeof data.error === "string"
                  ? data.error
                  : "模型流式输出失败",
          );
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
    this.stopQaElapsedTimer();
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

  private modifyQuestion(messageId: string): void {
    if (this.streaming) return;
    const assistantIndex = this.messages.findIndex((message) => message.id === messageId && message.role === "assistant");
    if (assistantIndex < 1) return;
    const userMessage = this.messages[assistantIndex - 1];
    if (userMessage.role !== "user") return;
    this.messages = this.messages.filter((_, index) => index !== assistantIndex && index !== assistantIndex - 1);
    this.question = userMessage.content;
    this.setStatus("可补充时间、对象、指标或资料名称后重新提问。");
    void this.updateComplete.then(() => {
      const textarea = this.querySelector<HTMLTextAreaElement>("textarea");
      textarea?.focus();
      if (textarea) textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  }

  private applyQaPhase(
    assistantMessage: QaChatMessage,
    stage: QaProgressStage,
    state: "active" | "complete",
  ): void {
    const progress = assistantMessage.progress || initialQaProgress();
    const currentIndex = qaProgressStageIndex(progress.stage);
    const nextIndex = qaProgressStageIndex(stage);
    if (nextIndex < currentIndex) return;
    assistantMessage.progress = {
      ...progress,
      stage,
      completed: state === "complete"
        ? mergeQaCompleted(progress.completed, [stage])
        : progress.completed,
    };
    this.messages = [...this.messages];
  }

  private startQaElapsedTimer(assistantMessage: QaChatMessage): void {
    this.stopQaElapsedTimer();
    const startedAt = Date.now();
    this.qaElapsedTimer = window.setInterval(() => {
      if (!assistantMessage.pending || !assistantMessage.progress) return;
      assistantMessage.progress = {
        ...assistantMessage.progress,
        elapsedSeconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1_000)),
      };
      this.messages = [...this.messages];
    }, 1_000);
  }

  private stopQaElapsedTimer(): void {
    if (this.qaElapsedTimer !== undefined) {
      window.clearInterval(this.qaElapsedTimer);
      this.qaElapsedTimer = undefined;
    }
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

function isQaProgressStage(value: unknown): value is QaProgressStage {
  return value === "parsing" || value === "retrieving" || value === "reasoning" || value === "composing";
}

function isQaProgressState(value: unknown): value is "active" | "complete" {
  return value === "active" || value === "complete";
}

function qaProgressStageIndex(stage: QaProgressStage): number {
  return QA_PROGRESS_STAGES.findIndex((item) => item.stage === stage);
}

function qaProgressStageLabel(stage: QaProgressStage): string {
  return QA_PROGRESS_STAGES.find((item) => item.stage === stage)?.label || "处理";
}

function mergeQaCompleted(current: QaProgressStage[], incoming: QaProgressStage[]): QaProgressStage[] {
  const completed = new Set([...current, ...incoming]);
  return QA_PROGRESS_STAGES.map(({ stage }) => stage).filter((stage) => completed.has(stage));
}

function parseQaRetrievalSummary(value: Record<string, unknown>): QaRetrievalSummary | null {
  const scope = value.scope;
  if (scope !== "global" && scope !== "topic") return null;
  const fields = ["topicCount", "candidateCount", "evidenceCount", "methodologyCount", "elapsedMs"] as const;
  if (!fields.every((field) => typeof value[field] === "number" && Number.isFinite(value[field]) && Number(value[field]) >= 0)) {
    return null;
  }
  const evidenceSourceCount = value.evidenceSourceCount ?? value.sourceCount;
  const methodologySourceCount = value.methodologySourceCount ?? 0;
  if (
    typeof evidenceSourceCount !== "number"
    || !Number.isFinite(evidenceSourceCount)
    || evidenceSourceCount < 0
    || typeof methodologySourceCount !== "number"
    || !Number.isFinite(methodologySourceCount)
    || methodologySourceCount < 0
  ) return null;
  return {
    scope,
    topicCount: Math.floor(Number(value.topicCount)),
    candidateCount: Math.floor(Number(value.candidateCount)),
    evidenceCount: Math.floor(Number(value.evidenceCount)),
    methodologyCount: Math.floor(Number(value.methodologyCount)),
    evidenceSourceCount: Math.floor(evidenceSourceCount),
    methodologySourceCount: Math.floor(methodologySourceCount),
    elapsedMs: Math.max(0, Number(value.elapsedMs)),
  };
}

function parseQaError(value: Record<string, unknown>): QaErrorEventData | null {
  if (
    !isQaProgressStage(value.stage)
    || !isQaErrorCode(value.code)
    || typeof value.retryable !== "boolean"
    || typeof value.message !== "string"
    || !value.message.trim()
  ) return null;
  return {
    stage: value.stage,
    code: value.code,
    retryable: value.retryable,
    message: value.message.trim(),
  };
}

function isQaErrorCode(value: unknown): value is QaErrorEventData["code"] {
  return value === "RETRIEVAL_SCOPE_INVALID"
    || value === "RETRIEVAL_SCOPE_UNAVAILABLE"
    || value === "RETRIEVAL_FAILED"
    || value === "MODEL_CAPACITY_EXCEEDED"
    || value === "MODEL_CONFIGURATION_ERROR"
    || value === "MODEL_BUSY"
    || value === "MODEL_START_FAILED"
    || value === "MODEL_STREAM_FAILED";
}

function parseQaNoResults(value: Record<string, unknown>): QaNoResultsEventData | null {
  const summary = parseQaRetrievalSummary(value);
  if (!summary) return null;
  return {
    ...summary,
    hint: typeof value.hint === "string" && value.hint.trim()
      ? value.hint.trim()
      : "可尝试补充时间、对象、指标或资料名称后重新提问。",
  };
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes}:${String(remainder).padStart(2, "0")}` : `${remainder} 秒`;
}

function formatDurationMs(milliseconds: number): string {
  if (milliseconds < 1_000) return `${Math.max(1, Math.round(milliseconds))} 毫秒`;
  return `${(milliseconds / 1_000).toFixed(milliseconds < 10_000 ? 1 : 0)} 秒`;
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
