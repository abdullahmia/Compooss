import { LinkButton } from "@/components/link-button";
import { SectionHeader } from "@/components/section-header";
import { GITHUB_URL, WHY_REASONS } from "@/lib/constants/landing.constants";
import { ComparisonTable } from "./comparison-table.component";

export const Why: React.FC = () => {
  return (
    <section id="why-compooss" className="py-12 md:py-16">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <SectionHeader
            namespace="why"
            title="Built for the MongoDB in your dev stack"
            description="Most MongoDB GUIs need an install, a config and often a paid license. Compooss runs as a container in your Compose stack, and as a free desktop app when you'd rather not run one."
          />

          <dl className="border-b border-line lg:mt-8">
            {WHY_REASONS.map((reason) => (
              <div
                key={reason.title}
                className="grid gap-1 border-t border-line py-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-8"
              >
                <dt className="text-base font-medium text-fg">{reason.title}</dt>
                <dd className="text-sm leading-6 text-fg-secondary">
                  {reason.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-16 md:mt-20">
          <h3 className="text-xl font-medium text-fg">Feature comparison</h3>
          <p className="mt-1 text-sm text-fg-muted">
            Compooss and the alternatives, feature by feature
          </p>

          <ComparisonTable />
        </div>

        <div className="mt-16 flex flex-col gap-8 rounded-2xl border border-line bg-card p-6 md:mt-20 md:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h3 className="text-2xl font-medium leading-8 tracking-[-0.01em] text-fg">
              Designed for developers, not database admins
            </h3>
            <p className="mt-3 text-base leading-7 text-fg-secondary">
              Compooss has what you need while you develop: browse data, debug
              queries and inspect schemas, without the weight of enterprise
              tools you&apos;ll never use locally.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <LinkButton href="#installation" size="lg">
              Get started
            </LinkButton>
            <LinkButton href={GITHUB_URL} size="lg" variant="secondary" external>
              View on GitHub
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
};
