"use client";

import { DEFAULT_LIMIT } from "@/lib/constants";
import { isEmptyObjectString } from "@/lib/hooks/use-query-history.hook";
import type { QueryBarValues, QueryHistoryEntry, SavedQuery } from "@compooss/types";
import { cn, IconButton } from "@compooss/ui";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  savedQueries: SavedQuery[];
  history: QueryHistoryEntry[];
  onApply: (query: QueryBarValues) => void;
  onSaveRequest: (query: QueryBarValues) => void;
  onDeleteSaved: (id: string) => void;
  onClearHistory: () => void;
};

/** The non-default options of a query, shown as small chips under the filter. */
function optionChips(query: QueryBarValues): string[] {
  const chips: string[] = [];
  if (!isEmptyObjectString(query.project)) chips.push(`project ${query.project}`);
  if (!isEmptyObjectString(query.sort)) chips.push(`sort ${query.sort}`);
  if (query.limit !== DEFAULT_LIMIT) chips.push(`limit ${query.limit}`);
  if (query.skip > 0) chips.push(`skip ${query.skip}`);
  return chips;
}

const QueryRow: React.FC<{
  title: string;
  query: QueryBarValues;
  onApply: () => void;
  action: React.ReactNode;
}> = ({ title, query, onApply, action }) => (
  <div className="group/row flex items-start gap-1 px-2 py-1.5 rounded-sm hover:bg-secondary">
    <button type="button" onClick={onApply} className="flex-1 min-w-0 text-left">
      <span className="block text-[11px] text-muted-foreground">{title}</span>
      <code className="block text-xs font-mono text-foreground truncate">
        {isEmptyObjectString(query.filter) ? "{ }" : query.filter}
      </code>
      {optionChips(query).length > 0 && (
        <span className="flex flex-wrap gap-1 mt-1">
          {optionChips(query).map((chip) => (
            <span
              key={chip}
              className="text-[10px] font-mono px-1.5 py-px rounded-sm bg-muted/60 text-muted-foreground max-w-full truncate"
            >
              {chip}
            </span>
          ))}
        </span>
      )}
    </button>
    <div className="opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
      {action}
    </div>
  </div>
);

export const QueryHistoryPanel: React.FC<Props> = ({
  savedQueries,
  history,
  onApply,
  onSaveRequest,
  onDeleteSaved,
  onClearHistory,
}) => {
  const [tab, setTab] = useState<"saved" | "recent">(
    savedQueries.length > 0 ? "saved" : "recent",
  );

  const tabs = [
    { id: "saved" as const, label: `Saved (${savedQueries.length})` },
    { id: "recent" as const, label: `Recent (${history.length})` },
  ];

  return (
    <div className="w-[420px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-md shadow-xl">
      <div className="flex items-center gap-1 px-2 pt-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "text-xs px-2.5 py-1.5 -mb-px border-b-2 transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
        {tab === "recent" && history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="ml-auto text-[11px] text-muted-foreground hover:text-foreground px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto scrollbar-thin p-1">
        {tab === "saved" &&
          (savedQueries.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-6 text-center">
              No saved queries yet. Use the bookmark button to save the current
              query, or save one from Recent.
            </p>
          ) : (
            savedQueries.map((query) => (
              <QueryRow
                key={query.id}
                title={query.name}
                query={query}
                onApply={() => onApply(query)}
                action={
                  <IconButton
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="h-3 w-3" />}
                    label="Delete saved query"
                    onClick={() => onDeleteSaved(query.id)}
                  />
                }
              />
            ))
          ))}

        {tab === "recent" &&
          (history.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-6 text-center">
              Queries you run on this collection will appear here.
            </p>
          ) : (
            history.map((entry) => (
              <QueryRow
                key={entry.id}
                title={formatDistanceToNow(new Date(entry.executedAt), { addSuffix: true })}
                query={entry}
                onApply={() => onApply(entry)}
                action={
                  <IconButton
                    variant="toolbar"
                    size="sm"
                    icon={<Bookmark className="h-3 w-3" />}
                    label="Save query"
                    onClick={() => onSaveRequest(entry)}
                  />
                }
              />
            ))
          ))}
      </div>
    </div>
  );
};
