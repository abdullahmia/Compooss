import { SectionHeader } from "@/components/section-header";
import { USAGE_STEPS } from "@/lib/constants/landing.constants";
import { OperationsList } from "./operations-list.component";

export const Usage: React.FC = () => {
  return (
    <section id="usage" className="py-12 md:py-16">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          namespace="usage"
          title="From zero to a MongoDB GUI in three steps"
          description="No signup, no cloud dependency and no setup wizard. Compooss connects straight to your MongoDB over your Docker network."
        />

        <ol className="mt-12 grid gap-x-12 md:grid-cols-3">
          {USAGE_STEPS.map((step) => (
            <li
              key={step.step}
              className="grid grid-cols-[32px_minmax(0,1fr)] border-t border-line pb-6 pt-5 md:block md:pb-8 md:pt-6"
            >
              <span className="font-mono text-xs leading-6 tabular-nums text-fg-muted">
                {step.step}
              </span>
              <div>
                <h3 className="text-base font-medium text-fg md:mt-4">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-secondary">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-2xl border border-line bg-card p-6 md:mt-16 md:p-10">
          <h3 className="text-xl font-medium text-fg">
            MongoDB operations you can perform
          </h3>
          <OperationsList />
        </div>
      </div>
    </section>
  );
};
