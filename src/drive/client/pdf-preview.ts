import { LitElement, html, nothing } from "lit";

type PdfCore = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
type PdfViewerModule = typeof import("pdfjs-dist/legacy/web/pdf_viewer.mjs");
type PdfDocument = Awaited<ReturnType<PdfCore["getDocument"]>["promise"]>;
type PdfLoadingTask = ReturnType<PdfCore["getDocument"]>;

interface PdfRuntime {
  core: PdfCore;
  viewer: PdfViewerModule;
}

interface PdfViewerInstance {
  currentPageNumber: number;
  currentScale: number;
  currentScaleValue: string;
  pagesCount: number;
  setDocument(document: PdfDocument | null): void;
  cleanup(): void;
}

interface PdfLinkServiceInstance {
  setViewer(viewer: PdfViewerInstance): void;
  setDocument(document: PdfDocument | null, baseUrl?: string | null): void;
}

let runtimePromise: Promise<PdfRuntime> | null = null;

async function loadRuntime(): Promise<PdfRuntime> {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const core = await import("pdfjs-dist/legacy/build/pdf.mjs");
      (globalThis as typeof globalThis & { pdfjsLib?: PdfCore }).pdfjsLib = core;
      core.GlobalWorkerOptions.workerSrc = new URL(__PDF_WORKER_FILENAME__, import.meta.url).href;
      const viewer = await import("pdfjs-dist/legacy/web/pdf_viewer.mjs");
      return { core, viewer };
    })();
  }
  return runtimePromise;
}

export class DrivePdfPreview extends LitElement {
  static properties = {
    url: { type: String },
    title: { type: String },
    loading: { state: true },
    failed: { state: true },
    currentPage: { state: true },
    pageCount: { state: true },
    scalePercent: { state: true },
  };

  url = "";
  title = "";
  private loading = true;
  private failed = false;
  private currentPage = 0;
  private pageCount = 0;
  private scalePercent = 100;

  private loadVersion = 0;
  private loadingTask: PdfLoadingTask | null = null;
  private pdfDocument: PdfDocument | null = null;
  private pdfViewer: PdfViewerInstance | null = null;
  private linkService: PdfLinkServiceInstance | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private viewerAbortController: AbortController | null = null;
  private fitWidth = true;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("keydown", this.handleKeydown);
  }

  disconnectedCallback(): void {
    this.removeEventListener("keydown", this.handleKeydown);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    void this.destroyDocument();
    super.disconnectedCallback();
  }

  protected firstUpdated(): void {
    void this.loadDocument();
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("url") && changed.get("url") !== undefined) {
      void this.loadDocument();
    }
  }

  protected render() {
    return html`
      <section class="drive-pdf-preview" aria-label=${this.title}>
        <div class="drive-pdf-toolbar">
          <div class="drive-pdf-toolbar-group">
            ${this.iconButton("ph-caret-left", "上一页", () => this.changePage(-1), this.currentPage <= 1)}
            <output class="drive-pdf-page-count" aria-live="polite">
              ${this.pageCount ? `${this.currentPage} / ${this.pageCount}` : "- / -"}
            </output>
            ${this.iconButton("ph-caret-right", "下一页", () => this.changePage(1), !this.pageCount || this.currentPage >= this.pageCount)}
          </div>
          <div class="drive-pdf-toolbar-group">
            ${this.iconButton("ph-minus", "缩小", () => this.changeScale(-10), this.scalePercent <= 50)}
            <output class="drive-pdf-scale">${this.scalePercent}%</output>
            ${this.iconButton("ph-plus", "放大", () => this.changeScale(10), this.scalePercent >= 200)}
            ${this.iconButton("ph-arrows-out-line-horizontal", "适应宽度", () => this.setFitWidth())}
            ${this.iconButton("ph-x", "关闭预览", () => this.close())}
          </div>
        </div>
        <div class="drive-pdf-stage ${this.loading ? "is-loading" : ""}" data-pdf-container tabindex="0">
          ${this.loading ? this.renderSkeleton() : nothing}
          ${this.failed
            ? html`<div class="drive-empty drive-pdf-error"><i class="ph ph-eye-slash" aria-hidden="true"></i><h3>无法预览</h3><p>请下载文件后查看。</p></div>`
            : nothing}
          <div class="pdfViewer" data-pdf-viewer ?hidden=${this.loading || this.failed}></div>
        </div>
      </section>
    `;
  }

  private iconButton(icon: string, label: string, handler: () => void, disabled = false) {
    return html`
      <button class="drive-icon-button" type="button" aria-label=${label} title=${label} ?disabled=${disabled} @click=${handler}>
        <i class="ph ${icon}" aria-hidden="true"></i>
      </button>
    `;
  }

  private renderSkeleton() {
    return html`
      <div class="drive-pdf-skeleton" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
    `;
  }

  private async loadDocument(): Promise<void> {
    if (!this.url || !this.isConnected) {
      return;
    }
    const version = ++this.loadVersion;
    await this.destroyDocument();
    this.loading = true;
    this.failed = false;
    this.currentPage = 0;
    this.pageCount = 0;
    this.scalePercent = 100;
    this.fitWidth = true;

    try {
      await this.updateComplete;
      const runtime = await loadRuntime();
      if (version !== this.loadVersion || !this.isConnected) {
        return;
      }
      const container = this.querySelector<HTMLDivElement>("[data-pdf-container]");
      const viewerElement = this.querySelector<HTMLDivElement>("[data-pdf-viewer]");
      if (!container || !viewerElement) {
        throw new Error("PDF viewer mount is unavailable");
      }

      const eventBus = new runtime.viewer.EventBus();
      const viewerAbortController = new AbortController();
      this.viewerAbortController = viewerAbortController;
      const linkService = new runtime.viewer.PDFLinkService({
        eventBus,
        externalLinkTarget: runtime.viewer.LinkTarget.BLANK,
        externalLinkRel: "noopener noreferrer nofollow",
      });
      const viewerOptions = {
        container,
        viewer: viewerElement,
        eventBus,
        linkService,
        annotationMode: runtime.core.AnnotationMode.ENABLE,
        annotationEditorMode: runtime.core.AnnotationEditorType.NONE,
        removePageBorders: true,
        supportsPinchToZoom: true,
        abortSignal: viewerAbortController.signal,
      } as ConstructorParameters<typeof runtime.viewer.PDFViewer>[0] & { abortSignal: AbortSignal };
      const pdfViewer = new runtime.viewer.PDFViewer(viewerOptions);
      linkService.setViewer(pdfViewer);

      eventBus.on("pagesinit", () => {
        if (version !== this.loadVersion) {
          return;
        }
        pdfViewer.currentScaleValue = "page-width";
        this.currentPage = 1;
        this.pageCount = pdfViewer.pagesCount;
        this.syncScale();
      }, { signal: viewerAbortController.signal });
      eventBus.on("pagechanging", ({ pageNumber }: { pageNumber: number }) => {
        if (version === this.loadVersion) {
          this.currentPage = pageNumber;
        }
      }, { signal: viewerAbortController.signal });
      eventBus.on("scalechanging", () => {
        if (version === this.loadVersion) {
          this.syncScale();
        }
      }, { signal: viewerAbortController.signal });

      const assetBase = new URL("./pdfjs-6.1.200/", import.meta.url).href;
      const loadingTask = runtime.core.getDocument({
        url: this.url,
        cMapUrl: `${assetBase}cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${assetBase}standard_fonts/`,
        wasmUrl: `${assetBase}wasm/`,
        iccUrl: `${assetBase}iccs/`,
        enableXfa: false,
      });
      this.loadingTask = loadingTask;
      const document = await loadingTask.promise;
      if (version !== this.loadVersion || !this.isConnected) {
        await loadingTask.destroy();
        return;
      }
      this.pdfDocument = document;
      this.pdfViewer = pdfViewer as unknown as PdfViewerInstance;
      this.linkService = linkService as unknown as PdfLinkServiceInstance;
      linkService.setDocument(document, null);
      pdfViewer.setDocument(document);
      this.pageCount = document.numPages;
      this.loading = false;

      this.resizeObserver = new ResizeObserver(() => {
        if (this.fitWidth && this.pdfViewer) {
          this.pdfViewer.currentScaleValue = "page-width";
          this.syncScale();
        }
      });
      this.resizeObserver.observe(container);
    } catch (error) {
      if (version !== this.loadVersion || (error instanceof Error && error.name === "AbortException")) {
        return;
      }
      await this.destroyDocument();
      this.loading = false;
      this.failed = true;
    }
  }

  private async destroyDocument(): Promise<void> {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.viewerAbortController?.abort();
    this.viewerAbortController = null;
    this.pdfViewer?.setDocument(null);
    this.pdfViewer?.cleanup();
    this.linkService?.setDocument(null);
    this.pdfViewer = null;
    this.linkService = null;
    const loadingTask = this.loadingTask;
    this.pdfDocument = null;
    this.loadingTask = null;
    if (loadingTask) {
      await loadingTask.destroy().catch(() => undefined);
    }
  }

  private changePage(delta: number): void {
    if (!this.pdfViewer || !this.pageCount) {
      return;
    }
    this.pdfViewer.currentPageNumber = Math.min(this.pageCount, Math.max(1, this.currentPage + delta));
  }

  private changeScale(delta: number): void {
    if (!this.pdfViewer) {
      return;
    }
    this.fitWidth = false;
    const next = Math.min(200, Math.max(50, this.scalePercent + delta));
    this.pdfViewer.currentScale = next / 100;
    this.scalePercent = next;
  }

  private setFitWidth(): void {
    if (!this.pdfViewer) {
      return;
    }
    this.fitWidth = true;
    this.pdfViewer.currentScaleValue = "page-width";
    this.syncScale();
  }

  private syncScale(): void {
    if (this.pdfViewer && Number.isFinite(this.pdfViewer.currentScale)) {
      this.scalePercent = Math.min(200, Math.max(50, Math.round(this.pdfViewer.currentScale * 100)));
    }
  }

  private close(): void {
    this.dispatchEvent(new CustomEvent("drive-pdf-close", { bubbles: true, composed: true }));
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
    }
  };
}

if (!customElements.get("drive-pdf-preview")) {
  customElements.define("drive-pdf-preview", DrivePdfPreview);
}

declare global {
  interface HTMLElementTagNameMap {
    "drive-pdf-preview": DrivePdfPreview;
  }
}
