"use client";

import { Badge, Checkbox } from "@compooss/ui";
import { Clock, Eye, Table } from "lucide-react";

export type ChecklistItem = {
  name: string;
  /** "collection", "timeseries" or "view". */
  type: string;
  detail: string;
  /** A short warning, e.g. that the collection already exists. */
  badge?: string;
};

type Props = {
  items: ChecklistItem[];
  /** Names left out. Tracking these rather than the selection keeps new items selected. */
  excluded: Set<string>;
  onChange: (excluded: Set<string>) => void;
};

export function CollectionTypeIcon({ type, className }: { type: string; className?: string }) {
  const Icon = type === "view" ? Eye : type === "timeseries" ? Clock : Table;
  return <Icon className={className} aria-hidden />;
}

export const CollectionChecklist: React.FC<Props> = ({ items, excluded, onChange }) => {
  const selectedCount = items.filter((item) => !excluded.has(item.name)).length;
  const allSelected = selectedCount === items.length;

  const toggle = (name: string) => {
    const next = new Set(excluded);
    if (!next.delete(name)) next.add(name);
    onChange(next);
  };

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <label className="flex cursor-pointer items-center gap-2.5 border-b border-border bg-muted/30 px-3 py-2 text-xs font-medium text-foreground">
        <Checkbox
          checked={allSelected}
          ref={(element) => {
            if (element) element.indeterminate = selectedCount > 0 && !allSelected;
          }}
          onChange={() => onChange(allSelected ? new Set(items.map((item) => item.name)) : new Set())}
        />
        Collections
        <span className="ml-auto font-normal text-muted-foreground">
          {selectedCount} of {items.length} selected
        </span>
      </label>
      <ul className="max-h-60 divide-y divide-border overflow-y-auto">
        {items.map((item) => (
          <li key={item.name}>
            <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-secondary/40">
              <Checkbox checked={!excluded.has(item.name)} onChange={() => toggle(item.name)} />
              <CollectionTypeIcon type={item.type} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate font-mono text-foreground">{item.name}</span>
              {item.badge && <Badge variant="warning">{item.badge}</Badge>}
              <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">{item.detail}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};
