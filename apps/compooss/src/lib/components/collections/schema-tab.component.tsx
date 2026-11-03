"use client";

import { Badge, EmptyState, IconButton } from "@compooss/ui";
import { useAnalyzeSchema } from "@/lib/services/schema/schema.service";
import { SCHEMA_QUERY_KEYS } from "@/lib/services/schema/schema-query.key";
import { SCHEMA_SAMPLE_SIZES, TYPE_COLORS, VALUE_PALETTE } from "@/lib/constants";
import type { SchemaAnalysisResult, SchemaField } from "@compooss/types";
import {
  ChevronRight,
  Grid3X3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useCollectionScope } from "@/lib/providers/collection-scope";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? "var(--color-muted-foreground)";
}

function TypeBar({ type, percentage }: { type: string; percentage: number }) {
  return (
    <div className="flex items-center gap-2 h-5">
      <span className="text-[11px] text-muted-foreground w-16 shrink-0 truncate">
        {type.toLowerCase()}
      </span>
      <div className="flex-1 h-[5px] bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, percentage)}%`,
            backgroundColor: getTypeColor(type),
          }}
        />
      </div>
    </div>
  );
}

function ValueChips({
  values,
}: {
  values: { value: string; count: number }[];
}) {
  const display = values.slice(0, 5);
  return (
    <div className="flex flex-wrap gap-1.5 justify-end">
      {display.map((v, i) => (
        <span
          key={`${v.value}-${i}`}
          className="inline-flex items-center rounded bg-secondary px-2 py-0.5 font-mono text-[11px] text-foreground truncate"
          style={{ maxWidth: "160px" }}
          title={`${v.value} (${v.count})`}
        >
          {v.value}
        </span>
      ))}
      {values.length > 5 && (
        <span className="text-[10px] text-muted-foreground self-center">
          +{values.length - 5}
        </span>
      )}
    </div>
  );
}

function ValueDistributionBar({
  values,
  total,
}: {
  values: { value: string; count: number }[];
  total: number;
}) {
  if (total === 0) return null;
  return (
    <div className="mt-3">
      <div className="flex h-6 w-full overflow-hidden rounded">
        {values.map((v, i) => {
          const width = (v.count / total) * 100;
          return (
            <div
              key={v.value}
              className="flex items-center justify-center text-[10px] text-white font-medium overflow-hidden shrink-0"
              style={{
                width: `${width}%`,
                minWidth: width > 0 ? "2px" : 0,
                backgroundColor: VALUE_PALETTE[i % VALUE_PALETTE.length],
              }}
              title={`${v.value}: ${v.count}`}
            >
              {width > 10 ? v.value : ""}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
        {values.slice(0, 10).map((v, i) => (
          <div key={v.value} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{
                backgroundColor: VALUE_PALETTE[i % VALUE_PALETTE.length],
              }}
            />
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              {v.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldCard({
  field,
  sampleSize,
  expanded,
  onToggle,
  depth,
}: {
  field: SchemaField;
  sampleSize: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  depth: number;
}) {
  const primaryType = field.types[0]?.type;
  const isObject = primaryType === "Object";
  const isArray = primaryType === "Array";

  const elementChild = field.children?.find((c) => c.name === "[]");
  const nestedChildren = field.children?.filter((c) => c.name !== "[]") ?? [];
  const hasExpandableChildren = nestedChildren.length > 0;
  const isExpanded = expanded.has(field.path);
  const nestedFieldCount = nestedChildren.length;

  const stringType = field.types.find((t) => t.type === "String");
  const showDistribution =
    stringType &&
    field.uniqueCount != null &&
    field.uniqueCount > 1 &&
    field.uniqueCount <= 20 &&
    stringType.values?.some((v) => v.count > 1);

  const showChips =
    stringType &&
    !showDistribution &&
    stringType.values &&
    stringType.values.length > 0;

  const fieldPct =
    sampleSize > 0
      ? Math.min(100, Math.round((field.count / sampleSize) * 100))
      : 0;
  const isUndefinedInSome = fieldPct < 100;

  return (
    <>
      <div
        className="border border-border rounded-lg bg-card/50 px-5 py-4 transition-colors hover:bg-card/80"
        style={{ marginLeft: depth * 24 }}
      >
        <div className="flex items-start gap-4 mb-3">
          <div className="flex items-center gap-1.5 shrink-0">
            {hasExpandableChildren && (
              <IconButton
                variant="default"
                size="sm"
                icon={
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                }
                label={isExpanded ? "Collapse" : "Expand"}
                className="shrink-0"
                onClick={() => onToggle(field.path)}
              />
            )}
            <h3 className="font-semibold text-base text-foreground whitespace-nowrap">
              {field.name}
            </h3>
            {field.hasMultipleTypes && (
              <Badge variant="warning" size="sm">
                mixed
              </Badge>
            )}
          </div>

          <div className="flex-1 min-w-0 flex justify-end overflow-hidden">
            {primaryType === "ObjectId" && field.objectIdDates && (
              <div className="text-right text-[11px] text-muted-foreground shrink-0">
                <div>
                  first:{" "}
                  <span className="text-foreground font-mono">
                    {new Date(field.objectIdDates.first).toLocaleString()}
                  </span>
                </div>
                <div>
                  last:{" "}
                  <span className="text-foreground font-mono">
                    {new Date(field.objectIdDates.last).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {isObject && (
              <span className="text-sm text-muted-foreground shrink-0">
                Document with {nestedFieldCount} nested field
                {nestedFieldCount === 1 ? "" : "s"}.
              </span>
            )}

            {isArray && field.arrayStats && (
              <div className="text-right text-[11px] shrink-0">
                <div className="text-muted-foreground font-medium">
                  Array lengths
                </div>
                <div className="text-muted-foreground">
                  min:{" "}
                  <span className="text-foreground font-mono">
                    {field.arrayStats.minLength}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  average:{" "}
                  <span className="text-foreground font-mono">
                    {field.arrayStats.avgLength}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  max:{" "}
                  <span className="text-foreground font-mono">
                    {field.arrayStats.maxLength}
                  </span>
                </div>
              </div>
            )}

            {showChips && stringType.values && (
              <ValueChips values={stringType.values} />
            )}
          </div>
        </div>

        <div className="space-y-1">
          {field.types.map((t) => (
            <TypeBar
              key={t.type}
              type={t.type}
              percentage={sampleSize > 0 ? (t.count / sampleSize) * 100 : 0}
            />
          ))}
          {elementChild &&
            elementChild.types.map((t) => (
              <TypeBar
                key={`el-${t.type}`}
                type={t.type}
                percentage={
                  elementChild.count > 0
                    ? (t.count / elementChild.count) * 100
                    : 0
                }
              />
            ))}
        </div>

        {isUndefinedInSome && (
          <div className="flex items-center gap-2 mt-1">
            <span className="w-16 shrink-0" />
            <span className="text-[10px] text-muted-foreground/50">
              undefined
            </span>
          </div>
        )}

        {showDistribution && stringType?.values && (
          <ValueDistributionBar
            values={stringType.values}
            total={stringType.count}
          />
        )}
      </div>

      {isExpanded &&
        nestedChildren.map((child) => (
          <FieldCard
            key={child.path}
            field={child}
            sampleSize={sampleSize}
            expanded={expanded}
            onToggle={onToggle}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

export const SchemaTab: React.FC = () => {
  const { dbName, collectionName } = useCollectionScope();
  const queryClient = useQueryClient();

  const [sampleSize, setSampleSize] = useState(1000);
  const [result, setResult] = useState<SchemaAnalysisResult | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const analyze = useAnalyzeSchema(dbName, collectionName, {
    onSuccess: (data) => setResult(data),
  });

  useEffect(() => {
    const cached = queryClient.getQueryData<SchemaAnalysisResult>(
      SCHEMA_QUERY_KEYS.all(dbName, collectionName),
    );
    if (cached) {
      queueMicrotask(() => setResult(cached));
    }
  }, [dbName, collectionName, queryClient]);

  const runAnalysis = useCallback(() => {
    analyze.mutate({ sampleSize }, { onSuccess: (data) => setResult(data) });
  }, [analyze, sampleSize]);

  const toggleExpand = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const displayFields = useMemo(() => {
    if (!result) return [];
    return result.fields.filter((f) => f.name !== "[]");
  }, [result]);

  if (!dbName || !collectionName) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground text-sm">
        Missing database or collection.
      </div>
    );
  }

  const hasResult = result !== null && result.sampleSize > 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card/30">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Sample size
            <select
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              className="h-8 rounded border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SCHEMA_SAMPLE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {hasResult && (
            <IconButton
              variant="default"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              label="Refresh"
              onClick={runAnalysis}
              disabled={analyze.isPending}
            />
          )}
        </div>
        {hasResult && result && (
          <div className="text-xs text-muted-foreground">
            {displayFields.length} field
            {displayFields.length === 1 ? "" : "s"} from{" "}
            {result.sampleSize.toLocaleString()} sampled docs
            {result.totalDocuments !== result.sampleSize &&
              ` (${result.totalDocuments.toLocaleString()} total)`}
            {" · "}
            {new Date(result.analyzedAt).toLocaleString()}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {analyze.isPending && !hasResult && (
          <div className="flex flex-col items-center justify-center min-h-[280px] gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing schema...</p>
          </div>
        )}

        {!hasResult && !analyze.isPending && (
          <div className="flex flex-1 items-center justify-center min-h-[280px]">
            <EmptyState
              icon={<Grid3X3 className="h-12 w-12 text-muted-foreground" />}
              title="Analyze schema"
              description="Sample documents from this collection to detect fields, types, frequency, and value distributions."
              primaryAction={{
                label: "Run schema analysis",
                onClick: runAnalysis,
              }}
            />
          </div>
        )}

        {hasResult && result && displayFields.length > 0 && (
          <div className="space-y-3">
            {displayFields.map((f) => (
              <FieldCard
                key={f.path}
                field={f}
                sampleSize={result.sampleSize}
                expanded={expanded}
                onToggle={toggleExpand}
                depth={0}
              />
            ))}
          </div>
        )}

        {hasResult && result && displayFields.length === 0 && (
          <EmptyState
            icon={<Grid3X3 className="h-12 w-12 text-muted-foreground" />}
            title="No fields detected"
            description="The sampled documents have no enumerable top-level keys, or the sample was empty."
            primaryAction={{
              label: "Run again",
              onClick: runAnalysis,
            }}
          />
        )}
      </div>
    </div>
  );
};
