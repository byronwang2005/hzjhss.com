import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.join(root, "dist", "assets");
const generatedAssetsDir = path.join(assetsDir, "drive-assets");
const pdfPackageDir = path.join(root, "node_modules", "pdfjs-dist");
const phosphorPackageDir = path.join(root, "node_modules", "@phosphor-icons", "core", "assets");

const iconSets = {
  regular: [
    "apple-logo", "arrow-clockwise", "arrow-left", "arrow-right", "arrow-square-out",
    "arrows-out-line-horizontal", "article", "book-open", "broadcast", "caret-down",
    "caret-left", "caret-right", "chat-circle-dots", "check", "check-circle", "circle-notch", "clipboard-text",
    "copy", "cpu", "database", "download-simple", "eye", "eye-slash", "file", "file-arrow-up",
    "file-doc", "file-html", "file-image", "file-pdf", "file-ppt", "file-text", "file-xls",
    "files", "floppy-disk", "folder", "folder-open", "folder-plus", "folder-simple-plus",
    "house", "info", "link", "list", "minus", "package", "plus", "sign-out",
    "paper-plane-tilt", "sliders-horizontal", "star", "stop-circle", "terminal-window", "trash", "tray", "upload-simple",
    "moon", "sun", "user-switch", "warning", "windows-logo", "x", "x-circle",
  ],
  bold: [
    "arrow-right", "broadcast", "check", "clipboard-text", "copy", "database", "download-simple",
    "file-arrow-up", "floppy-disk", "folder-plus", "folder-simple-plus", "link", "paper-plane-tilt", "plus",
    "trash", "upload-simple", "user-switch",
  ],
  fill: ["check-circle", "star"],
  duotone: ["books", "calendar-dots", "database", "eye-slash", "files", "folder-plus", "package", "tray"],
};

async function buildIconSprite() {
  await mkdir(assetsDir, { recursive: true });
  const symbols = [];
  for (const [weight, icons] of Object.entries(iconSets)) {
    for (const icon of icons) {
      const suffix = weight === "regular" ? "" : `-${weight}`;
      const source = await readFile(path.join(phosphorPackageDir, weight, `${icon}${suffix}.svg`), "utf8");
      const viewBox = source.match(/viewBox="([^"]+)"/)?.[1] || "0 0 256 256";
      const body = source.replace(/^.*?<svg[^>]*>/s, "").replace(/<\/svg>\s*$/s, "");
      symbols.push(`<symbol id="ph-${weight}-${icon}" viewBox="${viewBox}">${body}</symbol>`);
    }
  }
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>\n`;
  await writeFile(path.join(assetsDir, "phosphor-sprite.svg"), sprite);
}

await Promise.all([
  rm(path.join(assetsDir, "drive.js"), { force: true }),
  rm(path.join(assetsDir, "drive.css"), { force: true }),
  rm(generatedAssetsDir, { recursive: true, force: true }),
]);
await mkdir(generatedAssetsDir, { recursive: true });
await buildIconSprite();

const workerResult = await build({
  absWorkingDir: root,
  entryPoints: {
    "pdf.worker": path.join(pdfPackageDir, "legacy", "build", "pdf.worker.mjs"),
  },
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
  outdir: assetsDir,
  entryNames: "drive-assets/[name]-[hash]",
  outExtension: { ".js": ".mjs" },
  metafile: true,
});

const workerOutput = Object.entries(workerResult.metafile.outputs).find(([, output]) => output.entryPoint?.endsWith("pdf.worker.mjs"));
if (!workerOutput) {
  throw new Error("PDF worker output was not generated.");
}
const workerFilename = path.posix.join("drive-assets", path.basename(workerOutput[0]));

await build({
  absWorkingDir: root,
  entryPoints: { drive: "src/drive/client/index.ts" },
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
  splitting: true,
  outdir: assetsDir,
  entryNames: "[name]",
  chunkNames: "drive-assets/[name]-[hash]",
  assetNames: "drive-assets/[name]-[hash]",
  loader: {
    ".woff2": "file",
    ".woff": "file",
    ".ttf": "file",
    ".svg": "file",
    ".gif": "file",
  },
  define: {
    __PDF_WORKER_FILENAME__: JSON.stringify(workerFilename),
  },
});

const pdfAssetRoot = path.join(generatedAssetsDir, "pdfjs-6.1.200");
await mkdir(pdfAssetRoot, { recursive: true });
for (const directory of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
  await cp(path.join(pdfPackageDir, directory), path.join(pdfAssetRoot, directory), { recursive: true });
}
await cp(path.join(pdfPackageDir, "LICENSE"), path.join(pdfAssetRoot, "LICENSE"));
