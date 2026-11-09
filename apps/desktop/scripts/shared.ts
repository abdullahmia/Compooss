/** Settings and helpers shared by the desktop build scripts. */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/**
 * Node.js runtime bundled with the app. Node 24 needs macOS 13.5+, which must
 * match bundle.macOS.minimumSystemVersion in src-tauri/tauri.conf.json.
 */
export const NODE_VERSION = "24.22.2";

export const DESKTOP_DIR = path.join(import.meta.dirname, "..");
export const REPO_ROOT = path.join(DESKTOP_DIR, "..", "..");
export const TAURI_DIR = path.join(DESKTOP_DIR, "src-tauri");
/** Assembled server tree, bundled as the app's `server/` resource. */
export const SERVER_DIST_DIR = path.join(DESKTOP_DIR, ".dist", "server");
export const BINARIES_DIR = path.join(TAURI_DIR, "binaries");
export const CACHE_DIR =
  process.env.COMPOOSS_DESKTOP_CACHE ?? path.join(homedir(), ".cache", "compooss-desktop");

type Target = {
  /** Name of the official Node.js build, e.g. "darwin-arm64". */
  nodeDist: string;
  archive: "tar.gz" | "zip";
  exe: "" | ".exe";
};

/** Rust target triples the desktop app is built for. */
export const TARGETS: Record<string, Target> = {
  "aarch64-apple-darwin": { nodeDist: "darwin-arm64", archive: "tar.gz", exe: "" },
  "x86_64-apple-darwin": { nodeDist: "darwin-x64", archive: "tar.gz", exe: "" },
  "x86_64-pc-windows-msvc": { nodeDist: "win-x64", archive: "zip", exe: ".exe" },
  "x86_64-unknown-linux-gnu": { nodeDist: "linux-x64", archive: "tar.gz", exe: "" },
};

export function hostTriple(): string {
  const triples: Record<string, string> = {
    "darwin-arm64": "aarch64-apple-darwin",
    "darwin-x64": "x86_64-apple-darwin",
    "win32-x64": "x86_64-pc-windows-msvc",
    "linux-x64": "x86_64-unknown-linux-gnu",
  };
  const triple = triples[`${process.platform}-${process.arch}`];
  if (!triple) throw new Error(`Unsupported build host: ${process.platform}-${process.arch}`);
  return triple;
}

export function resolveTarget(triple: string): Target {
  const target = TARGETS[triple];
  if (!target) {
    throw new Error(`Unknown target "${triple}". Use one of: ${Object.keys(TARGETS).join(", ")}`);
  }
  return target;
}

/** Path of the bundled Node.js binary for a target, as Tauri's externalBin expects. */
export function nodeBinaryPath(triple: string): string {
  return path.join(BINARIES_DIR, `compooss-node-${triple}${resolveTarget(triple).exe}`);
}

const PACKAGE_JSON = path.join(DESKTOP_DIR, "package.json");

/**
 * The desktop app's version, from apps/desktop/package.json (tauri.conf.json
 * reads it too). It's the same as the web app's and the Docker image's:
 * release-please bumps it along with the root package.json.
 */
export function appVersion(): string {
  return JSON.parse(readFileSync(PACKAGE_JSON, "utf8")).version;
}

/** Value of `--name <value>` in argv, if given. */
export function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

export function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

/** Runs a command, streaming its output, and throws if it fails. */
export function run(cmd: string[], opts: { cwd?: string; env?: Record<string, string> } = {}) {
  console.log(`$ ${cmd.join(" ")}`);
  const result = Bun.spawnSync(cmd, {
    cwd: opts.cwd ?? REPO_ROOT,
    env: { ...process.env, ...opts.env },
    stdio: ["inherit", "inherit", "inherit"],
  });
  if (result.exitCode !== 0) {
    throw new Error(`Command failed (exit ${result.exitCode}): ${cmd.join(" ")}`);
  }
}

/** Runs a command and returns its trimmed stdout. */
export function output(cmd: string[], cwd = REPO_ROOT): string {
  const result = Bun.spawnSync(cmd, { cwd, stderr: "inherit" });
  if (result.exitCode !== 0) throw new Error(`Command failed: ${cmd.join(" ")}`);
  return result.stdout.toString().trim();
}
