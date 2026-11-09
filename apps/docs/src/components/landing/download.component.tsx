"use client";

import { AnimatedSection } from "@/components/animated-section";
import desktopRelease from "@/lib/constants/desktop-release.json";
import {
  DESKTOP_CHECKSUMS_FILE,
  DESKTOP_PLATFORMS,
  DESKTOP_RELEASES_URL,
} from "@/lib/constants/landing.constants";
import type { DesktopOs } from "@/lib/types/landing.type";
import { motion } from "framer-motion";
import {
  Apple,
  ArrowRight,
  Check,
  Clock,
  Copy,
  Download as DownloadIcon,
  Monitor,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";

const OS_ICONS: Record<DesktopOs, React.ReactNode> = {
  macos: <Apple size={14} />,
  windows: <Monitor size={14} />,
  linux: <Terminal size={14} />,
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
    <section id="download" className="relative py-20 md:py-28">
      <div className="relative mx-auto max-w-5xl px-6">
        <AnimatedSection className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Desktop app
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Prefer a desktop app?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            The same Compooss as a native app for macOS, Windows and Linux.
            Everything runs on your machine — no Docker, no account, no cloud.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50 shadow-2xl shadow-black/40 backdrop-blur-sm">
            {/* OS tabs */}
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-zinc-950/60 px-4 py-3">
              <div
                role="tablist"
                aria-label="Operating system"
                className="flex items-center gap-1 rounded-lg bg-zinc-800/50 p-1"
              >
                {DESKTOP_PLATFORMS.map((p) => {
                  const isActive = p.os === activeOs;
                  return (
                    <button
                      key={p.os}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedOs(p.os)}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:px-3.5 ${
                        isActive
                          ? "bg-zinc-700 text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {OS_ICONS[p.os]}
                      {p.name}
                      {p.os === detectedOs && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-emerald-400"
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
                className="hidden rounded-md border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-1 font-mono text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white sm:inline"
              >
                v{RELEASE.version}
              </a>
            </div>

            <motion.div
              key={activeOs}
              role="tabpanel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
            >
              {/* Download */}
              <div className="flex flex-col gap-6 border-b border-white/[0.06] p-6 md:border-b-0 md:border-r md:p-8">
                <div className="flex items-center gap-4">
                  <AppIcon />
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-zinc-100">
                      Compooss for {platform.name}
                    </h3>
                    <p className="text-sm text-zinc-500">{platform.requirement}</p>
                  </div>
                </div>

                {primary ? (
                  <div className="flex flex-col gap-2.5">
                    <a
                      href={releaseUrl(primary.file)}
                      className="group flex items-center gap-3.5 rounded-xl bg-emerald-500 px-5 py-3.5 text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
                    >
                      <DownloadIcon size={18} className="shrink-0" />
                      <span className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold">
                          Download for {platform.name}
                        </span>
                        <span className="mt-0.5 text-xs text-zinc-950/65">
                          {primary.label} · {formatSize(primary.size)}
                        </span>
                      </span>
                    </a>
                    {alternatives.map((download) => (
                      <a
                        key={download.file}
                        href={releaseUrl(download.file)}
                        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800/50 hover:text-white"
                      >
                        <span className="flex items-center gap-2">
                          <DownloadIcon size={14} className="text-zinc-500" />
                          {download.label}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatSize(download.size)}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 px-5 py-4 text-sm font-medium text-zinc-500">
                    <Clock size={16} />
                    Coming soon
                  </span>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                  <span>Free and open source · MIT</span>
                  {primary && (
                    <a
                      href={releaseUrl(DESKTOP_CHECKSUMS_FILE)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-emerald-400"
                    >
                      <ShieldCheck size={13} />
                      SHA-256 checksums
                    </a>
                  )}
                </div>
              </div>

              {/* Install steps */}
              <div className="p-6 md:p-8">
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                  Install
                </p>
                {primary ? (
                  <ol className="space-y-5">
                    {platform.steps.map((step, i) => (
                      <li key={step.text} className="flex gap-3.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-sm leading-relaxed text-zinc-300">{step.text}</p>
                          {step.command && (
                            <Command code={step.command.replaceAll("{version}", RELEASE.version)} />
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm leading-relaxed text-zinc-400">
                    Compooss for {platform.name} is on its way. Until then, run it
                    with Docker in a minute.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2} className="mt-6 text-center">
          <a
            href="#installation"
            className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-emerald-400"
          >
            Prefer Docker? Run it as a container
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </AnimatedSection>
      </div>
    </section>
  );
};

/** A shell command with a copy button. Wraps instead of scrolling. */
const Command: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2.5 flex items-start gap-2.5 rounded-lg border border-zinc-800/60 bg-zinc-950/80 py-1.5 pl-3 pr-1.5">
      <span className="select-none font-mono text-xs leading-6 text-emerald-500/60">$</span>
      <code className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-xs leading-6 text-zinc-300">
        {code}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy command"}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
      >
        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
      </button>
    </div>
  );
};

/** The Compooss app icon, as shipped in the desktop app. */
const AppIcon: React.FC = () => (
  <div className="relative shrink-0">
    <div className="absolute inset-1 rounded-2xl bg-emerald-500/20 blur-xl" />
    <svg viewBox="100 100 824 824" className="relative h-14 w-14" aria-hidden="true">
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
  </div>
);
