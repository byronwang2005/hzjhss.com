import { existsSync, readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  FILE_LIMITS,
  QA_LIMITS,
  SUPPORTED_FILE_EXTENSIONS,
  filePolicyForExtension,
} from "../src/drive/shared/policy";

describe("shared application policy", () => {
  it("provides one file policy to browser, server and SCF code", () => {
    expect(SUPPORTED_FILE_EXTENSIONS).toContain("pdf");
    expect(filePolicyForExtension("png")?.maxBytes).toBe(FILE_LIMITS.compactBytes);
    expect(filePolicyForExtension("pdf")?.maxBytes).toBe(FILE_LIMITS.documentBytes);
    expect(filePolicyForExtension("csv")).toBeNull();

    const client = readFileSync("src/drive/client/upload-policy.ts", "utf8");
    const server = readFileSync("src/drive/server/knowledge.ts", "utf8");
    const processor = readFileSync("src/scf/file-processor/index.mjs", "utf8");
    for (const source of [client, server, processor]) {
      expect(source).toContain("shared/policy");
    }
  });

  it("provides one question policy to client and server", () => {
    expect(QA_LIMITS.questionCharacters).toBe(3_000);
    expect(QA_LIMITS.historyRounds).toBe(6);
    expect(readFileSync("src/drive/client/qa-chat.ts", "utf8")).toContain("QA_LIMITS");
    expect(readFileSync("src/drive/server/qa.ts", "utf8")).toContain("QA_LIMITS");
  });
});

describe("source tree boundaries", () => {
  it("keeps deployable public assets visible to Git", () => {
    for (const sourcePath of [
      "public/assets/jhss-logo-cropped.png",
      "src/scf/file-processor/index.mjs",
    ]) {
      expect(existsSync(sourcePath)).toBe(true);
      const ignored = spawnSync("git", ["check-ignore", sourcePath], { encoding: "utf8" });
      expect(ignored.status, `${sourcePath}: ${ignored.stdout || ignored.stderr}`).toBe(1);
    }
  });

  it("keeps generated browser assets outside the repository source tree", () => {
    expect(existsSync("assets")).toBe(false);
    expect(readFileSync(".gitignore", "utf8")).toContain("dist/");
    expect(globSync("dist/assets/drive-assets/pdf.worker-*.mjs")).toHaveLength(1);
  });

  it("keeps component colors behind shared tokens", () => {
    const componentCss = [
      readFileSync("src/site/styles/base.css", "utf8"),
      readFileSync("src/site/styles/pages.css", "utf8"),
      readFileSync("src/drive/client/styles/base.css", "utf8"),
      readFileSync("src/drive/client/styles/workspace.css", "utf8"),
    ].join("\n");
    expect(componentCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });

  it("keeps the Drive API root in one module", () => {
    const sourceFiles = globSync("src/**/*.{ts,mjs,js}")
      .filter((file) => file !== "src/drive/shared/runtime.ts");
    for (const file of sourceFiles) {
      expect(readFileSync(file, "utf8"), file).not.toContain('"/api/drive');
    }
  });

  it("renders shared site layout placeholders during the build", () => {
    const source = readFileSync("src/site/pages/docs/articles/codex-pet.html", "utf8");
    const built = readFileSync("dist/docs/articles/codex-pet.html", "utf8");
    expect(source).toContain("{{site-header}}");
    expect(built).not.toContain("{{site-header}}");
    expect(built).toContain('<header class="site-header blog-header"');
  });

  it("does not use hand-maintained asset version query strings", () => {
    for (const file of globSync("src/site/pages/**/*.html")) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/[?&]v=[^"'&]+/);
    }
  });
});
