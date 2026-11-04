import { DESKTOP_CHECKSUMS_FILE, DESKTOP_PLATFORMS } from "@/lib/constants/landing.constants";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export type DesktopDownloads = {
  /** Size in bytes of each installer in public/downloads, by file name. */
  sizes: Record<string, number>;
  hasChecksums: boolean;
  /** Version of the installers, from release.json written by the release script. */
  version: string | null;
};

/** Which installers are in public/downloads. Read at build time. */
export function getDesktopDownloads(): DesktopDownloads {
  const dir = path.join(process.cwd(), "public", "downloads");
  const sizes: Record<string, number> = {};
  for (const { file } of DESKTOP_PLATFORMS.flatMap((platform) => platform.downloads)) {
    const filePath = path.join(dir, file);
    if (existsSync(filePath)) sizes[file] = statSync(filePath).size;
  }
  const releaseFile = path.join(dir, "release.json");
  const version = existsSync(releaseFile)
    ? (JSON.parse(readFileSync(releaseFile, "utf8")) as { version?: string }).version ?? null
    : null;
  return { sizes, hasChecksums: existsSync(path.join(dir, DESKTOP_CHECKSUMS_FILE)), version };
}
