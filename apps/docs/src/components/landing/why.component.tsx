"use client";

import { AnimatedSection } from "@/components/animated-section";
import {
  COMPARISON_ROWS,
  COMPARISON_TOOLS,
} from "@/lib/constants/landing.constants";
import type { ComparisonValue } from "@/lib/types/landing.type";
import {
  ArrowRight,
  Check,
  Code2,
  Container,
  Minus,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

export const Why: React.FC = () => {
  const [activeComparisonTab, setActiveComparisonTab] = useState(0);

  return (
    <section id="why-compooss" className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />
      <div className="pointer-events-none absolute left-0 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/[0.06] blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-2/3 h-80 w-80 translate-x-1/2 rounded-full bg-teal-500/[0.06] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6">

        {/* Header */}
        <AnimatedSection className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <p className="text-[13px] font-semibold tracking-wide text-emerald-400">
              Why Compooss
            </p>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            The MongoDB GUI that fits
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              your development workflow
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-zinc-400">
            Most MongoDB GUIs need installation, configuration, and often a
            paid license. Compooss is purpose-built for Docker Compose — the
            way modern developers actually work — and is also a free desktop
            app when you&apos;d rather not run a container.
          </p>
        </AnimatedSection>

        {/* Bento grid */}
        <AnimatedSection className="mb-12">
          <div className="grid gap-4 lg:grid-cols-5 lg:grid-rows-2">

            {/* Large card — Docker-native */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/50 p-7 transition-all hover:border-emerald-500/20 lg:col-span-3 lg:row-span-2">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-transparent" />
              <div className="pointer-events-none absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-emerald-500/[0.08] blur-[60px]" />

              <div className="relative flex h-full flex-col">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                  <Container size={20} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-zinc-100">
                  Docker-native by design
                </h3>
                <p className="mb-6 max-w-sm text-sm leading-relaxed text-zinc-400">
                  Runs as a single container in your Compose stack. No
                  separate install, no config files — just one service block
                  in your existing setup.
                </p>

                {/* Mini code preview */}
                <div className="mt-auto overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-950/80 shadow-2xl shadow-black/40">
                  <div className="flex items-center gap-2 border-b border-zinc-800/60 bg-zinc-900/60 px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
                    </div>
                    <span className="font-mono text-[11px] text-zinc-500">
                      docker-compose.yml
                    </span>
                  </div>
                  <div className="p-4 font-mono text-xs leading-6">
                    <div>
                      <span className="text-zinc-600"># Add to your existing stack</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-blue-400">compooss</span>
                      <span className="text-zinc-300">:</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-emerald-400">image</span>
                      <span className="text-zinc-400">: </span>
                      <span className="text-zinc-200">abdullahmia/compooss:latest</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-emerald-400">ports</span>
                      <span className="text-zinc-400">:</span>
                    </div>
                    <div className="pl-6">
                      <span className="text-amber-300/80">- &quot;6969:3000&quot;</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-emerald-400">networks</span>
                      <span className="text-zinc-400">:</span>
                    </div>
                    <div className="pl-6">
                      <span className="text-amber-300/80">- your_app_network</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-right — Free & open source */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/50 p-6 transition-all hover:border-emerald-500/20 lg:col-span-2">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/[0.04] to-transparent" />
              <div className="relative">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="mb-1.5 text-base font-bold text-zinc-100">
                  Free &amp; open source
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  MIT licensed with no paywalls, no usage limits, and no
                  account required. Self-host it forever.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                    <Check size={10} strokeWidth={3} />
                    MIT License
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-800/50 px-3 py-1 text-[11px] font-medium text-zinc-400">
                    No signup
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-800/50 px-3 py-1 text-[11px] font-medium text-zinc-400">
                    No limits
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom-right — Zero friction */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/50 p-6 transition-all hover:border-emerald-500/20 lg:col-span-2">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent" />
              <div className="relative">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                  <Zap size={18} />
                </div>
                <h3 className="mb-1.5 text-base font-bold text-zinc-100">
                  Zero friction
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  One service definition and you&apos;re done. No wizards, no
                  license keys, no cloud sync.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    { val: "0", label: "Config files" },
                    { val: "1", label: "Container" },
                    { val: "∞", label: "Free usage" },
                  ].map(({ val, label }) => (
                    <div
                      key={label}
                      className="rounded-lg border border-zinc-800/60 bg-zinc-800/40 py-2.5 text-center"
                    >
                      <div className="text-lg font-bold text-emerald-400">
                        {val}
                      </div>
                      <div className="mt-0.5 text-[10px] text-zinc-500">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </AnimatedSection>

        {/* Comparison — side-by-side "vs" panels */}
        <AnimatedSection>

          {/* Tab bar header */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-zinc-200">
                Feature comparison
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Compooss vs the alternatives, feature by feature
              </p>
            </div>
            <div className="flex items-center gap-1 self-start rounded-xl border border-white/[0.07] bg-zinc-900/60 p-1 sm:self-auto">
              {COMPARISON_TOOLS.filter((t) => !t.highlight).map((tool, i) => (
                <button
                  key={tool.name}
                  onClick={() => setActiveComparisonTab(i)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    activeComparisonTab === i
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  vs {tool.name}
                </button>
              ))}
            </div>
          </div>

          {/* Two-panel body */}
          <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/[0.07] shadow-2xl shadow-black/40 md:grid-cols-2">

            {/* ── Compooss panel ── */}
            <div className="border-b border-white/[0.06] md:border-b-0 md:border-r md:border-white/[0.06]">

              {/* Panel header */}
              <div className="relative border-b border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.10] to-emerald-500/[0.03] px-6 py-5">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
                      <span className="text-sm font-extrabold text-emerald-400">C</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-emerald-200">Compooss</p>
                        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-950">
                          Best pick
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-400/60">
                        Free · Docker-native · MIT
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-extrabold tabular-nums text-emerald-400">
                      {COMPARISON_ROWS.filter((r) => r.compooss === "yes").length}
                      <span className="text-sm font-normal text-emerald-400/40">
                        /{COMPARISON_ROWS.length}
                      </span>
                    </p>
                    <p className="text-[10px] text-zinc-600">features</p>
                  </div>
                </div>
                <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-emerald-500/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{
                      width: `${(COMPARISON_ROWS.filter((r) => r.compooss === "yes").length / COMPARISON_ROWS.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Feature rows */}
              <div className="divide-y divide-white/[0.03] bg-emerald-500/[0.015]">
                {COMPARISON_ROWS.map((row) => (
                  <div
                    key={row.feature}
                    className="flex items-center justify-between px-6 py-2.5 transition-colors hover:bg-emerald-500/[0.04]"
                  >
                    <span className="text-xs text-zinc-400">{row.feature}</span>
                    {row.compooss === "yes" ? (
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/30">
                        <Check size={10} className="text-emerald-400" />
                      </span>
                    ) : row.compooss === "no" ? (
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 ring-1 ring-white/[0.04]">
                        <X size={10} className="text-zinc-600" />
                      </span>
                    ) : row.compooss === "partial" ? (
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
                        <Minus size={10} className="text-amber-400/70" />
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">{row.compooss as string}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Competitor panel ── */}
            <div>

              {/* Panel header */}
              <div className="border-b border-white/[0.06] bg-zinc-950/60 px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800/70 ring-1 ring-white/[0.06]">
                      <span className="text-sm font-extrabold text-zinc-500">
                        {(COMPARISON_TOOLS.filter((t) => !t.highlight)[activeComparisonTab]?.name ?? "?")[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-300">
                        {COMPARISON_TOOLS.filter((t) => !t.highlight)[activeComparisonTab]?.name}
                      </p>
                      <p className="text-[11px] text-zinc-600">
                        {activeComparisonTab === 0
                          ? "Desktop app · Install required"
                          : activeComparisonTab === 1
                            ? "Web UI · Minimal features"
                            : "Professional IDE · Paid"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-extrabold tabular-nums text-zinc-500">
                      {COMPARISON_ROWS.filter((r) =>
                        activeComparisonTab === 0
                          ? r.compass === "yes"
                          : activeComparisonTab === 1
                            ? r.mongoExpress === "yes"
                            : r.studio3t === "yes"
                      ).length}
                      <span className="text-sm font-normal text-zinc-700">
                        /{COMPARISON_ROWS.length}
                      </span>
                    </p>
                    <p className="text-[10px] text-zinc-600">features</p>
                  </div>
                </div>
                <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-zinc-600 transition-all duration-500"
                    style={{
                      width: `${
                        (COMPARISON_ROWS.filter((r) =>
                          activeComparisonTab === 0
                            ? r.compass === "yes"
                            : activeComparisonTab === 1
                              ? r.mongoExpress === "yes"
                              : r.studio3t === "yes"
                        ).length /
                          COMPARISON_ROWS.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Feature rows */}
              <div className="divide-y divide-white/[0.03]">
                {COMPARISON_ROWS.map((row) => {
                  const competitorVal = (
                    activeComparisonTab === 0
                      ? row.compass
                      : activeComparisonTab === 1
                        ? row.mongoExpress
                        : row.studio3t
                  ) as ComparisonValue;
                  return (
                    <div
                      key={row.feature}
                      className="flex items-center justify-between px-6 py-2.5 transition-colors hover:bg-white/[0.01]"
                    >
                      <span className="text-xs text-zinc-400">{row.feature}</span>
                      {competitorVal === "yes" ? (
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                          <Check size={10} className="text-emerald-400" />
                        </span>
                      ) : competitorVal === "no" ? (
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 ring-1 ring-white/[0.04]">
                          <X size={10} className="text-zinc-600" />
                        </span>
                      ) : competitorVal === "partial" ? (
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
                          <Minus size={10} className="text-amber-400/70" />
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">{competitorVal as string}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-4 px-1">
            {[
              {
                icon: <Check size={9} className="text-emerald-400" />,
                bg: "bg-emerald-500/10 ring-emerald-500/20",
                label: "Full support",
              },
              {
                icon: <Minus size={9} className="text-amber-400/70" />,
                bg: "bg-amber-500/10 ring-amber-500/20",
                label: "Partial / limited",
              },
              {
                icon: <X size={9} className="text-zinc-600" />,
                bg: "bg-zinc-800/60 ring-white/[0.04]",
                label: "Not supported",
              },
            ].map(({ icon, bg, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ring-1 ${bg}`}>
                  {icon}
                </span>
                <span className="text-xs text-zinc-500">{label}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Bottom CTA */}
        <AnimatedSection delay={0.2} className="mt-8">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/40">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(39,39,42,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(39,39,42,0.4)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-teal-500/[0.04]" />
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/[0.08] blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-10 right-10 h-48 w-48 rounded-full bg-teal-500/[0.06] blur-[60px]" />

            <div className="relative p-8 md:p-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3.5 py-1">
                    <Code2 size={12} className="text-emerald-400" />
                    <span className="text-[12px] font-semibold text-emerald-400">
                      Built for developers
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight text-zinc-100 md:text-3xl">
                    Designed for developers,
                    <br />
                    <span className="text-zinc-400">not database admins</span>
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                    Compooss gives you exactly the features you need during
                    development — browse data, debug queries, inspect schemas —
                    without the complexity of enterprise-grade tools you&apos;ll
                    never use locally.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  <a
                    href="#installation"
                    className="group flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
                  >
                    Get Started Free
                    <ArrowRight
                      size={15}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </a>
                  <a
                    href="https://github.com/abdullahmia/compooss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-800/50 px-6 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
                  >
                    <Code2 size={15} />
                    View on GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
