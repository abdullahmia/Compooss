"use client";

import { CopyButton } from "@/components/copy-button";
import { SectionHeader } from "@/components/section-header";
import desktopRelease from "@/lib/constants/desktop-release.json";
import {
  DESKTOP_CHECKSUMS_FILE,
  DESKTOP_PLATFORMS,
  DESKTOP_RELEASES_URL,
} from "@/lib/constants/landing.constants";
import type { DesktopOs } from "@/lib/types/landing.type";
import {
  Apple,
  ArrowRight,
  Clock,
  Download as DownloadIcon,
  Monitor,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";

const OS_ICONS: Record<DesktopOs, LucideIcon> = {
  macos: Apple,
  windows: Monitor,
  linux: Terminal,
};

function detectOs(): DesktopOs | null {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  if (/Android|iPhone|iPad/i.test(nav.userAgent)) return null;
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent;
  if (/mac/i.test(platform)) return "macos";
  if (/win/i.test(platform)) return "windows";
  if (/linux/i.test(platform)) return "linux";
  return null;
}

const noSubscribe = () => () => {};

const formatSize = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

/** The installers on GitHub Releases, written by apps/desktop/scripts/release.ts. */
const RELEASE: {
  version: string;
  tag: string;
  downloads: Record<string, { file: string; size: number } | undefined>;
} = desktopRelease;
const releasePageUrl = `${DESKTOP_RELEASES_URL}/tag/${RELEASE.tag}`;
const releaseUrl = (file: string) => `${DESKTOP_RELEASES_URL}/download/${RELEASE.tag}/${file}`;

export const Download: React.FC = () => {
  // The visitor's OS, selected by default. Unknown during server rendering.
  const detectedOs = useSyncExternalStore(noSubscribe, detectOs, () => null);
  const [selectedOs, setSelectedOs] = useState<DesktopOs | null>(null);
  const activeOs = selectedOs ?? detectedOs ?? "macos";

  const platform = DESKTOP_PLATFORMS.find((p) => p.os === activeOs)!;
  const [primary, ...alternatives] = platform.downloads.flatMap(({ id, label }) => {
    const released = RELEASE.downloads[id];
    return released ? [{ label, ...released }] : [];
  });

  return (
    <section id="download" className="py-12 md:py-16">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          namespace="desktop"
          title="Prefer a desktop app?"
          description="The same Compooss as a native app for macOS, Windows and Linux. It runs on your machine, with no Docker, account or cloud."
        />

        <div className="mt-12 overflow-hidden rounded-2xl border border-line bg-card">
          {/* OS tabs */}
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
            <div
              role="tablist"
              aria-label="Operating system"
              className="flex items-center gap-1 rounded-[10px] bg-deep p-1"
            >
              {DESKTOP_PLATFORMS.map((p) => {
                const isActive = p.os === activeOs;
                const Icon = OS_ICONS[p.os];
                return (
                  <button
                    key={p.os}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedOs(p.os)}
                    className={`flex h-8 items-center gap-2 rounded-md px-3 text-[13px] transition-colors duration-150 ease-out ${
                      isActive
                        ? "bg-raised text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "text-fg-muted hover:text-fg-secondary"
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    {p.name}
                    {p.os === detectedOs && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-accent"
                        title="Your system"
                        aria-label="Your system"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <a
              href={releasePageUrl}
              title="Release notes on GitHub"
              className="hidden font-mono text-xs text-fg-muted transition-colors duration-150 ease-out hover:text-fg sm:inline"
            >
              v{RELEASE.version}
            </a>
          </div>

          <div role="tabpanel" className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {/* Download */}
            <div className="flex flex-col gap-6 border-b border-line p-6 md:border-b-0 md:border-r md:p-8">
              <div className="flex items-center gap-4">
                <AppIcon />
                <div className="min-w-0">
                  <h3 className="text-base font-medium text-fg">
                    Compooss for {platform.name}
                  </h3>
                  <p className="text-sm text-fg-muted">{platform.requirement}</p>
                </div>
              </div>

              {primary ? (
                <div className="flex flex-col gap-2">
                  <a
                    href={releaseUrl(primary.file)}
                    className="flex items-center gap-3 rounded-lg bg-fg px-4 py-3 text-page transition-[background-color,transform] duration-150 ease-out hover:bg-white active:scale-[0.98]"
                  >
                    <DownloadIcon size={16} strokeWidth={1.5} className="shrink-0" />
                    <span className="flex flex-col">
                      <span className="text-[15px] font-medium leading-5">
                        Download for {platform.name}
                      </span>
                      <span className="text-xs tabular-nums leading-4 text-page/70">
                        {primary.label} · {formatSize(primary.size)}
                      </span>
                    </span>
                  </a>
                  {alternatives.map((download) => (
                    <a
                      key={download.file}
                      href={releaseUrl(download.file)}
                      className="flex h-11 items-center justify-between gap-4 rounded-lg border border-line bg-raised px-4 text-sm text-fg transition-colors duration-150 ease-out hover:border-line-strong"
                    >
                      <span className="flex items-center gap-2">
                        <DownloadIcon size={16} strokeWidth={1.5} className="text-fg-muted" />
                        {download.label}
                      </span>
                      <span className="text-xs tabular-nums text-fg-secondary">
                        {formatSize(download.size)}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <span className="flex h-12 items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-sm text-fg-muted">
                  <Clock size={16} strokeWidth={1.5} />
                  Coming soon
                </span>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
                <span>Free and open source · MIT</span>
                {primary && (
                  <a
                    href={releaseUrl(DESKTOP_CHECKSUMS_FILE)}
                    className="underline decoration-line-strong underline-offset-4 transition-colors duration-150 ease-out hover:text-fg"
                  >
                    SHA-256 checksums
                  </a>
                )}
              </div>
            </div>

            {/* Install steps */}
            <div className="p-6 md:p-8">
              <h3 className="text-sm font-medium text-fg">Install</h3>
              {primary ? (
                <ol className="mt-4 flex flex-col gap-4">
                  {platform.steps.map((step, i) => (
                    <li key={step.text} className="flex gap-4">
                      <span className="w-4 shrink-0 font-mono text-[13px] leading-6 tabular-nums text-fg-muted">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-6 text-fg-secondary">{step.text}</p>
                        {step.command && (
                          <Command code={step.command.replaceAll("{version}", RELEASE.version)} />
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 text-sm leading-6 text-fg-secondary">
                  Compooss for {platform.name} is on its way. Until then, run it
                  with Docker.
                </p>
              )}
            </div>
          </div>
        </div>

        <a
          href="#installation"
          className="mt-6 inline-flex items-center gap-2 text-sm text-fg-secondary transition-colors duration-150 ease-out hover:text-fg"
        >
          Prefer Docker? Run it as a container
          <ArrowRight size={16} strokeWidth={1.5} />
        </a>
      </div>
    </section>
  );
};

/** A shell command with a copy button. Wraps instead of scrolling. */
const Command: React.FC<{ code: string }> = ({ code }) => (
  <div className="mt-2 flex items-start gap-2 rounded-lg border border-line bg-deep py-1 pl-3 pr-1">
    <span className="select-none py-1 font-mono text-xs leading-6 text-fg-muted">$</span>
    <code className="min-w-0 flex-1 whitespace-pre-wrap break-words py-1 font-mono text-xs leading-6 text-fg">
      {code}
    </code>
    <CopyButton text={code} label="Copy command" />
  </div>
);

/** The Compooss app icon, as shipped in the desktop app. */
const AppIcon: React.FC = () => (
  <svg viewBox="100 100 824 824" className="h-12 w-12 shrink-0" aria-hidden="true">
    <defs>
      <linearGradient id="app-icon-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a3034" />
        <stop offset="1" stopColor="#0d0f11" />
      </linearGradient>
    </defs>
    <rect x="100" y="100" width="824" height="824" rx="185" fill="url(#app-icon-bg)" />
    <rect
      x="104"
      y="104"
      width="816"
      height="816"
      rx="181"
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.08"
      strokeWidth="8"
    />
    <path
      fill="#ffffff"
      d="M512 236C585 312 650 410 652 530 654 640 594 716 512 748 430 716 370 640 372 530 374 410 439 312 512 236Z"
    />
    <path fill="#15191c" d="M512 378 521 700 503 700Z" />
    <rect x="502" y="700" width="20" height="96" rx="5" fill="#ffffff" />
  </svg>
);
