import { access, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const site = path.join(root, "src", "site");
const pages = path.join(site, "pages");
const { renderSitePage } = await import("../src/site/templates/layout.mjs");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await renderPages(pages, output);
await cp(path.join(site, "static", "_headers"), path.join(output, "_headers"));
await cp(path.join(root, "src", "shared", "styles", "tokens.css"), path.join(output, "theme.css"));
await cp(path.join(site, "client", "theme-controller.js"), path.join(output, "theme-controller.js"));
await cp(path.join(site, "client", "site.js"), path.join(output, "site.js"));
await cp(path.join(root, "public", "assets"), path.join(output, "assets"), { recursive: true });
await build({
  entryPoints: [path.join(site, "styles", "site.css")],
  outfile: path.join(output, "styles.css"),
  bundle: true,
  legalComments: "none",
});

await import("./build-drive.mjs");

const redirects = path.join(root, "_redirects");
try {
  await access(redirects);
  await cp(redirects, path.join(output, "_redirects"));
} catch {
  // The site does not currently define static redirect rules.
}

async function renderPages(sourceDirectory, outputDirectory, relativeDirectory = "") {
  await mkdir(outputDirectory, { recursive: true });
  const entries = await readdir(sourceDirectory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const outputPath = path.join(outputDirectory, entry.name);
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      await renderPages(sourcePath, outputPath, relativePath);
      return;
    }
    const source = await readFile(sourcePath, "utf8");
    await writeFile(outputPath, renderSitePage(source, relativePath));
  }));
}
