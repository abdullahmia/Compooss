import { LinkButton } from "@/components/link-button";
import { AppPreview } from "./app-preview.component";

export const Hero: React.FC = () => {
  return (
    <section className="pb-12 pt-12 md:pb-20 md:pt-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:gap-16">
          <h1 className="rise text-[40px] font-medium leading-[1.06] tracking-[-0.03em] text-fg md:text-[56px]">
            Open-source MongoDB GUI{" "}
            <br className="hidden sm:block" />
            for Docker Compose
          </h1>

          <div className="rise [--rise-step:1]">
            <p className="text-lg leading-7 text-fg-secondary">
              One container next to your database. Browse collections, run
              queries and edit documents at{" "}
              <code className="font-mono text-base text-fg">localhost:6969</code>,
              with no account and no cloud.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="#installation" size="lg">
                Install with Docker
              </LinkButton>
              <LinkButton href="#download" size="lg" variant="secondary">
                Desktop app
              </LinkButton>
            </div>
          </div>
        </div>

        <div className="rise mt-12 [--rise-step:2] md:mt-20">
          <AppPreview />
        </div>
      </div>
    </section>
  );
};
