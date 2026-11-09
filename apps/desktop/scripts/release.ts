/**
 * Builds the desktop installers for the current version and attaches them to
 * its GitHub release.
 *
 *   bun scripts/release.ts                    build every target
 *   bun scripts/release.ts --targets a,b      build only these target triples
 *   bun scripts/release.ts --skip-server      reuse the server tree from the previous build
 *   bun scripts/release.ts --manifest-only    don't build; refresh the checksums and landing page
 *                                             manifest from what's in release/<version>/
 *   bun scripts/release.ts --publish          don't build; attach release/<version>/ to the
 *                                             GitHub release v<version>
 *
 * The desktop app shares its version with the web app and the Docker image.
 * release-please bumps it in apps/desktop/package.json and creates the GitHub
 * release v<version> when its release PR is merged. Installers go to
 * apps/desktop/release/<version>/ with versioned names, next to
 * SHA256SUMS.txt, and --publish uploads them to that release. The landing page
 * builds its links from apps/docs/src/lib/constants/desktop-release.json,
 * which this script writes.
 *
 * Each target also has a signed update package, listed in latest.json.
 * Installed apps read it from the latest GitHub release (plugins.updater in
 * src-tauri/tauri.conf.json), so they see a release once it's published.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildTarget } from "./build";
import {
  DESKTOP_DIR,
  REPO_ROOT,
  TARGETS,
  TAURI_DIR,
  appVersion,
  argValue,
  hasFlag,
  output,
  run,
} from "./shared";

const RELEASE_DIR = path.join(DESKTOP_DIR, "release");
const MANIFEST_FILE = path.join(
  REPO_ROOT,
  "apps/docs/src/lib/constants/desktop-release.json",
);
const CHECKSUMS_FILE = "SHA256SUMS.txt";
/** Same as the updater endpoint in tauri.conf.json, which reads it from the latest release. */
const UPDATE_MANIFEST = "latest.json";
const RELEASES_URL = "https://github.com/abdullahmia/compooss/releases";
/** Starts the section that --publish adds to the release notes. */
const NOTES_HEADING = "### Desktop app";

/**
 * What each target produces. The ids are what the landing page refers to
 * (DESKTOP_PLATFORMS in apps/docs/src/lib/constants/landing.constants.tsx).
 */
const ARTIFACTS: Record<
  string,
  { id: string; label: string; extension: string; suffix: string }[]
> = {
  "aarch64-apple-darwin": [
    { id: "macos-arm64", label: "macOS, Apple Silicon", extension: ".dmg", suffix: "macos-arm64.dmg" },
  ],
  "x86_64-apple-darwin": [
    { id: "macos-x64", label: "macOS, Intel", extension: ".dmg", suffix: "macos-x64.dmg" },
  ],
  "x86_64-pc-windows-msvc": [
    { id: "windows-x64", label: "Windows, x64", extension: ".exe", suffix: "windows-x64-setup.exe" },
  ],
  "x86_64-unknown-linux-gnu": [
    { id: "linux-amd64", label: "Linux (Debian/Ubuntu), x64", extension: ".deb", suffix: "linux-amd64.deb" },
  ],
};

/**
 * What each target's installed apps update from, and its key in latest.json:
 * the updater looks for {os}-{arch}-{installer}. Windows and Linux run the
 * installer itself; macOS replaces the app with a .app.tar.gz.
 */
const UPDATES: Record<string, { platform: string; extension: string; suffix: string }> = {
  "aarch64-apple-darwin": { platform: "darwin-aarch64-app", extension: ".app.tar.gz", suffix: "macos-arm64.app.tar.gz" },
  "x86_64-apple-darwin": { platform: "darwin-x86_64-app", extension: ".app.tar.gz", suffix: "macos-x64.app.tar.gz" },
  "x86_64-pc-windows-msvc": { platform: "windows-x86_64-nsis", extension: ".exe", suffix: "windows-x64-setup.exe" },
  "x86_64-unknown-linux-gnu": { platform: "linux-x86_64-deb", extension: ".deb", suffix: "linux-amd64.deb" },
};

const fileName = (version: string, suffix: string) => `Compooss-${version}-${suffix}`;

/** The tag release-please gives a version (include-v-in-tag in release-please-config.json). */
const releaseTag = (version: string) => `v${version}`;

const targets = argValue("targets")?.split(",") ?? Object.keys(TARGETS);
for (const triple of targets) {
  if (!ARTIFACTS[triple]) throw new Error(`Unknown target "${triple}".`);
}

if (hasFlag("publish")) {
  publish(appVersion());
} else {
  if (!hasFlag("manifest-only")) {
    const version = appVersion();
    const outDir = path.join(RELEASE_DIR, version);
    mkdirSync(outDir, { recursive: true });
    targets.forEach((triple, index) => {
      const built = buildTarget(triple, {
        // The server tree is the same for every target, so build it once.
        skipServer: hasFlag("skip-server") || index > 0,
        requireUpdates: true,
      });
      for (const { extension, suffix } of ARTIFACTS[triple]) {
        const source = built.find((file) => file.endsWith(extension));
        if (!source) throw new Error(`No ${extension} was built for ${triple}.`);
        copyFileSync(source, path.join(outDir, fileName(version, suffix)));
      }
      // On Windows and Linux this copies the installer again, next to its signature.
      const { extension, suffix } = UPDATES[triple];
      const update = built.find((file) => file.endsWith(extension));
      const signature = built.find((file) => file.endsWith(`${extension}.sig`));
      if (!update || !signature) throw new Error(`No signed update package was built for ${triple}.`);
      const updateFile = path.join(outDir, fileName(version, suffix));
      copyFileSync(update, updateFile);
      copyFileSync(signature, `${updateFile}.sig`);
    });
  }

  await writeChecksumsAndManifest(appVersion());
}

/** The installers in release/<version>/, in ARTIFACTS order. */
function installersIn(version: string) {
  const outDir = path.join(RELEASE_DIR, version);
  return Object.values(ARTIFACTS)
    .flat()
    .map(({ id, label, suffix }) => {
      const file = fileName(version, suffix);
      return { id, label, file, filePath: path.join(outDir, file) };
    })
    .filter(({ filePath }) => existsSync(filePath));
}

/** Lists what's in release/<version>/ for SHA256SUMS.txt and the landing page. */
async function writeChecksumsAndManifest(version: string) {
  const outDir = path.join(RELEASE_DIR, version);
  const installers = installersIn(version);
  if (installers.length === 0) throw new Error(`No installers in ${outDir}.`);

  const downloads: Record<string, { file: string; size: number }> = {};
  const sums: string[] = [];
  for (const { id, file, filePath } of installers) {
    downloads[id] = { file, size: statSync(filePath).size };
    const bytes = await Bun.file(filePath).bytes();
    sums.push(`${new Bun.CryptoHasher("sha256").update(bytes).digest("hex")}  ${file}`);
  }

  writeFileSync(path.join(outDir, CHECKSUMS_FILE), `${sums.join("\n")}\n`);
  writeFileSync(
    MANIFEST_FILE,
    `${JSON.stringify({ version, tag: releaseTag(version), downloads }, null, 2)}\n`,
  );
  const updates = writeUpdateManifest(version);

  console.log(
    [
      "",
      `Compooss ${version} is ready in ${path.relative(REPO_ROOT, outDir)}:`,
      ...installers.map(({ file }) => `  ${file}`),
      `  ${CHECKSUMS_FILE}`,
      updates.length > 0
        ? `  ${UPDATE_MANIFEST} (updates for ${updates.join(", ")})`
        : `  No signed update packages, so installed apps won't update to ${version}.`,
      "",
      "Next:",
      `  1. Attach them to the GitHub release ${releaseTag(version)}: bun desktop publish.`,
      `  2. Commit ${path.relative(REPO_ROOT, MANIFEST_FILE)} and merge it into main.`,
      "  3. Deploy the docs site.",
    ].join("\n"),
  );
}

/** The update packages in release/<version>/ with their signatures, in UPDATES order. */
function updatesIn(version: string) {
  const outDir = path.join(RELEASE_DIR, version);
  return Object.values(UPDATES)
    .map(({ platform, suffix }) => {
      const file = fileName(version, suffix);
      const filePath = path.join(outDir, file);
      return { platform, file, filePath, signaturePath: `${filePath}.sig` };
    })
    .filter(({ filePath, signaturePath }) => existsSync(filePath) && existsSync(signaturePath));
}

/**
 * Writes latest.json, which installed apps check for updates, and returns the
 * platforms it covers. Apps on a platform it leaves out stay on their version.
 */
function writeUpdateManifest(version: string): string[] {
  const manifest = path.join(RELEASE_DIR, version, UPDATE_MANIFEST);
  const updates = updatesIn(version);
  if (updates.length === 0) {
    rmSync(manifest, { force: true });
    return [];
  }

  const platforms: Record<string, { signature: string; url: string }> = {};
  for (const { platform, file, signaturePath } of updates) {
    const signature = readFileSync(signaturePath, "utf8").trim();
    assertSignedWithAppKey(file, signature);
    platforms[platform] = { signature, url: `${RELEASES_URL}/download/${releaseTag(version)}/${file}` };
  }
  writeFileSync(
    manifest,
    `${JSON.stringify({ version, pub_date: new Date().toISOString(), platforms }, null, 2)}\n`,
  );
  return Object.keys(platforms);
}

/**
 * The CLI only warns when the signing key doesn't match the app's public key,
 * and installed apps would then reject the update. Both are minisign files
 * (base64 encoded) whose second line holds the algorithm and the key ID.
 */
function assertSignedWithAppKey(file: string, signature: string) {
  const keyId = (encoded: string) => {
    const line = Buffer.from(encoded, "base64").toString("utf8").split("\n")[1] ?? "";
    return Buffer.from(line, "base64").subarray(2, 10).toString("hex");
  };
  const config = JSON.parse(readFileSync(path.join(TAURI_DIR, "tauri.conf.json"), "utf8"));
  if (keyId(signature) !== keyId(config.plugins.updater.pubkey)) {
    throw new Error(
      `${file} wasn't signed with the key whose public key is in tauri.conf.json, so installed apps would reject it.`,
    );
  }
}

/**
 * Uploads release/<version>/ to the GitHub release v<version> and adds the
 * download instructions to its notes. Running it again replaces the files and
 * that section, e.g. after rebuilding one platform.
 */
function publish(version: string) {
  const tag = releaseTag(version);
  const outDir = path.join(RELEASE_DIR, version);
  const checksums = path.join(outDir, CHECKSUMS_FILE);
  if (!existsSync(checksums)) {
    throw new Error(`Nothing to publish in ${path.relative(REPO_ROOT, outDir)}. Build ${version} first.`);
  }
  // Only the installers, the update packages and their checksums and
  // signatures, not strays such as .DS_Store.
  const installers = installersIn(version);
  const updates = updatesIn(version);
  const files = new Set([
    ...installers.map(({ filePath }) => filePath),
    ...updates.flatMap(({ filePath, signaturePath }) => [filePath, signaturePath]),
    checksums,
  ]);
  const updateManifest = path.join(outDir, UPDATE_MANIFEST);

  if (!Bun.which("gh")) throw new Error("Publishing needs the GitHub CLI: brew install gh");
  if (!succeeds(["gh", "auth", "status"])) throw new Error("The GitHub CLI isn't logged in. Run: gh auth login");
  if (!succeeds(["gh", "release", "view", tag])) {
    throw new Error(
      `There's no GitHub release ${tag} yet. release-please creates it when you merge its release PR.`,
    );
  }

  run(["gh", "release", "upload", tag, ...files, "--clobber"]);
  // Last, so apps never see an update before its packages are there.
  if (existsSync(updateManifest)) run(["gh", "release", "upload", tag, updateManifest, "--clobber"]);

  // release-please wrote the changelog; replace only the desktop section.
  const notes = output(["gh", "release", "view", tag, "--json", "body", "--jq", ".body"]);
  const changelog = notes.split(NOTES_HEADING)[0].trimEnd();
  const notesFile = path.join(tmpdir(), `compooss-${tag}-notes.md`);
  writeFileSync(
    notesFile,
    [
      changelog,
      "",
      NOTES_HEADING,
      "",
      "Download the installer for your system from **Assets** below:",
      "",
      ...installers.map(({ label, file }) => `- **${label}**: \`${file}\``),
      "",
      "macOS needs 13.5 or later. Windows 10 and 11 are supported. On other Linux distributions, use the Docker image.",
      "",
      "The builds aren't signed yet. On macOS, allow the app once under System Settings → Privacy & Security → Open Anyway. On Windows, choose More info → Run anyway when SmartScreen warns about it.",
      "",
      `\`${CHECKSUMS_FILE}\` has the SHA-256 checksum of each file.`,
      "",
    ].join("\n"),
  );
  run(["gh", "release", "edit", tag, "--notes-file", notesFile]);

  const url = output(["gh", "release", "view", tag, "--json", "url", "--jq", ".url"]);
  console.log(`\nPublished ${url}`);
}

/** Runs a command quietly and reports whether it exited with 0. */
function succeeds(cmd: string[]): boolean {
  return Bun.spawnSync(cmd, { cwd: REPO_ROOT, stdout: "ignore", stderr: "ignore" }).exitCode === 0;
}
