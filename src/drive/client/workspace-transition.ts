export type WorkspaceTransitionKind =
  | "scope-forward"
  | "scope-back"
  | "topic-panel"
  | "file-role";

let activeTransition: ViewTransition | null = null;
let transitionSequence = 0;

export async function runWorkspaceTransition(
  kind: WorkspaceTransitionKind,
  update: () => void,
): Promise<void> {
  const reducedMotion = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || typeof document.startViewTransition !== "function") {
    activeTransition?.skipTransition();
    activeTransition = null;
    transitionSequence += 1;
    delete document.documentElement.dataset.workspaceTransition;
    update();
    return;
  }

  activeTransition?.skipTransition();
  const sequence = ++transitionSequence;
  document.documentElement.dataset.workspaceTransition = kind;
  let updated = false;
  const applyUpdate = (): void => {
    if (updated) return;
    update();
    updated = true;
  };

  try {
    const transition = document.startViewTransition(applyUpdate);
    activeTransition = transition;
    void transition.finished
      .catch(() => undefined)
      .finally(() => {
        if (transitionSequence !== sequence) return;
        activeTransition = null;
        delete document.documentElement.dataset.workspaceTransition;
      });
    await transition.updateCallbackDone.catch(() => undefined);
    applyUpdate();
  } catch {
    applyUpdate();
    if (transitionSequence === sequence) {
      activeTransition = null;
      delete document.documentElement.dataset.workspaceTransition;
    }
  }
}
