import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.join(root, "assets");
const generatedAssetsDir = path.join(assetsDir, "drive-assets");
const pdfPackageDir = path.join(root, "node_modules", "pdfjs-dist");

await Promise.all([
  rm(path.join(assetsDir, "drive.js"), { force: true }),
  rm(path.join(assetsDir, "drive.css"), { force: true }),
  rm(generatedAssetsDir, { recursive: true, force: true }),
]);
await mkdir(generatedAssetsDir, { recursive: true });

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
const workerFilename = path.basename(workerOutput[0]);

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
