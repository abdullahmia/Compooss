"use client";

import { AnimatedSection } from "@/components/animated-section";
import { FeatureCard } from "@/components/feature-card";
import { CORE_FEATURES } from "@/lib/constants/landing.constants";

export const Features: React.FC = () => {
  return (
    <section id="features" className="relative py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedSection className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Features
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            A complete MongoDB management
            <br />
            tool inside your Docker stack
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Compooss gives developers a fast, visual MongoDB client that fits
            into any Docker Compose workflow or runs as a desktop app — no
            cloud services, no complex setup.
          </p>
        </AnimatedSection>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} index={i} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};
