/**
 * Builds the desktop installers and puts them on the landing page: in
 * apps/docs/public/downloads, under the stable names the download links use.
 *
 *   bun scripts/release.ts                  all targets
 *   bun scripts/release.ts --targets a,b    only these target triples
 *
 * Installers of targets not built this time are kept. SHA256SUMS.txt is
 * rewritten for every installer in the folder, and release.json records the
 * version the landing page shows.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildTarget } from "./build";
import { REPO_ROOT, TARGETS, appVersion, argValue } from "./shared";

const DOWNLOADS_DIR = path.join(REPO_ROOT, "apps", "docs", "public", "downloads");

/** Must match DESKTOP_PLATFORMS in apps/docs/src/lib/constants/landing.constants.tsx. */
const STABLE_NAMES: Record<string, Record<string, string>> = {
  "aarch64-apple-darwin": { ".dmg": "Compooss-macos-arm64.dmg" },
  "x86_64-apple-darwin": { ".dmg": "Compooss-macos-x64.dmg" },
  "x86_64-pc-windows-msvc": { ".exe": "Compooss-windows-x64-setup.exe" },
  "x86_64-unknown-linux-gnu": {
    ".AppImage": "Compooss-linux-x86_64.AppImage",
    ".deb": "Compooss-linux-amd64.deb",
  },
};

const targets = argValue("targets")?.split(",") ?? Object.keys(TARGETS);
for (const triple of targets) {
  if (!STABLE_NAMES[triple]) throw new Error(`Unknown target "${triple}".`);
}

mkdirSync(DOWNLOADS_DIR, { recursive: true });
targets.forEach((triple, index) => {
  // The server tree is the same for every target, so build it once.
  const built = buildTarget(triple, { skipServer: index > 0 });
  for (const [extension, name] of Object.entries(STABLE_NAMES[triple])) {
    const source = built.find((file) => file.endsWith(extension));
    if (!source) throw new Error(`No ${extension} was built for ${triple}.`);
    copyFileSync(source, path.join(DOWNLOADS_DIR, name));
  }
});

const installers = Object.values(STABLE_NAMES)
  .flatMap((names) => Object.values(names))
  .filter((name) => existsSync(path.join(DOWNLOADS_DIR, name)))
  .sort();
const sums: string[] = [];
for (const name of installers) {
  const bytes = await Bun.file(path.join(DOWNLOADS_DIR, name)).bytes();
  sums.push(`${new Bun.CryptoHasher("sha256").update(bytes).digest("hex")}  ${name}`);
}
writeFileSync(path.join(DOWNLOADS_DIR, "SHA256SUMS.txt"), `${sums.join("\n")}\n`);
writeFileSync(
  path.join(DOWNLOADS_DIR, "release.json"),
  `${JSON.stringify({ version: appVersion() }, null, 2)}\n`,
);

console.log(
  `\nCompooss ${appVersion()} installers in ${path.relative(REPO_ROOT, DOWNLOADS_DIR)}:\n` +
    installers.map((name) => `  ${name}`).join("\n") +
    "\nDeploy the docs site to publish them.",
);
