export type ComparisonValue = "yes" | "no" | "partial" | string;

export type ComparisonRow = {
  feature: string;
  compooss: ComparisonValue;
  compass: ComparisonValue;
  mongoExpress: ComparisonValue;
  studio3t: ComparisonValue;
};

export type DesktopOs = "macos" | "windows" | "linux";

export type DesktopPlatform = {
  os: DesktopOs;
  name: string;
  requirement: string;
  /**
   * The first download is the main one for that platform. `id` is the key in
   * desktop-release.json, written by apps/desktop/scripts/release.ts.
   */
  downloads: { label: string; id: string }[];
  /** `{version}` in a command is replaced with the released version. */
  steps: { text: string; command?: string }[];
};
