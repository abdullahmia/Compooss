/**
 * Builds a new desktop version, ready to upload to Cloudflare R2.
 *
 *   bun scripts/release.ts                    bump the patch version, build every target
 *   bun scripts/release.ts --minor | --major  bump that part instead
 *   bun scripts/release.ts --no-bump          rebuild the current version (e.g. after a failed build)
 *   bun scripts/release.ts --targets a,b      build only these target triples
 *   bun scripts/release.ts --skip-server      reuse the server tree from the previous build
 *   bun scripts/release.ts --manifest-only    don't build; refresh the checksums and landing page
 *                                             manifest from what's in release/<version>/
 *
 * Installers go to apps/desktop/release/<version>/ with versioned names, next
 * to SHA256SUMS.txt. Upload that folder to the bucket root, so each file is at
 * <R2 URL>/<version>/<file>. The landing page builds its links from
 * apps/docs/src/lib/constants/desktop-release.json, which this script writes.
 */
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildTarget } from "./build";
import { DESKTOP_DIR, REPO_ROOT, TARGETS, appVersion, argValue, hasFlag, setAppVersion } from "./shared";

const RELEASE_DIR = path.join(DESKTOP_DIR, "release");
const MANIFEST_FILE = path.join(
  REPO_ROOT,
  "apps/docs/src/lib/constants/desktop-release.json",
);

/**
 * What each target produces. The ids are what the landing page refers to
 * (DESKTOP_PLATFORMS in apps/docs/src/lib/constants/landing.constants.tsx).
 */
const ARTIFACTS: Record<string, { id: string; extension: string; suffix: string }[]> = {
  "aarch64-apple-darwin": [{ id: "macos-arm64", extension: ".dmg", suffix: "macos-arm64.dmg" }],
  "x86_64-apple-darwin": [{ id: "macos-x64", extension: ".dmg", suffix: "macos-x64.dmg" }],
  "x86_64-pc-windows-msvc": [
    { id: "windows-x64", extension: ".exe", suffix: "windows-x64-setup.exe" },
  ],
  "x86_64-unknown-linux-gnu": [
    { id: "linux-x86_64", extension: ".AppImage", suffix: "linux-x86_64.AppImage" },
    { id: "linux-amd64", extension: ".deb", suffix: "linux-amd64.deb" },
  ],
};

const fileName = (version: string, suffix: string) => `Compooss-${version}-${suffix}`;

const targets = argValue("targets")?.split(",") ?? Object.keys(TARGETS);
for (const triple of targets) {
  if (!ARTIFACTS[triple]) throw new Error(`Unknown target "${triple}".`);
}

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

function bumpVersion(version: string, part: "major" | "minor" | "patch"): string {
  const [major, minor, patch] = version.split(".").map(Number);
  if ([major, minor, patch].some(Number.isNaN)) throw new Error(`Can't bump version "${version}".`);
  if (part === "major") return `${major + 1}.0.0`;
  if (part === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** Lists what's in release/<version>/ for SHA256SUMS.txt and the landing page. */
async function writeChecksumsAndManifest(version: string) {
  const outDir = path.join(RELEASE_DIR, version);
  const downloads: Record<string, { file: string; size: number }> = {};
  const sums: string[] = [];
  for (const { id, suffix } of Object.values(ARTIFACTS).flat()) {
    const file = fileName(version, suffix);
    const filePath = path.join(outDir, file);
    if (!existsSync(filePath)) continue;
    downloads[id] = { file, size: statSync(filePath).size };
    const bytes = await Bun.file(filePath).bytes();
    sums.push(`${new Bun.CryptoHasher("sha256").update(bytes).digest("hex")}  ${file}`);
  }
  if (sums.length === 0) throw new Error(`No installers in ${outDir}.`);

  writeFileSync(path.join(outDir, "SHA256SUMS.txt"), `${sums.join("\n")}\n`);
  writeFileSync(MANIFEST_FILE, `${JSON.stringify({ version, downloads }, null, 2)}\n`);

  console.log(
    [
      "",
      `Compooss ${version} is ready in ${path.relative(REPO_ROOT, outDir)}:`,
      ...Object.values(downloads).map(({ file }) => `  ${file}`),
      "  SHA256SUMS.txt",
      "",
      "Next:",
      `  1. Upload the ${version} folder to the root of the R2 bucket.`,
      `  2. Commit apps/desktop/package.json and ${path.relative(REPO_ROOT, MANIFEST_FILE)}.`,
      "  3. Deploy the docs site.",
    ].join("\n"),
  );
}
