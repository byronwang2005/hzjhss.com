(function initializeJhssTheme() {
  "use strict";

  if (window.jhssTheme) {
    return;
  }

  const storageKey = "jhss-theme";
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const listeners = new Set();

  const readPreference = () => {
    try {
      const value = window.localStorage.getItem(storageKey);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  };

  let preference = readPreference();
  let resolvedTheme = preference || (systemTheme.matches ? "dark" : "light");

  const notify = () => {
    listeners.forEach((listener) => listener(resolvedTheme));
  };

  const applyTheme = (theme) => {
    const changed = resolvedTheme !== theme;
    resolvedTheme = theme;
    document.documentElement.dataset.theme = theme;
    if (changed) {
      notify();
    }
  };

  const resolveTheme = () => preference || (systemTheme.matches ? "dark" : "light");

  const setTheme = (theme) => {
    if (theme !== "light" && theme !== "dark") {
      return;
    }
    preference = theme;
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // The active document still switches even when storage is unavailable.
    }
    applyTheme(theme);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    listener(resolvedTheme);
    return () => listeners.delete(listener);
  };

  systemTheme.addEventListener("change", () => {
    if (!preference) {
      applyTheme(resolveTheme());
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey) {
      return;
    }
    preference = event.newValue === "light" || event.newValue === "dark" ? event.newValue : null;
    applyTheme(resolveTheme());
  });

  document.documentElement.dataset.theme = resolvedTheme;
  window.jhssTheme = Object.freeze({
    getPreference: () => preference,
    getResolvedTheme: () => resolvedTheme,
    setTheme,
    subscribe,
    toggleTheme,
  });
})();
