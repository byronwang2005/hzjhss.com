import { access, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");

await import("./build-drive.mjs");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of ["index.html", "404.html", "_headers", "theme.css", "styles.css", "site.js"]) {
  await cp(path.join(root, file), path.join(output, file));
}

for (const directory of ["assets", "docs"]) {
  await cp(path.join(root, directory), path.join(output, directory), { recursive: true });
}

const redirects = path.join(root, "_redirects");
try {
  await access(redirects);
  await cp(redirects, path.join(output, "_redirects"));
} catch {
  // The site does not currently define static redirect rules.
}
