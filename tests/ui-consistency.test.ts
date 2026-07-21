import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";

const htmlFiles = ["404.html", "docs/index.html", ...globSync("docs/articles/*.html")];
const publicMarkup = htmlFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const driveSource = ["src/drive/client/index.ts", "src/drive/client/pdf-preview.ts", "src/drive/client/qa-chat.ts"]
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
const cssSource = ["theme.css", "styles.css", "src/drive/client/drive.css"]
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

describe("shared UI system", () => {
  it("uses the generated Phosphor sprite without hand-drawn paths", () => {
    expect(publicMarkup).not.toMatch(/<path\b/i);
    expect(driveSource).not.toMatch(/<path\b/i);
    const sprite = readFileSync("assets/phosphor-sprite.svg", "utf8");
    expect(sprite).toContain('id="ph-regular-copy"');
    expect(sprite).toContain('id="ph-bold-check"');
    expect(sprite).toContain('id="ph-duotone-files"');
  });

  it("includes every SVG symbol used by the AI Q&A component", () => {
    const sprite = readFileSync("assets/phosphor-sprite.svg", "utf8");
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

  it("includes every statically referenced drive icon at its requested weight", () => {
    const sprite = readFileSync("assets/phosphor-sprite.svg", "utf8");
    const iconCalls = driveSource.matchAll(/render(?:Drive)?Icon\("([^"]+)"(?:,\s*"(regular|bold|fill|duotone)")?/g);

    for (const [, rawName, requestedWeight] of iconCalls) {
      const name = rawName.replace(/^ph-/, "").replace(/-fill$/, "");
      const weight = rawName.endsWith("-fill") ? "fill" : requestedWeight || "regular";
      expect(sprite, `missing ph-${weight}-${name}`).toContain(`id="ph-${weight}-${name}"`);
    }
  });

  it("covers public page controls through the shared icon initializer", () => {
    const siteScript = readFileSync("site.js", "utf8");
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
    const driveCss = readFileSync("src/drive/client/drive.css", "utf8");
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
    const driveCss = readFileSync("src/drive/client/drive.css", "utf8");
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
    expect(cssSource).toContain("--jh-motion-exit: cubic-bezier(0.32, 0, 0.67, 0)");
  });
});
