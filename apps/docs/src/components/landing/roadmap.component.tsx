import { SectionHeader } from "@/components/section-header";
import { DESKTOP_RELEASES_URL } from "@/lib/constants/landing.constants";
import { ArrowUpRight } from "lucide-react";

type RoadmapItem = {
  title: string;
  description: string;
  status: "shipped" | "building" | "planned";
};

const STATUS_LABELS: Record<RoadmapItem["status"], string> = {
  shipped: "Shipped",
  building: "In progress",
  planned: "Planned",
};

const ITEMS: RoadmapItem[] = [
  {
    title: "Data export and import",
    description:
      "Export collections to JSON or CSV with an optional filter and document limit. JSON exports support three Extended JSON modes, Default (legacy v1), Relaxed and Canonical, to keep BSON types like ObjectId, Long, Decimal128 and Date. Import from JSON arrays or CSV with drag and drop, a live preview and per-row error reporting.",
    status: "shipped",
  },
];

export const Roadmap: React.FC = () => {
  return (
    <section id="roadmap" className="py-12 md:py-16">
      <div className="mx-auto grid max-w-[1200px] items-start gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8">
        <div>
          <SectionHeader
            namespace="roadmap"
            title="Recently shipped"
            description="Compooss is actively maintained, and every release is published on GitHub."
          />
          <a
            href={DESKTOP_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm text-fg-secondary transition-colors duration-150 ease-out hover:text-fg"
          >
            All releases on GitHub
            <ArrowUpRight size={16} strokeWidth={1.5} />
          </a>
        </div>

        <ol className="border-b border-line lg:mt-8">
          {ITEMS.map((item) => (
            <li key={item.title} className="border-t border-line py-6">
              <p className="flex items-center gap-2 font-mono text-xs text-fg-muted">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    item.status === "shipped" ? "bg-accent" : "bg-fg-muted"
                  }`}
                />
                {STATUS_LABELS[item.status]}
              </p>
              <h3 className="mt-3 text-lg font-medium text-fg">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-fg-secondary">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
