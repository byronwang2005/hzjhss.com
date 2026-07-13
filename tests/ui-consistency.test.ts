import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";

const htmlFiles = ["index.html", ...globSync("articles/*.html")];
const publicMarkup = htmlFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const driveSource = ["src/drive/client/index.ts", "src/drive/client/pdf-preview.ts"]
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
      const isCarouselDot = /data-action="featured-go"/.test(button);
      if (!isTextLink && !isCarouselDot) {
        expect(button).toMatch(/render(?:Drive)?Icon/);
      }
    }
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
