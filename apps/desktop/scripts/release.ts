/**
 * Builds a new desktop version and publishes it as a GitHub release.
 *
 *   bun scripts/release.ts                    bump the patch version, build every target
 *   bun scripts/release.ts --minor | --major  bump that part instead
 *   bun scripts/release.ts --no-bump          rebuild the current version (e.g. after a failed build)
 *   bun scripts/release.ts --targets a,b      build only these target triples
 *   bun scripts/release.ts --skip-server      reuse the server tree from the previous build
 *   bun scripts/release.ts --manifest-only    don't build; refresh the checksums and landing page
 *                                             manifest from what's in release/<version>/
 *   bun scripts/release.ts --publish          don't build; upload release/<version>/ to the
 *                                             GitHub release desktop-v<version>
 *
 * Installers go to apps/desktop/release/<version>/ with versioned names, next
 * to SHA256SUMS.txt. --publish uploads them with the GitHub CLI, so each file
 * is at github.com/<repo>/releases/download/desktop-v<version>/<file>. The
 * landing page builds its links from
 * apps/docs/src/lib/constants/desktop-release.json, which this script writes.
 */
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildTarget } from "./build";
import {
  DESKTOP_DIR,
  REPO_ROOT,
  TARGETS,
  appVersion,
  argValue,
  hasFlag,
  output,
  run,
  setAppVersion,
} from "./shared";

const RELEASE_DIR = path.join(DESKTOP_DIR, "release");
const MANIFEST_FILE = path.join(
  REPO_ROOT,
  "apps/docs/src/lib/constants/desktop-release.json",
);
const CHECKSUMS_FILE = "SHA256SUMS.txt";
/** What a release commits: the new version and the landing page manifest. */
const VERSION_FILES = [path.join(DESKTOP_DIR, "package.json"), MANIFEST_FILE].map((file) =>
  path.relative(REPO_ROOT, file),
);

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

const fileName = (version: string, suffix: string) => `Compooss-${version}-${suffix}`;

/**
 * Desktop releases get their own tags: plain v<version> tags are the
 * web/Docker releases that release-please makes, and the desktop app has its
 * own version.
 */
const releaseTag = (version: string) => `desktop-v${version}`;

const targets = argValue("targets")?.split(",") ?? Object.keys(TARGETS);
for (const triple of targets) {
  if (!ARTIFACTS[triple]) throw new Error(`Unknown target "${triple}".`);
}

if (hasFlag("publish")) {
  publish(appVersion());
} else {
  if (!hasFlag("manifest-only")) {
    if (!hasFlag("no-bump")) {
      const next = bumpVersion(appVersion(), hasFlag("major") ? "major" : hasFlag("minor") ? "minor" : "patch");
      setAppVersion(next);
      console.log(`Desktop version: ${next}\n`);
    }
    const version = appVersion();
    const outDir = path.join(RELEASE_DIR, version);
    mkdirSync(outDir, { recursive: true });
    targets.forEach((triple, index) => {
      // The server tree is the same for every target, so build it once.
      const built = buildTarget(triple, { skipServer: hasFlag("skip-server") || index > 0 });
      for (const { extension, suffix } of ARTIFACTS[triple]) {
        const source = built.find((file) => file.endsWith(extension));
        if (!source) throw new Error(`No ${extension} was built for ${triple}.`);
        copyFileSync(source, path.join(outDir, fileName(version, suffix)));
      }
    });
  }

  await writeChecksumsAndManifest(appVersion());
}

function bumpVersion(version: string, part: "major" | "minor" | "patch"): string {
  const [major, minor, patch] = version.split(".").map(Number);
  if ([major, minor, patch].some(Number.isNaN)) throw new Error(`Can't bump version "${version}".`);
  if (part === "major") return `${major + 1}.0.0`;
  if (part === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
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

  console.log(
    [
      "",
      `Compooss ${version} is ready in ${path.relative(REPO_ROOT, outDir)}:`,
      ...installers.map(({ file }) => `  ${file}`),
      `  ${CHECKSUMS_FILE}`,
      "",
      "Next:",
      `  1. Commit ${VERSION_FILES.join(" and ")}, and push.`,
      `  2. Publish the GitHub release ${releaseTag(version)}: bun desktop publish.`,
      "  3. Deploy the docs site.",
    ].join("\n"),
  );
}

/**
 * Uploads release/<version>/ to the GitHub release desktop-v<version>. The
 * first time, it creates the release and its tag at HEAD. After that, it
 * replaces the files, e.g. after rebuilding one platform.
 */
function publish(version: string) {
  const tag = releaseTag(version);
  const outDir = path.join(RELEASE_DIR, version);
  const checksums = path.join(outDir, CHECKSUMS_FILE);
  if (!existsSync(checksums)) {
    throw new Error(`Nothing to publish in ${path.relative(REPO_ROOT, outDir)}. Build ${version} first.`);
  }
  // Only the installers and their checksums, not strays such as .DS_Store.
  const installers = installersIn(version);
  const files = [...installers.map(({ filePath }) => filePath), checksums];

  if (!Bun.which("gh")) throw new Error("Publishing needs the GitHub CLI: brew install gh");
  if (!succeeds(["gh", "auth", "status"])) throw new Error("The GitHub CLI isn't logged in. Run: gh auth login");

  if (succeeds(["gh", "release", "view", tag])) {
    run(["gh", "release", "upload", tag, ...files, "--clobber"]);
    console.log(`\nReplaced the files of ${tag}.`);
    return;
  }

  // The tag goes on HEAD, so HEAD has to be the version commit, and on GitHub.
  if (output(["git", "status", "--porcelain", "--", ...VERSION_FILES]) !== "") {
    throw new Error(`Commit ${VERSION_FILES.join(" and ")} first.`);
  }
  const sha = output(["git", "rev-parse", "HEAD"]);
  if (!succeeds(["gh", "api", `repos/{owner}/{repo}/commits/${sha}`, "--silent"])) {
    throw new Error(`Push ${sha.slice(0, 7)} to GitHub first: the release's tag points at it.`);
  }

  const notes = path.join(tmpdir(), `compooss-${tag}-notes.md`);
  writeFileSync(
    notes,
    [
      `The Compooss desktop app, version ${version}. Download the installer for your system from **Assets** below.`,
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
  run([
    "gh",
    "release",
    "create",
    tag,
    ...files,
    "--title",
    `Compooss Desktop ${version}`,
    "--notes-file",
    notes,
    "--target",
    sha,
    // Keep the repo's "Latest" badge on the web/Docker release.
    "--latest=false",
  ]);
  console.log("\nNext: deploy the docs site, so the landing page links to this release.");
}

/** Runs a command quietly and reports whether it exited with 0. */
function succeeds(cmd: string[]): boolean {
  return Bun.spawnSync(cmd, { cwd: REPO_ROOT, stdout: "ignore", stderr: "ignore" }).exitCode === 0;
}
