"use client";

import { AnimatedSection } from "@/components/animated-section";
import { USAGE_STEPS } from "@/lib/constants/landing.constants";
import { Check } from "lucide-react";

export const Usage: React.FC = () => {
  return (
    <section id="usage" className="relative py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedSection className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            From zero to MongoDB GUI in three steps
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            No signup, no cloud dependency, no configuration wizards. Compooss
            connects directly to your MongoDB instance over your Docker
            network.
          </p>
        </AnimatedSection>

        <div className="grid gap-6 md:grid-cols-3">
          {USAGE_STEPS.map((step, i) => (
            <AnimatedSection key={step.step} delay={i * 0.15}>
              <div className="group relative h-full rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 transition-colors hover:border-emerald-500/20">
                <span className="font-mono text-4xl font-bold text-emerald-500/15 transition-colors group-hover:text-emerald-500/25">
                  {step.step}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-zinc-100">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {step.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.3} className="mt-16">
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-8 md:p-10">
            <h3 className="mb-6 text-xl font-bold text-zinc-100">
              MongoDB operations you can perform
            </h3>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Browse all databases & collections",
                "Create and drop databases",
                "Create and drop collections",
                "Query with MongoDB filter syntax",
                "Sort and paginate results",
                "View as list, JSON, or table",
                "Add new documents",
                "Edit documents inline",
                "Delete documents safely",
                "View collection stats",
                "Create and drop indexes",
                "Hide / unhide indexes",
                "View index usage statistics",
                "Analyze collection schema from samples",
                "View field types, frequency & value distributions",
                "Inspect nested fields and array structures",
                "Masked connection strings",
                "System DB read-only protection",
                "Build aggregation pipelines with stage templates",
                "Reorder, enable, and disable aggregation stages",
                "Preview results for individual aggregation stages",
                "Save and reload aggregation pipelines per collection",
                "Export aggregation JSON and backend-ready code",
                "Create MongoDB views directly from aggregation pipelines",
                "Run ad-hoc MongoDB shell commands in the browser",
                "Execute JavaScript queries with autocomplete",
                "Navigate command history and persist shell sessions",
                "Run CRUD, aggregation, and admin commands from the shell",
                "Access bulk operations and system collections",
                "Switch databases with 'use' and run server status commands",
                "Save and manage multiple connection profiles",
                "Test connections before saving",
                "Color-code and label connections for quick identification",
                "Switch between MongoDB deployments from the top bar",
                "Export collections to JSON or CSV with filter and limit",
                "Choose Default, Relaxed, or Canonical Extended JSON format",
                "Preserve BSON types (ObjectId, Long, Decimal128, Date) in exports",
                "Import documents from JSON arrays or CSV files",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <Check size={12} className="text-emerald-400" />
                  </div>
                  <span className="text-sm text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
