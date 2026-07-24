const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const faviconUrl = document.querySelector('link[rel="icon"]')?.href || document.baseURI;
const iconSpriteUrl = new URL("phosphor-sprite.svg", faviconUrl).href;

initThemeToggle();
initIcons();
initCopyButtons();
initArticleToc();
initSetupTabs();
initGxy();

function createIcon(name, weight = "regular", className = "") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  svg.setAttribute("class", `ui-icon ${className}`.trim());
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  use.setAttribute("href", `${iconSpriteUrl}#ph-${weight}-${name}`);
  svg.append(use);
  return svg;
}

function addIcon(element, name, { weight = "regular", position = "prepend", className = "" } = {}) {
  if (!element || element.querySelector(":scope > .ui-icon")) {
    return;
  }
  element[position](createIcon(name, weight, className));
}

function initThemeToggle() {
  const controller = window.jhssTheme;
  const navigation = document.querySelector(".top-nav, .drive-nav");
  if (!controller || !navigation) {
    return;
  }

  const button = document.createElement("button");
  button.className = "theme-toggle";
  button.type = "button";
  button.dataset.themeToggle = "";
  navigation.append(button);

  const update = (theme) => {
    const target = theme === "dark" ? "亮色" : "暗色";
    button.replaceChildren(createIcon(theme === "dark" ? "sun" : "moon"));
    button.setAttribute("aria-label", `切换到${target}主题`);
    button.title = `切换到${target}主题`;
  };

  button.addEventListener("click", () => controller.toggleTheme());
  controller.subscribe(update);
}

function initIcons() {
  document.querySelectorAll(".top-nav a").forEach((link, index) => {
    addIcon(link, index === 0 ? "database" : "arrow-square-out", { position: "append", className: "ui-icon-sm" });
  });
  document.querySelectorAll(".back-link").forEach((link) => addIcon(link, "arrow-left"));
  document.querySelectorAll(".footer a").forEach((link) => addIcon(link, "house"));
  document.querySelectorAll(".article-list-item em").forEach((label) => addIcon(label, "arrow-right", { position: "append" }));
  document.querySelectorAll(".toc-toggle").forEach((button) => addIcon(button, "caret-down", { position: "append", className: "toc-caret" }));
  document.querySelectorAll(".copy-button").forEach((button) => {
    button.prepend(createIcon("copy", "regular", "icon-copy"), createIcon("check", "bold", "icon-check"));
  });
  document.querySelectorAll(".system-tab[data-system]").forEach((button) => {
    addIcon(button, button.dataset.system === "macos" ? "apple-logo" : "windows-logo");
  });
  document.querySelectorAll(".architecture-tab").forEach((button) => addIcon(button, "cpu", { className: "ui-icon-sm" }));
}

function initCopyButtons() {
  const resetTimers = new WeakMap();
  document.querySelectorAll(".code-block, .field-value").forEach((block) => {
    const button = block.querySelector(".copy-button");
    const label = button?.querySelector("span");
    const code = block.querySelector("code") || block;
    if (!button || !label) {
      return;
    }
    const originalText = label.textContent || "复制";
    const originalAriaLabel = button.getAttribute("aria-label") || originalText;

    button.addEventListener("click", async () => {
      const existingTimer = resetTimers.get(button);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }
      button.dataset.state = "pending";
      button.disabled = true;

      let result = "已复制";
      try {
        await Promise.race([
          navigator.clipboard.writeText(code.textContent || ""),
          new Promise((_, reject) => window.setTimeout(() => reject(new Error("clipboard-timeout")), 800)),
        ]);
      } catch {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection?.removeAllRanges();
        selection?.addRange(range);
        result = document.execCommand("copy") ? "已复制" : "已选中";
        selection?.removeAllRanges();
      }

      button.dataset.state = "success";
      button.disabled = false;
      label.textContent = result;
      button.setAttribute("aria-label", result);
      const timer = window.setTimeout(() => {
        button.dataset.state = "";
        label.textContent = originalText;
        button.setAttribute("aria-label", originalAriaLabel);
        resetTimers.delete(button);
      }, 1600);
      resetTimers.set(button, timer);
    });
  });
}

function initArticleToc() {
  const mobile = window.matchMedia("(max-width: 760px)");
  document.querySelectorAll("[data-toc]").forEach((toc) => {
    const toggle = toc.querySelector(".toc-toggle");
    const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
    if (!toggle || !links.length) {
      return;
    }

    const setOpen = (open) => {
      toc.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    const syncViewport = () => setOpen(!mobile.matches);
    syncViewport();
    mobile.addEventListener("change", syncViewport);
    toggle.addEventListener("click", () => setOpen(!toc.classList.contains("is-open")));
    links.forEach((link) => {
      link.addEventListener("click", () => {
        if (mobile.matches) {
          setOpen(false);
        }
      });
    });

    const targets = links
      .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
      .filter(Boolean);
    if (!targets.length || !("IntersectionObserver" in window)) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) {
          return;
        }
        links.forEach((link) => {
          const active = link.hash === `#${visible.target.id}`;
          if (active) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      { rootMargin: "-18% 0px -68%", threshold: [0, 1] },
    );
    targets.forEach((target) => observer.observe(target));
  });
}

function initSetupTabs() {
  const systemTabs = Array.from(document.querySelectorAll("[data-system]"));
  const systemPanels = Array.from(document.querySelectorAll("[data-system-panel]"));
  const systemNotes = Array.from(document.querySelectorAll("[data-system-note]"));
  const systemOptions = Array.from(document.querySelectorAll("[data-system-option]"));
  const architectureTabs = Array.from(document.querySelectorAll("[data-architecture]"));
  const architectureChoice = document.querySelector("[data-architecture-choice]");
  const codexAppPackage = document.querySelector("[data-codex-app-package]");
  const codexPlusPackage = document.querySelector("[data-codex-plus-package]");
  if (!systemTabs.length) {
    return;
  }

  const packageNames = {
    arm64: { codexApp: "Codex-mac-arm64.dmg", codexPlus: "xxx-macos-arm64.dmg" },
    x64: { codexApp: "Codex-mac-x64.dmg", codexPlus: "xxx-macos-x64.dmg" },
  };

  systemTabs[0].parentElement?.parentElement?.setAttribute("role", "tablist");
  systemPanels.forEach((panel, index) => {
    panel.id ||= `system-panel-${index + 1}`;
    panel.setAttribute("role", "tabpanel");
  });
  systemTabs.forEach((tab) => {
    tab.setAttribute("role", "tab");
    const ids = systemPanels
      .filter((panel) => panel.dataset.systemPanel === tab.dataset.system || panel.dataset.systemPanel === `codex-plus-${tab.dataset.system}`)
      .map((panel) => panel.id);
    tab.setAttribute("aria-controls", ids.join(" "));
  });

  const setSystem = (selectedSystem, focus = false) => {
    systemTabs.forEach((tab) => {
      const selected = tab.dataset.system === selectedSystem;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-pressed", String(selected));
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) {
        tab.focus();
      }
    });
    systemOptions.forEach((item) => item.classList.toggle("is-expanded", item.dataset.systemOption === selectedSystem));
    systemPanels.forEach((panel) => {
      const selected = panel.dataset.systemPanel === selectedSystem || panel.dataset.systemPanel === `codex-plus-${selectedSystem}`;
      panel.classList.toggle("is-active", selected);
      panel.hidden = !selected;
    });
    systemNotes.forEach((note) => { note.hidden = note.dataset.systemNote !== selectedSystem; });
    if (architectureChoice) {
      architectureChoice.hidden = selectedSystem !== "macos";
    }
  };

  const setArchitecture = (selectedArchitecture) => {
    architectureTabs.forEach((tab) => {
      const selected = tab.dataset.architecture === selectedArchitecture;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-pressed", String(selected));
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    const names = packageNames[selectedArchitecture];
    if (names && codexAppPackage && codexPlusPackage) {
      codexAppPackage.textContent = names.codexApp;
      codexPlusPackage.textContent = names.codexPlus;
    }
  };

  systemTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setSystem(tab.dataset.system));
    tab.addEventListener("keydown", (event) => {
      const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
      if (!keys.includes(event.key)) {
        return;
      }
      event.preventDefault();
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? systemTabs.length - 1
          : (index + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + systemTabs.length) % systemTabs.length;
      setSystem(systemTabs[nextIndex].dataset.system, true);
    });
  });

  architectureChoice?.setAttribute("role", "tablist");
  architectureTabs.forEach((tab) => {
    tab.setAttribute("role", "tab");
    tab.addEventListener("click", () => setArchitecture(tab.dataset.architecture));
  });
}

function initGxy() {
  const trigger = document.querySelector(".home-gxy-lockup");
  const title = document.querySelector(".typewriter-title");
  const announcer = document.querySelector("[data-gxy-announcer]");
  if (!trigger || !title) {
    return;
  }
  const lines = [
    "市场算什么？老子就是行情本身！",
    "我亏的时候叫回撤，我赚的时候叫收割，懂？",
    "市场教我做人？我教市场做梦！",
    "波动？那是我在给散户上强度。",
    "我从不抄底，我只是让底部等我降临。",
    "别人恐惧我贪婪，别人贪婪我已经把他们洗干净了。",
    "我不是在交易，我是在君临天下。",
    "这次不一样。",
  ];
  let activeLine = "";
  let index = 0;
  let typingTimer;
  let nextLineTimer;
  let revealed = false;

  const clearTimers = () => {
    window.clearTimeout(typingTimer);
    window.clearTimeout(nextLineTimer);
  };
  const pickLine = () => {
    let next = lines[Math.floor(Math.random() * lines.length)];
    while (lines.length > 1 && next === activeLine) {
      next = lines[Math.floor(Math.random() * lines.length)];
    }
    return next;
  };
  const showLine = () => {
    clearTimers();
    activeLine = pickLine();
    index = 0;
    if (reducedMotion.matches) {
      title.textContent = activeLine;
      if (announcer) announcer.textContent = activeLine;
      return;
    }
    const type = () => {
      title.textContent = activeLine.slice(0, index);
      index += 1;
      if (index <= activeLine.length) {
        typingTimer = window.setTimeout(type, 72);
      } else {
        if (announcer) announcer.textContent = activeLine;
        nextLineTimer = window.setTimeout(showLine, 5000);
      }
    };
    type();
  };
  const hide = () => {
    clearTimers();
    revealed = false;
    activeLine = "";
    title.textContent = "";
    if (announcer) announcer.textContent = "";
    trigger.classList.add("is-gxy-hidden");
    trigger.setAttribute("aria-pressed", "false");
  };

  trigger.addEventListener("click", () => {
    if (revealed) {
      hide();
      return;
    }
    revealed = true;
    trigger.classList.remove("is-gxy-hidden");
    trigger.setAttribute("aria-pressed", "true");
    showLine();
  });
}
