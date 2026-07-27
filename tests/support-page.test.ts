// @vitest-environment happy-dom

import { existsSync, readFileSync } from "node:fs";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import {
  SupportRenderGate,
  prefersReducedSupportMotion,
  shouldPinSupportEcosystem,
  supportParticleBudget,
} from "../src/site/client/support-motion";

const source = readFileSync("src/site/pages/support/index.html", "utf8");
const built = readFileSync("dist/support/index.html", "utf8");

describe("support publicity page", () => {
  it("builds the standalone route with versioned entrypoints", () => {
    expect(built).toContain("<title>嘉合杉升AI知识库｜把知识，变成答案。</title>");
    expect(built).toMatch(/\/support\.css\?v=[a-f0-9]{12}/);
    expect(built).toMatch(/\/support\.js\?v=[a-f0-9]{12}/);
    expect(built).not.toContain("{{site-header}}");
  });

  it("uses the approved headline and proof points without removed metrics", () => {
    expect(source).toContain("把知识，");
    expect(source).toContain("变成答案。");
    expect(source).toContain('data-count="160"');
    expect(source).toContain('data-count="3"');
    expect(source).toContain("生产环境已上线");
    expect(source).toContain("答案来源可追溯");
    expect(source).not.toContain("420 份研报");
    expect(source).not.toContain("42 页稳定统计");
  });

  it("keeps every in-page navigation target resolvable", () => {
    const browserWindow = new Window({ url: "https://hzjhss.test/support/" });
    browserWindow.document.write(built);
    const anchors = Array.from(
      browserWindow.document.querySelectorAll('a[href^="#"]'),
    ) as unknown as HTMLAnchorElement[];

    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      const target = anchor.getAttribute("href");
      expect(target, anchor.textContent || "").toBeTruthy();
      expect(browserWindow.document.querySelector(target || "")).not.toBeNull();
    }
  });

  it("contains the requested technology ecosystem with a qualification", () => {
    for (const technology of ["OpenAI Codex", "DeepSeek", "腾讯云", "Cloudflare", "GitHub"]) {
      expect(source).toContain(technology);
    }
    expect(source).toContain("在Codex继续");
    expect(source).not.toContain("DeepSeek / OpenAI-compatible");
    expect(source).toContain("不构成商业合作或官方背书声明");
    for (const icon of ["codex", "deepseek", "tencentcloud", "cloudflare", "github"]) {
      expect(existsSync(`dist/assets/ecosystem/${icon}.svg`)).toBe(true);
    }
  });

  it("places the technology ecosystem immediately after the hero and uses direct language", () => {
    const browserWindow = new Window({ url: "https://hzjhss.test/support/" });
    browserWindow.document.write(source);
    const sections = Array.from(browserWindow.document.querySelectorAll("main > section"));

    expect(sections[0]?.classList.contains("support-hero")).toBe(true);
    expect(sections[1]?.classList.contains("support-ecosystem")).toBe(true);
    expect(source).not.toMatch(/不是[^。]*而是/);
    expect(source).not.toContain("不是概念演示");
    expect(source).not.toContain("上下文不是固定截断");
    expect(source).toContain("已经上线");
    expect(source).toContain("三类资料");
  });
});

describe("support motion policy", () => {
  it("honors the reduced-motion preference", () => {
    const reduced = prefersReducedSupportMotion({
      innerWidth: 1440,
      devicePixelRatio: 2,
      matchMedia: () => ({ matches: true }),
    });

    expect(reduced).toBe(true);
    expect(supportParticleBudget(1440, 2, reduced)).toEqual({ count: 72, dpr: 1 });
  });

  it("caps rendering density and scales the particle budget by viewport", () => {
    expect(supportParticleBudget(390, 3, false)).toEqual({ count: 130, dpr: 1.5 });
    expect(supportParticleBudget(768, 1, false)).toEqual({ count: 210, dpr: 1 });
    expect(supportParticleBudget(1440, 2, false)).toEqual({ count: 340, dpr: 1.5 });
  });

  it("pins the ecosystem stage only on motion-capable desktop layouts", () => {
    expect(shouldPinSupportEcosystem(1440, false)).toBe(true);
    expect(shouldPinSupportEcosystem(820, false)).toBe(false);
    expect(shouldPinSupportEcosystem(1440, true)).toBe(false);
  });

  it("pauses rendering when the page or canvas is not visible", () => {
    const gate = new SupportRenderGate();
    expect(gate.active).toBe(true);

    gate.setDocumentVisible(false);
    expect(gate.active).toBe(false);

    gate.setDocumentVisible(true);
    gate.setCanvasVisible(false);
    expect(gate.active).toBe(false);

    gate.setCanvasVisible(true);
    gate.setReducedMotion(true);
    expect(gate.active).toBe(false);
  });
});
