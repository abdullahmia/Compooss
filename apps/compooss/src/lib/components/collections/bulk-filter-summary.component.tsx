"use client";

import { isEmptyObjectString } from "@/lib/hooks/use-query-history.hook";
import { AlertTriangle, Loader2 } from "lucide-react";

type Props = {
  filter: string;
  matchedCount: number | undefined;
  isLoading: boolean;
  error: string | null;
};

/** Shows which filter a bulk operation uses and how many documents it will affect. */
export const BulkFilterSummary: React.FC<Props> = ({
  filter,
  matchedCount,
  isLoading,
  error,
}) => {
  const matchesEverything = isEmptyObjectString(filter);

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">
          Filter (from the query bar)
        </p>
        <pre className="text-xs font-mono text-foreground bg-secondary rounded-sm border border-border px-3 py-2 whitespace-pre-wrap break-all max-h-28 overflow-auto">
          {matchesEverything ? "{ }" : filter}
        </pre>
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : isLoading || matchedCount === undefined ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" /> Counting matching documents…
        </p>
      ) : (
        <p className="text-sm text-foreground">
          This will affect{" "}
          <strong>
            {matchedCount.toLocaleString()} document{matchedCount === 1 ? "" : "s"}
          </strong>
          .
        </p>
      )}

      {matchesEverything && !error && (
        <div className="flex items-start gap-2 text-xs px-3 py-2.5 rounded-sm border bg-warning/10 text-warning border-warning/20">
          <AlertTriangle className="h-3.5 w-3.5 mt-px shrink-0" />
          <span>The filter is empty, so this applies to every document in the collection.</span>
        </div>
      )}
    </div>
  );
};
