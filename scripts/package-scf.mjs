import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(os.homedir(), "Desktop");

const functions = [
  {
    name: "jhss-kb-file-processor",
    entry: "scf/processor-entry.js",
    // unzipper's optional S3 adapter is not used by Open.buffer().
    external: ["@aws-sdk/client-s3"],
  },
  {
    name: "jhss-kb-index-builder",
    entry: "scf/indexer-entry.js",
    external: [],
  },
];

await mkdir(outputDir, { recursive: true });

for (const definition of functions) {
  const staging = await mkdtemp(path.join(os.tmpdir(), `${definition.name}-`));
  const entryFile = path.join(staging, "index.js");
  const archive = path.join(outputDir, `${definition.name}.zip`);

  try {
    await build({
      absWorkingDir: root,
      entryPoints: [definition.entry],
      outfile: entryFile,
      bundle: true,
      platform: "node",
      format: "cjs",
      target: "node22",
      minify: true,
      legalComments: "none",
      external: definition.external,
    });
    await rm(archive, { force: true });
    await execFileAsync("zip", ["-q", "-j", archive, entryFile]);
    console.log(`${definition.name}: ${archive}`);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
