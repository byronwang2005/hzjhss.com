import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";

const htmlFiles = ["dist/404.html", "dist/docs/index.html", ...globSync("dist/docs/articles/*.html")];
const publicMarkup = htmlFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const allPublicHtml = ["dist/index.html", ...htmlFiles].map((file) => readFileSync(file, "utf8"));
const driveSource = ["src/drive/client/index.ts", "src/drive/client/pdf-preview.ts", "src/drive/client/qa-chat.ts", "src/drive/client/upload-policy.ts"]
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
const cssSource = [
  "src/shared/styles/tokens.css",
  "src/site/styles/base.css",
  "src/site/styles/pages.css",
  "src/drive/client/styles/base.css",
  "src/drive/client/styles/workspace.css",
]
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

describe("shared UI system", () => {
  it("loads the generated PDF worker from the hashed drive-assets directory", () => {
    const workerPath = globSync("dist/assets/drive-assets/pdf.worker-*.mjs")[0];
    expect(workerPath).toBeTruthy();
    const driveBundle = readFileSync("dist/assets/drive.js", "utf8");
    expect(driveBundle).toContain(workerPath.replace(/^dist\/assets\//, ""));
  });

  it("loads the shared icon sprite from its deployed assets path", () => {
    const iconSource = readFileSync("src/drive/client/icons.ts", "utf8");
    expect(iconSource).toContain('"/assets/phosphor-sprite.svg');
    expect(iconSource).not.toContain('"../phosphor-sprite.svg"');
  });

  it("publishes only the explicit static-site allowlist", () => {
    const buildScript = readFileSync("scripts/build-pages.mjs", "utf8");
    expect(buildScript).toContain('"public", "assets"');
    expect(buildScript).not.toMatch(/cp\([^\n]*(?:functions|scf|package\.json|node_modules)/);
    expect(readFileSync("package.json", "utf8")).toContain("wrangler pages dev dist");
  });

  it("uses the generated Phosphor sprite without hand-drawn paths", () => {
    expect(publicMarkup).not.toMatch(/<path\b/i);
    expect(driveSource).not.toMatch(/<path\b/i);
    const sprite = readFileSync("dist/assets/phosphor-sprite.svg", "utf8");
    expect(sprite).toContain('id="ph-regular-copy"');
    expect(sprite).toContain('id="ph-bold-check"');
    expect(sprite).toContain('id="ph-duotone-files"');
  });

  it("includes every SVG symbol used by the AI Q&A component", () => {
    const sprite = readFileSync("dist/assets/phosphor-sprite.svg", "utf8");
    for (const symbol of [
      "ph-regular-arrow-clockwise",
      "ph-regular-chat-circle-dots",
      "ph-regular-database",
      "ph-regular-files",
      "ph-regular-link",
      "ph-regular-stop-circle",
      "ph-regular-trash",
      "ph-regular-warning",
      "ph-bold-paper-plane-tilt",
    ]) {
      expect(sprite).toContain(`id="${symbol}"`);
    }
  });

  it("hides role upload inputs and defines compact ready-state Q&A rows", () => {
    expect(cssSource).toContain('.drive-file-role-panel > input[type="file"][hidden]');
    expect(cssSource).toContain("display: none !important;");
    expect(cssSource).toContain("grid-template-rows: auto minmax(280px, 1fr) auto;");
    expect(cssSource).toContain(".drive-ai-qa.has-notice");
  });

  it("includes every statically referenced drive icon at its requested weight", () => {
    const sprite = readFileSync("dist/assets/phosphor-sprite.svg", "utf8");
    const iconCalls = driveSource.matchAll(/render(?:Drive)?Icon\("([^"]+)"(?:,\s*"(regular|bold|fill|duotone)")?/g);

    for (const [, rawName, requestedWeight] of iconCalls) {
      const name = rawName.replace(/^ph-/, "").replace(/-fill$/, "");
      const weight = rawName.endsWith("-fill") ? "fill" : requestedWeight || "regular";
      expect(sprite, `missing ph-${weight}-${name}`).toContain(`id="ph-${weight}-${name}"`);
    }
  });

  it("loads the theme controller before styles on every public page", () => {
    for (const markup of allPublicHtml) {
      const controllerIndex = markup.indexOf('src="/theme-controller.js"');
      const stylesheetIndex = markup.indexOf('rel="stylesheet"');
      expect(controllerIndex).toBeGreaterThan(-1);
      expect(controllerIndex).toBeLessThan(stylesheetIndex);
    }
  });

  it("publishes matching light and dark semantic color tokens", () => {
    const themeCss = readFileSync("src/shared/styles/tokens.css", "utf8");
    const lightBlock = themeCss.match(/^:root \\{([\\s\\S]*?)^\\}/m)?.[1] || "";
    const darkBlock = themeCss.match(/^:root\\[data-theme="dark"\\] \\{([\\s\\S]*?)^\\}/m)?.[1] || "";
    const colorTokens = (block: string) => [...block.matchAll(/(--jh-color-[\\w-]+)\\s*:/g)].map((match) => match[1]).sort();
    expect(colorTokens(darkBlock)).toEqual(colorTokens(lightBlock));
  });

  it("does not reintroduce legacy or drive-specific color palettes", () => {
    const legacyTokens = [
      "parchment", "ivory", "warm-sand", "brand", "brand-light", "brand-tint",
      "near-black", "dark-warm", "olive", "stone", "border", "border-soft",
      "line", "dark-surface",
    ];
    for (const token of legacyTokens) {
      expect(cssSource).not.toContain(`--${token}:`);
      expect(cssSource).not.toContain(`var(--${token})`);
    }
    expect(cssSource).not.toMatch(/--drive-(?:accent|surface|ink|muted|line|success|danger|warning|shadow)\\b/);
  });

  it("keeps theme palette declarations in the shared theme only", () => {
    const componentCss = [
      "src/site/styles/base.css",
      "src/site/styles/pages.css",
      "src/drive/client/styles/base.css",
      "src/drive/client/styles/workspace.css",
    ]
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(componentCss).not.toMatch(/--jh-color-[\\w-]+\\s*:/);
    expect(componentCss).not.toContain("color-scheme: dark");
  });

  it("includes the theme action icons in the generated sprite", () => {
    const sprite = readFileSync("dist/assets/phosphor-sprite.svg", "utf8");
    expect(sprite).toContain('id="ph-regular-sun"');
    expect(sprite).toContain('id="ph-regular-moon"');
  });

  it("covers public page controls through the shared icon initializer", () => {
    const siteScript = readFileSync("src/site/client/site.js", "utf8");
    for (const selector of [".top-nav a", ".back-link", ".footer a", ".article-list-item em", ".toc-toggle", ".copy-button", ".system-tab[data-system]", ".architecture-tab"]) {
      expect(siteScript).toContain(`querySelectorAll("${selector}")`);
    }
    const buttons = publicMarkup.match(/<button\b[\s\S]*?<\/button>/g) || [];
    for (const button of buttons) {
      expect(button).toMatch(/brand-lockup|toc-toggle|copy-button|system-tab|architecture-tab/);
    }
  });

  it("uses SVG icons on executable drive controls", () => {
    expect(driveSource).not.toMatch(/<i\b[^>]*class=[^>]*\bph\b/);
    const buttons = driveSource.match(/<button\b[\s\S]*?<\/button>/g) || [];
    for (const button of buttons) {
      const isTextLink = /drive-title-button|drive-breadcrumbs|data-action="open-folder"/.test(button);
      if (!isTextLink) {
        expect(button).toMatch(/render(?:Drive)?Icon/);
      }
    }
  });

  it("keeps optional file row actions aligned without changing mobile behavior", () => {
    const driveCss = readFileSync("src/drive/client/styles/workspace.css", "utf8");
    const baseRuleStart = driveCss.indexOf(".drive-row-actions {");
    const baseRuleEnd = driveCss.indexOf("}", baseRuleStart);
    const baseRule = driveCss.slice(baseRuleStart, baseRuleEnd);

    expect(baseRuleStart).toBeGreaterThan(-1);
    expect(baseRule).toContain("display: flex;");
    expect(baseRule).toContain("align-items: center;");
    expect(baseRule).toContain("justify-content: flex-end;");
    expect(baseRule).toContain("flex-wrap: wrap;");

    const mobileCss = driveCss.slice(driveCss.indexOf("@media (max-width: 760px)"));
    expect(mobileCss).toMatch(/\.drive-row-actions \{[\s\S]*?justify-content: flex-start;/);
  });

  it("keeps native file and folder inputs hidden behind the upload actions", () => {
    const driveCss = readFileSync("src/drive/client/styles/workspace.css", "utf8");
    const hiddenUploadInputs = driveCss.match(
      /\.drive-upload-actions > \[data-file-input\],\s*\.drive-upload-actions > \[data-folder-input\] \{([^}]*)\}/,
    );

    expect(hiddenUploadInputs).not.toBeNull();
    expect(hiddenUploadInputs?.[1]).toContain("display: none;");
    expect(driveCss).not.toContain(".drive-upload-trigger input");
  });

  it("locks interaction motion to shared nonlinear curves", () => {
    const declarations = cssSource.match(/(?:transition|animation)\s*:[^;]+;/g) || [];
    for (const declaration of declarations) {
      expect(declaration).not.toMatch(/\bease(?:-in|-out|-in-out)?\b|\blinear\b/);
      expect(declaration).not.toMatch(/transition\s*:\s*all\b/);
    }
    expect(cssSource).toContain("--jh-motion-control: cubic-bezier(0.2, 0, 0, 1)");
    expect(cssSource).toContain("--jh-motion-enter: cubic-bezier(0.32, 0.72, 0, 1)");
  });
});
