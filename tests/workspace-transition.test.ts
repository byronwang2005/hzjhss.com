// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { runWorkspaceTransition } from "../src/drive/client/workspace-transition";

const originalMatchMedia = window.matchMedia;
const originalStartViewTransition = document.startViewTransition;

afterEach(() => {
  if (originalStartViewTransition) installStartViewTransition(originalStartViewTransition);
  else Reflect.deleteProperty(document, "startViewTransition");
  delete document.documentElement.dataset.workspaceTransition;
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe("workspace view transitions", () => {
  it("updates immediately when the browser does not support view transitions", async () => {
    const update = vi.fn();
    await runWorkspaceTransition("scope-forward", update);
    expect(update).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.workspaceTransition).toBeUndefined();
  });

  it("skips view transitions when reduced motion is requested", async () => {
    window.matchMedia = vi.fn((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    const start = vi.fn();
    installStartViewTransition(start);
    const update = vi.fn();
    await runWorkspaceTransition("topic-panel", update);
    expect(update).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();
  });

  it("applies the DOM update before resolving without waiting for the animation", async () => {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => { finish = resolve; });
    const skipTransition = vi.fn();
    installStartViewTransition(vi.fn((update: () => void) => {
      update();
      return transitionFixture(finished, skipTransition);
    }));
    const update = vi.fn();
    await runWorkspaceTransition("scope-forward", update);
    expect(update).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.workspaceTransition).toBe("scope-forward");
    finish();
    await finished;
    await Promise.resolve();
    expect(document.documentElement.dataset.workspaceTransition).toBeUndefined();
  });

  it("skips an active transition when a newer navigation starts", async () => {
    const firstSkip = vi.fn();
    const secondSkip = vi.fn();
    let finishFirst!: () => void;
    let finishSecond!: () => void;
    const firstFinished = new Promise<void>((resolve) => { finishFirst = resolve; });
    const secondFinished = new Promise<void>((resolve) => { finishSecond = resolve; });
    installStartViewTransition(vi.fn()
      .mockImplementationOnce((update: () => void) => {
        update();
        return transitionFixture(firstFinished, firstSkip);
      })
      .mockImplementationOnce((update: () => void) => {
        update();
        return transitionFixture(secondFinished, secondSkip);
      }));

    await runWorkspaceTransition("scope-forward", vi.fn());
    await runWorkspaceTransition("topic-panel", vi.fn());
    expect(firstSkip).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.workspaceTransition).toBe("topic-panel");

    finishFirst();
    finishSecond();
    await Promise.all([firstFinished, secondFinished]);
    await Promise.resolve();
    expect(document.documentElement.dataset.workspaceTransition).toBeUndefined();
  });
});

function installStartViewTransition(implementation: unknown): void {
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: implementation,
  });
}

function transitionFixture(finished: Promise<unknown>, skipTransition: () => void): ViewTransition {
  return {
    finished,
    ready: Promise.resolve(),
    types: new Set(),
    updateCallbackDone: Promise.resolve(),
    skipTransition,
  } as unknown as ViewTransition;
}
