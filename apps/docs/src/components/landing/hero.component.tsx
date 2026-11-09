import { LinkButton } from "@/components/link-button";
import { GITHUB_URL } from "@/lib/constants/landing.constants";
import { ArrowRight } from "lucide-react";
import { AppPreview } from "./app-preview.component";
import { LeafScene } from "./leaf-scene.component";

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pb-12 pt-8 md:pb-20 lg:pt-4">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center px-4 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:px-8">
        <div className="relative z-10 pt-4 lg:pt-0">
          <a
            href="#download"
            className="rise group inline-flex items-center gap-2 text-sm text-fg-secondary transition-colors duration-150 ease-out hover:text-fg"
          >
            <span>
              Now also a desktop app
              <span className="hidden sm:inline"> for macOS, Windows and Linux</span>
            </span>
            <ArrowRight
              size={16}
              strokeWidth={1.5}
              className="text-fg-muted transition-transform duration-150 ease-out group-hover:translate-x-0.5"
            />
          </a>

          <h1 className="rise mt-6 max-w-[11em] text-balance text-[44px] font-medium leading-[1.02] tracking-[-0.035em] text-fg [--rise-step:1] md:text-[64px] xl:text-[72px]">
            The MongoDB GUI that lives in your compose file
          </h1>

          <p className="rise mt-6 max-w-[34rem] text-pretty text-lg leading-7 text-fg-secondary [--rise-step:2]">
            Add one service next to MongoDB, open{" "}
            <code className="font-mono text-base text-fg">localhost:6969</code>{" "}
            and browse collections, run queries and edit documents. Free, open
            source and no account needed.
          </p>

          <div className="rise mt-8 flex flex-wrap gap-3 [--rise-step:3]">
            <LinkButton href="#installation" size="lg">
              Install with Docker
            </LinkButton>
            <LinkButton href={GITHUB_URL} size="lg" variant="secondary" external>
              View on GitHub
            </LinkButton>
          </div>
        </div>

        {/* The scene is wider than its column and runs past the container edge. */}
        <LeafScene className="rise mx-auto mt-8 w-full max-w-[480px] [--rise-step:2] lg:mx-0 lg:mt-0 lg:w-[560px] lg:max-w-none xl:w-[680px]" />
      </div>

      {/* The product rises from the bottom of the scene and runs past the fold. */}
      <div className="relative z-10 mx-auto -mt-16 max-w-[1200px] px-4 sm:px-6 lg:-mt-12 lg:px-8">
        <div className="rise [--rise-step:4]">
          <AppPreview />
        </div>
      </div>
    </section>
  );
};
