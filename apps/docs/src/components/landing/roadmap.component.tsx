"use client";

import { AnimatedSection } from "@/components/animated-section";
import { ArrowUpDown, Check } from "lucide-react";

export const Roadmap: React.FC = () => {
  const items = [
    {
      icon: <ArrowUpDown size={18} />,
      title: "Data Export & Import",
      description:
        "Export collections to JSON or CSV with optional filter and document limit. JSON exports support three Extended JSON modes — Default (legacy v1), Relaxed, and Canonical — to preserve BSON types like ObjectId, Long, Decimal128, and Dates. Import from JSON arrays or CSV with drag-and-drop, live preview, and per-row error reporting.",
      status: "Shipped",
      statusColor: "shipped",
    },
  ];

  return (
    <section id="roadmap" className="relative py-16 md:py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />
      <div className="relative mx-auto max-w-6xl px-6">
        <AnimatedSection className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Roadmap
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            What&apos;s coming next
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Compooss is actively maintained. Here&apos;s what we&apos;re
            building next.
          </p>
        </AnimatedSection>

        <div className="relative mx-auto max-w-3xl">
          <div className="absolute bottom-0 left-6 top-0 w-px bg-gradient-to-b from-emerald-500/40 via-emerald-500/20 to-transparent md:left-1/2 md:-translate-x-px" />

          {items.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 0.1}>
              <div
                className={`relative mb-10 flex items-start gap-6 last:mb-0 md:gap-10 ${
                  i % 2 === 0
                    ? "md:flex-row-reverse md:text-right"
                    : "md:flex-row"
                }`}
              >
                <div className="absolute left-6 top-3 z-10 md:left-1/2">
                  <div className="flex h-3 w-3 -translate-x-1/2 items-center justify-center">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        item.statusColor === "shipped"
                          ? "bg-emerald-400"
                          : item.statusColor === "emerald"
                            ? "bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.4)]"
                            : "border-2 border-zinc-600 bg-zinc-900"
                      }`}
                    />
                  </div>
                </div>

                <div className="w-12 shrink-0 md:hidden" />

                <div
                  className={`group flex-1 md:w-[calc(50%-2.5rem)] ${
                    i % 2 === 0 ? "md:pr-10" : "md:pl-10"
                  }`}
                >
                  <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5 transition-all hover:border-emerald-500/20 hover:bg-zinc-900/80">
                    <div
                      className={`mb-3 flex items-center gap-3 ${
                        i % 2 === 0 ? "md:flex-row-reverse" : ""
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[15px] font-semibold text-zinc-100">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-400">
                      {item.description}
                    </p>
                    <div
                      className={`mt-3 flex ${
                        i % 2 === 0 ? "md:justify-end" : ""
                      }`}
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.statusColor === "shipped"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : item.statusColor === "emerald"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {item.statusColor === "shipped" && (
                          <Check size={10} strokeWidth={3} />
                        )}
                        {item.statusColor === "emerald" && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          </span>
                        )}
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden flex-1 md:block md:w-[calc(50%-2.5rem)]" />
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};
