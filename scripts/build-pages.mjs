import { access, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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
await copyEcosystemIcons(output);
await build({
  entryPoints: {
    styles: path.join(site, "styles", "site.css"),
    support: path.join(site, "styles", "support.css"),
  },
  outdir: output,
  bundle: true,
  entryNames: "[name]",
  legalComments: "none",
});
await build({
  entryPoints: {
    support: path.join(site, "client", "support.ts"),
  },
  outfile: path.join(output, "support.js"),
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
});

await import("./build-drive.mjs");
await versionEntrypoints(output, "index.html", [
  { outputPath: "assets/drive.css", publicPath: "./assets/drive.css" },
  { outputPath: "assets/drive.js", publicPath: "./assets/drive.js" },
]);
await versionEntrypoints(output, "support/index.html", [
  { outputPath: "support.css", publicPath: "/support.css" },
  { outputPath: "support.js", publicPath: "/support.js" },
]);

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

async function copyEcosystemIcons(outputDirectory) {
  const sourceDirectory = path.join(root, "node_modules", "@lobehub", "icons-static-svg", "icons");
  const outputDirectoryPath = path.join(outputDirectory, "assets", "ecosystem");
  const iconNames = ["cloudflare", "codex", "deepseek", "github", "tencentcloud"];

  await mkdir(outputDirectoryPath, { recursive: true });
  await Promise.all(iconNames.map((iconName) => (
    cp(
      path.join(sourceDirectory, `${iconName}.svg`),
      path.join(outputDirectoryPath, `${iconName}.svg`),
    )
  )));
}

async function versionEntrypoints(outputDirectory, htmlPath, assets) {
  const indexPath = path.join(outputDirectory, htmlPath);
  let markup = await readFile(indexPath, "utf8");
  for (const asset of assets) {
    const contents = await readFile(path.join(outputDirectory, asset.outputPath));
    const version = createHash("sha256").update(contents).digest("hex").slice(0, 12);
    const escapedPublicPath = asset.publicPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const versionedAssetPattern = new RegExp(`${escapedPublicPath}(?:\\?v=[^"']*)?`);
    markup = markup.replace(versionedAssetPattern, `${asset.publicPath}?v=${version}`);
  }
  await writeFile(indexPath, markup);
}
