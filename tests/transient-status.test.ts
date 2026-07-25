import { afterEach, describe, expect, it, vi } from "vitest";
import { createTransientStatusController, type TransientStatusValue } from "../src/drive/client/transient-status";
import { CLIENT_TIMING } from "../src/drive/shared/runtime";

type StatusTone = "neutral" | "success" | "danger";

afterEach(() => {
  vi.useRealTimers();
});

describe("transient page status", () => {
  it("uses the configured three-second visibility window", () => {
    expect(CLIENT_TIMING.statusVisibleMs).toBe(3_000);
  });

  it("keeps the status visible until three seconds have elapsed", async () => {
    vi.useFakeTimers();
    let current: TransientStatusValue<StatusTone> = { message: "", tone: "neutral" };
    const controller = createTransientStatusController<StatusTone>(CLIENT_TIMING.statusVisibleMs, "neutral", (value) => {
      current = value;
    });

    controller.show("已标记为已纳入方法论。", "success");
    await vi.advanceTimersByTimeAsync(2_999);
    expect(current).toEqual({ message: "已标记为已纳入方法论。", tone: "success" });

    await vi.advanceTimersByTimeAsync(1);
    expect(current).toEqual({ message: "", tone: "neutral" });
  });

  it("restarts the timer when a newer status replaces the current one", async () => {
    vi.useFakeTimers();
    let current: TransientStatusValue<StatusTone> = { message: "", tone: "neutral" };
    const controller = createTransientStatusController<StatusTone>(CLIENT_TIMING.statusVisibleMs, "neutral", (value) => {
      current = value;
    });

    controller.show("第一条提示", "success");
    await vi.advanceTimersByTimeAsync(2_000);
    controller.show("第二条提示", "danger");
    await vi.advanceTimersByTimeAsync(1_000);
    expect(current).toEqual({ message: "第二条提示", tone: "danger" });

    await vi.advanceTimersByTimeAsync(2_000);
    expect(current).toEqual({ message: "", tone: "neutral" });
  });
});
