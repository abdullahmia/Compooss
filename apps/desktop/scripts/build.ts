/**
 * Builds desktop installers.
 *
 *   bun scripts/build.ts                     this machine's platform
 *   bun scripts/build.ts --target <triple>   another platform (see TARGETS in shared.ts)
 *   bun scripts/build.ts --skip-server       reuse the server tree from the last build
 *   bun scripts/build.ts --debug             quick unoptimized build
 *
 * Update packages are signed with the key in UPDATER_KEY_FILE (shared.ts).
 * Without it, test builds leave them out and release builds fail.
 *
 * From a Mac, both macOS targets build natively, Windows cross-compiles with
 * cargo-xwin (NSIS installer only) and Linux builds in Docker
 * (docker/linux-builder.Dockerfile). See docs/DESKTOP.md for prerequisites.
 */
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import {
  DESKTOP_DIR,
  TAURI_DIR,
  UPDATER_KEY_FILE,
  appVersion,
  argValue,
  hasFlag,
  hostTriple,
  output,
  resolveTarget,
  run,
  updaterSigningEnv,
} from "./shared";

const LINUX_TRIPLE = "x86_64-unknown-linux-gnu";
const WINDOWS_TRIPLE = "x86_64-pc-windows-msvc";
const LINUX_BUILDER_IMAGE = "compooss-desktop-linux-builder";
/** Separate from target/, so Linux and macOS builds don't overwrite each other. */
const LINUX_TARGET_DIR = "target-linux";
/** Installers, the macOS update package and their update signatures. */
const BUNDLE_FILE = /\.(dmg|exe|deb|app\.tar\.gz)(\.sig)?$/;
/** The macOS update package has no version in its name; each build replaces it. */
const MACOS_UPDATE_FILE = /\.app\.tar\.gz(\.sig)?$/;

type BuildOptions = {
  skipServer?: boolean;
  debug?: boolean;
  /** Fail without the update signing key instead of leaving the update packages out. */
  requireUpdates?: boolean;
};

/** Builds one target and returns the paths of its installers and update packages. */
export function buildTarget(triple: string, opts: BuildOptions = {}): string[] {
  resolveTarget(triple);
  const signing = updaterSigningEnv();
  if (!signing && opts.requireUpdates) {
    throw new Error(
      `No update signing key at ${UPDATER_KEY_FILE} (or in TAURI_SIGNING_PRIVATE_KEY). ` +
        "Installed apps can only update to builds signed with it; see docs/DESKTOP.md.",
    );
  }
  if (!signing) {
    console.warn(`No update signing key at ${UPDATER_KEY_FILE}: building without update packages.`);
  }
  // tauri.bundle.conf.json turns them on, and the CLI fails without a key.
  const updaterArgs = signing
    ? []
    : ["--config", JSON.stringify({ bundle: { createUpdaterArtifacts: false } })];

  run(
    [
      process.execPath,
      "scripts/prepare-sidecar.ts",
      "--target",
      triple,
      ...(opts.skipServer ? ["--skip-server"] : []),
    ],
    { cwd: DESKTOP_DIR },
  );

  const profile = opts.debug ? "debug" : "release";
  if (triple === LINUX_TRIPLE && process.platform !== "linux") {
    buildLinuxInDocker(opts, updaterArgs, signing ?? {});
    return bundlesIn(path.join(TAURI_DIR, LINUX_TARGET_DIR, profile, "bundle"));
  }

  const crossToWindows = triple === WINDOWS_TRIPLE && process.platform !== "win32";
  const env = { ...(crossToWindows ? windowsCrossEnv() : rustEnv()), ...signing };
  if (triple !== hostTriple()) run(["rustup", "target", "add", triple], { env });

  const bundles = triple.includes("apple") ? "app,dmg" : triple === WINDOWS_TRIPLE ? "nsis" : "deb";
  run(
    [
      path.join(DESKTOP_DIR, "node_modules", ".bin", "tauri"),
      "build",
      "--config",
      "src-tauri/tauri.bundle.conf.json",
      ...updaterArgs,
      "--target",
      triple,
      "--bundles",
      bundles,
      ...(crossToWindows ? ["--runner", "cargo-xwin"] : []),
      ...(opts.debug ? ["--debug"] : []),
    ],
    { cwd: DESKTOP_DIR, env },
  );
  return bundlesIn(path.join(TAURI_DIR, "target", triple, profile, "bundle"));
}

/** rustup installs into ~/.cargo/bin, which may not be on PATH yet. */
function rustEnv(): Record<string, string> {
  const cargoBin = path.join(homedir(), ".cargo", "bin");
  return { PATH: `${cargoBin}${path.delimiter}${process.env.PATH}` };
}

/**
 * The Windows cross-build tools. Homebrew installs llvm and lld "keg-only"
 * (off PATH), so their folders are added here when present.
 */
function windowsCrossEnv(): Record<string, string> {
  const kegs = ["/opt/homebrew/opt", "/usr/local/opt"]
    .flatMap((prefix) => [`${prefix}/llvm/bin`, `${prefix}/lld/bin`])
    .filter((dir) => existsSync(dir));
  const PATH = [...kegs, rustEnv().PATH].join(path.delimiter);
  const missing = [
    ["makensis", "brew install nsis"],
    ["clang-cl", "brew install llvm"],
    ["llvm-rc", "brew install llvm"],
    ["lld-link", "brew install lld"],
    ["cargo-xwin", "cargo install --locked cargo-xwin"],
  ].filter(([tool]) => !Bun.which(tool, { PATH }));
  if (missing.length > 0) {
    throw new Error(
      `Building for Windows from this machine needs:\n${missing
        .map(([tool, install]) => `  ${tool}: ${install}`)
        .join("\n")}`,
    );
  }
  return { PATH };
}

/** Runs the Tauri build inside an Ubuntu 22.04 (x86_64) container. */
function buildLinuxInDocker(
  opts: BuildOptions,
  updaterArgs: string[],
  signing: Record<string, string>,
) {
  const cliVersion = output(["node_modules/.bin/tauri", "--version"], DESKTOP_DIR).split(" ").pop()!;
  run(
    [
      "docker",
      "build",
      "--platform",
      "linux/amd64",
      "--build-arg",
      `TAURI_CLI_VERSION=${cliVersion}`,
      "-t",
      LINUX_BUILDER_IMAGE,
      "-f",
      "docker/linux-builder.Dockerfile",
      "docker",
    ],
    { cwd: DESKTOP_DIR },
  );
  run(
    [
      "docker",
      "run",
      "--rm",
      "--platform",
      "linux/amd64",
      "-v",
      `${DESKTOP_DIR}:/work/apps/desktop`,
      "-v",
      "compooss-desktop-cargo-registry:/root/.cargo/registry",
      "-e",
      `CARGO_TARGET_DIR=/work/apps/desktop/src-tauri/${LINUX_TARGET_DIR}`,
      // Names only: Docker takes the values from the environment below, so
      // the key never appears in the command line.
      ...Object.keys(signing).flatMap((name) => ["-e", name]),
      LINUX_BUILDER_IMAGE,
      "tauri",
      "build",
      "--config",
      "src-tauri/tauri.bundle.conf.json",
      ...updaterArgs,
      "--bundles",
      "deb",
      ...(opts.debug ? ["--debug"] : []),
    ],
    { env: signing },
  );
}

/** Bundles for the current version (older builds may still be in `dir`). */
function bundlesIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const version = `_${appVersion()}_`;
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter(
      (file) =>
        BUNDLE_FILE.test(file) &&
        (path.basename(file).includes(version) || MACOS_UPDATE_FILE.test(file)),
    )
    .map((file) => path.join(dir, file));
}

if (import.meta.main) {
  const triple = argValue("target") ?? hostTriple();
  const files = buildTarget(triple, { skipServer: hasFlag("skip-server"), debug: hasFlag("debug") });
  console.log(`\nBuilt ${triple}:\n${files.map((file) => `  ${file}`).join("\n")}`);
}
