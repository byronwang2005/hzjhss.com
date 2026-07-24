// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";

type ThemeName = "light" | "dark";
type ThemeController = {
  getPreference(): ThemeName | null;
  getResolvedTheme(): ThemeName;
  setTheme(theme: ThemeName): void;
  subscribe(listener: (theme: ThemeName) => void): () => void;
  toggleTheme(): void;
};

const source = readFileSync("theme-controller.js", "utf8");

function createThemeWindow(systemDark: boolean, storedTheme?: ThemeName) {
  const browserWindow = new Window({ url: "https://hzjhss.test/" });
  let dark = systemDark;
  let systemListener: (() => void) | undefined;

  Object.defineProperty(browserWindow, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      get matches() {
        return dark;
      },
      addEventListener: (_type: string, listener: () => void) => {
        systemListener = listener;
      },
    })),
  });
  if (storedTheme) {
    browserWindow.localStorage.setItem("jhss-theme", storedTheme);
  }
  browserWindow.eval(source);

  return {
    controller: (browserWindow as unknown as { jhssTheme: ThemeController }).jhssTheme,
    document: browserWindow.document,
    setSystemDark(value: boolean) {
      dark = value;
      systemListener?.();
    },
    window: browserWindow,
  };
}

describe("shared theme controller", () => {
  it("follows the system until the user stores a preference", () => {
    const context = createThemeWindow(true);
    expect(context.controller.getPreference()).toBeNull();
    expect(context.controller.getResolvedTheme()).toBe("dark");
    expect(context.document.documentElement.dataset.theme).toBe("dark");

    context.setSystemDark(false);
    expect(context.controller.getResolvedTheme()).toBe("light");
    expect(context.document.documentElement.dataset.theme).toBe("light");
  });

  it("restores and toggles a persisted preference", () => {
    const context = createThemeWindow(true, "light");
    expect(context.controller.getResolvedTheme()).toBe("light");

    context.setSystemDark(true);
    expect(context.controller.getResolvedTheme()).toBe("light");

    context.controller.toggleTheme();
    expect(context.controller.getResolvedTheme()).toBe("dark");
    expect(context.window.localStorage.getItem("jhss-theme")).toBe("dark");
  });

  it("synchronizes theme changes from another tab", () => {
    const context = createThemeWindow(false);
    context.window.dispatchEvent(new context.window.StorageEvent("storage", {
      key: "jhss-theme",
      newValue: "dark",
    }));

    expect(context.controller.getPreference()).toBe("dark");
    expect(context.controller.getResolvedTheme()).toBe("dark");
    expect(context.document.documentElement.dataset.theme).toBe("dark");
  });

  it("still switches when local storage is unavailable", () => {
    const browserWindow = new Window({ url: "https://hzjhss.test/" });
    Object.defineProperty(browserWindow, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false, addEventListener: () => undefined }),
    });
    Object.defineProperty(browserWindow, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("storage blocked");
      },
    });

    browserWindow.eval(source);
    const controller = (browserWindow as unknown as { jhssTheme: ThemeController }).jhssTheme;
    controller.toggleTheme();

    expect(controller.getResolvedTheme()).toBe("dark");
    expect(browserWindow.document.documentElement.dataset.theme).toBe("dark");
  });
});
