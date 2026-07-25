export type SupportMotionQuery = {
  matches: boolean;
};

export type SupportMotionWindow = {
  innerWidth: number;
  devicePixelRatio?: number;
  matchMedia(query: string): SupportMotionQuery;
};

export function prefersReducedSupportMotion(target: SupportMotionWindow): boolean {
  return target.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function supportParticleBudget(
  width: number,
  devicePixelRatio = 1,
  reducedMotion = false,
): { count: number; dpr: number } {
  const dpr = Math.min(Math.max(devicePixelRatio, 1), 1.5);
  if (reducedMotion) return { count: 72, dpr: 1 };
  if (width < 560) return { count: 130, dpr };
  if (width < 900) return { count: 210, dpr };
  return { count: 340, dpr };
}

export class SupportRenderGate {
  private documentVisible = true;
  private canvasVisible = true;
  private reducedMotion = false;

  get active(): boolean {
    return this.documentVisible && this.canvasVisible && !this.reducedMotion;
  }

  setDocumentVisible(visible: boolean): void {
    this.documentVisible = visible;
  }

  setCanvasVisible(visible: boolean): void {
    this.canvasVisible = visible;
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }
}
