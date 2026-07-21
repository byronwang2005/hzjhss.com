import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(os.homedir(), "Desktop");
const lock = JSON.parse(await readFile(path.join(root, "scf", "package-lock.json"), "utf8"));

const functions = [
  {
    name: "jhss-kb-file-processor",
    sourceDirectory: "file-processor",
    dependencies: [
      "cos-nodejs-sdk-v5",
      "fast-xml-parser",
      "p-limit",
      "p-retry",
      "pdf-lib",
      "tencentcloud-sdk-nodejs",
      "unzipper",
    ],
  },
  {
    name: "jhss-kb-index-builder",
    sourceDirectory: "index-builder",
    dependencies: ["cos-nodejs-sdk-v5", "minisearch", "p-retry"],
  },
];

await mkdir(outputDir, { recursive: true });

for (const definition of functions) {
  const staging = await mkdtemp(path.join(os.tmpdir(), `${definition.name}-`));
  const archive = path.join(outputDir, `${definition.name}.zip`);

  try {
    const dependencies = Object.fromEntries(definition.dependencies.map((name) => {
      const version = lock.packages?.[`node_modules/${name}`]?.version;
      if (!version) throw new Error(`package-lock.json 中缺少依赖: ${name}`);
      return [name, version];
    }));
    const manifest = {
      name: definition.name,
      version: "1.0.0",
      private: true,
      type: "commonjs",
      engines: { node: ">=22.13.0" },
      dependencies,
    };
    const wrapper = `let modulePromise;\nexports.handler = async (event, context) => {\n  const module = await (modulePromise ||= import("./${definition.sourceDirectory}/index.mjs"));\n  return module.handler(event, context);\n};\n`;

    await Promise.all([
      writeFile(path.join(staging, "index.js"), wrapper),
      writeFile(path.join(staging, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`),
      cp(path.join(root, "scf", definition.sourceDirectory), path.join(staging, definition.sourceDirectory), { recursive: true }),
      cp(path.join(root, "scf", "lib"), path.join(staging, "lib"), { recursive: true }),
    ]);
    await execFileAsync("npm", ["install", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: staging });
    await rm(archive, { force: true });
    await execFileAsync("zip", ["-q", "-r", archive, "index.js", "package.json", "package-lock.json", definition.sourceDirectory, "lib", "node_modules"], { cwd: staging });
    console.log(`${definition.name}: ${archive}`);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
