"use client";

import { useGetDatabases } from "@/lib/services/database/database.service";
import { useProfiler, useSetProfilingLevel } from "@/lib/services/server/server.service";
import { getApiErrorMessage } from "@/lib/utils/api-error.util";
import type { ProfilingLevel } from "@compooss/types";
import { isProtectedDatabase } from "@compooss/types";
import { Button, cn, Input } from "@compooss/ui";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  connection: string;
  paused: boolean;
  readOnly: boolean;
};

const LEVELS: { value: ProfilingLevel; label: string }[] = [
  { value: 0, label: "Off" },
  { value: 1, label: "Slow only" },
  { value: 2, label: "All" },
];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export const SlowQueries: React.FC<Props> = ({ connection, paused, readOnly }) => {
  const { data: databases = [] } = useGetDatabases();
  const userDatabases = databases.filter((db) => !isProtectedDatabase(db.name));
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const dbName = selectedDb ?? userDatabases[0]?.name ?? "";

  const profiler = useProfiler(connection, dbName, paused);
  // Draft settings; null means "use what the server reports".
  const [draftLevel, setDraftLevel] = useState<ProfilingLevel | null>(null);
  const [draftSlowms, setDraftSlowms] = useState<string | null>(null);
  const level = draftLevel ?? profiler.data?.level ?? 0;
  const slowms = draftSlowms ?? String(profiler.data?.slowms ?? 100);

  const { mutate: setProfilingLevel, isPending } = useSetProfilingLevel(connection, {
    onSuccess: () => {
      toast.success(`Profiling updated for ${dbName}`);
      setDraftLevel(null);
      setDraftSlowms(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not change profiling.")),
  });

  const isDirty =
    profiler.data !== undefined &&
    (level !== profiler.data.level || Number(slowms) !== profiler.data.slowms);

  const handleSelectDb = (name: string) => {
    setSelectedDb(name);
    setDraftLevel(null);
    setDraftSlowms(null);
  };

  return (
    <section className="border border-border rounded-lg bg-card min-w-0">
      <header className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h3 className="text-sm font-semibold text-foreground">Slow queries</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Recent operations recorded by the database profiler.
          </p>
        </div>

        <select
          aria-label="Database"
          value={dbName}
          onChange={(e) => handleSelectDb(e.target.value)}
          className="bg-secondary text-xs px-2 py-1.5 rounded-sm border border-border"
        >
          {userDatabases.length === 0 && <option value="">No databases</option>}
          {userDatabases.map((db) => (
            <option key={db.name} value={db.name}>
              {db.name}
            </option>
          ))}
        </select>

        {readOnly ? (
          <span className="text-xs text-muted-foreground">
            Profiling: {LEVELS.find((l) => l.value === (profiler.data?.level ?? 0))?.label}
            {profiler.data?.level === 1 && ` (> ${profiler.data.slowms} ms)`}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex rounded-sm border border-border overflow-hidden" role="radiogroup" aria-label="Profiling level">
              {LEVELS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={level === option.value}
                  onClick={() => setDraftLevel(option.value)}
                  className={cn(
                    "text-xs px-2.5 py-1.5 transition-colors",
                    level === option.value
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {level === 1 && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                slower than
                <Input
                  variant="mono"
                  className="w-16 px-2 py-1"
                  inputMode="numeric"
                  value={slowms}
                  onChange={(e) => setDraftSlowms(e.target.value.replace(/\D/g, ""))}
                  aria-label="Slow operation threshold in milliseconds"
                />
                ms
              </label>
            )}
            <Button
              variant="primary"
              size="sm"
              disabled={!isDirty || isPending || !dbName}
              loading={isPending}
              onClick={() =>
                setProfilingLevel({ db: dbName, level, slowms: Number(slowms) || 0 })
              }
            >
              Apply
            </Button>
          </div>
        )}
      </header>

      {level === 2 && !readOnly && (
        <p className="px-4 py-2 text-[11px] text-warning border-b border-border">
          Recording every operation adds load to the server. Turn it back down when you&apos;re done.
        </p>
      )}

      {profiler.isError ? (
        <p className="px-4 py-6 text-xs text-destructive">
          {getApiErrorMessage(profiler.error, "Could not read the profiler.")}
        </p>
      ) : !profiler.data ? (
        <p className="px-4 py-6 text-xs text-muted-foreground">
          {dbName ? "Loading…" : "Create a database to profile it."}
        </p>
      ) : profiler.data.entries.length === 0 ? (
        <p className="px-4 py-6 text-xs text-muted-foreground">
          {profiler.data.level === 0
            ? `Profiling is off for ${dbName}. Turn it on to record slow operations.`
            : "No operations recorded yet."}
        </p>
      ) : (
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Op</th>
                <th className="px-4 py-2 font-medium">Namespace</th>
                <th className="px-4 py-2 font-medium text-right">Duration</th>
                <th className="px-4 py-2 font-medium">Plan</th>
                <th className="px-4 py-2 font-medium text-right">Docs / keys examined</th>
                <th className="px-4 py-2 font-medium text-right">Returned</th>
                <th className="px-4 py-2 font-medium">Command</th>
              </tr>
            </thead>
            <tbody>
              {profiler.data.entries.map((entry, i) => (
                <tr key={`${entry.ts}-${i}`} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatTime(entry.ts)}
                  </td>
                  <td className="px-4 py-2">{entry.op}</td>
                  <td className="px-4 py-2 font-mono">{entry.ns}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">{entry.millis} ms</td>
                  <td className="px-4 py-2 font-mono text-[11px]">
                    {entry.planSummary ?? "–"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {entry.docsExamined ?? "–"} / {entry.keysExamined ?? "–"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{entry.nreturned ?? "–"}</td>
                  <td className="px-4 py-2 max-w-[320px]">
                    <code className="block font-mono text-[11px] text-muted-foreground truncate" title={entry.command}>
                      {entry.command}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
