import { SectionHeader } from "@/components/section-header";
import { CORE_FEATURES } from "@/lib/constants/landing.constants";

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-12 md:py-16">
      <div className="mx-auto grid max-w-[1200px] items-start gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16 lg:px-8">
        <SectionHeader
          namespace="features"
          title="A complete MongoDB GUI inside your Docker stack"
          description="A visual MongoDB client that fits into any Docker Compose workflow, or runs as a desktop app. No cloud services and nothing to set up."
          className="lg:sticky lg:top-24"
        />

        <div className="grid gap-x-12 sm:grid-cols-2">
          {CORE_FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="grid grid-cols-[32px_minmax(0,1fr)] border-t border-line pb-6 pt-5 sm:block sm:pb-10 sm:pt-6"
            >
              {/* Centred on the title's 24px line on phones, above it from sm up. */}
              <Icon size={18} strokeWidth={1.5} className="mt-[3px] text-fg-muted sm:mt-0" />
              <div>
                <h3 className="text-base font-medium leading-6 text-fg sm:mt-4">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-secondary">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
