export interface TransientStatusValue<TTone extends string> {
  message: string;
  tone: TTone;
}

export interface TransientStatusController<TTone extends string> {
  show(message: string, tone?: TTone): void;
  clear(): void;
}

export function createTransientStatusController<TTone extends string>(
  visibleMs: number,
  defaultTone: TTone,
  onChange: (value: TransientStatusValue<TTone>) => void,
): TransientStatusController<TTone> {
  let clearTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

  const clear = (): void => {
    if (clearTimer !== undefined) {
      globalThis.clearTimeout(clearTimer);
      clearTimer = undefined;
    }
    onChange({ message: "", tone: defaultTone });
  };

  return {
    show(message, tone = defaultTone) {
      if (clearTimer !== undefined) globalThis.clearTimeout(clearTimer);
      onChange({ message, tone });
      clearTimer = globalThis.setTimeout(() => {
        clearTimer = undefined;
        onChange({ message: "", tone: defaultTone });
      }, visibleMs);
    },
    clear,
  };
}
