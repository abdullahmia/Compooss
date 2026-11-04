/**
 * Copies Monaco's AMD build into public/monaco/vs so the editors load it from
 * Compooss itself instead of the jsdelivr CDN — needed offline and in the
 * desktop app. Skips the copy when the installed version is already there.
 */
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const appDir = path.join(import.meta.dirname, "..");
const require = createRequire(path.join(appDir, "package.json"));
const pkgPath = require.resolve("monaco-editor/package.json");
const { version } = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };

const outDir = path.join(appDir, "public", "monaco");
const stampPath = path.join(outDir, ".version");

if (existsSync(stampPath) && readFileSync(stampPath, "utf8") === version) {
  process.exit(0);
}

rmSync(outDir, { recursive: true, force: true });
cpSync(path.join(path.dirname(pkgPath), "min", "vs"), path.join(outDir, "vs"), {
  recursive: true,
});
writeFileSync(stampPath, version);
console.log(`Copied monaco-editor ${version} to public/monaco/vs`);
