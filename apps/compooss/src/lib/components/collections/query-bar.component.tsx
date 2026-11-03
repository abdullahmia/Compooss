"use client";

import {
  DEFAULT_FILTER,
  DEFAULT_LIMIT,
  DEFAULT_SKIP,
  QUERY_BAR_DEFAULT_STATE,
} from "@/lib/constants";
import { QueryHistoryPanel } from "@/lib/components/collections/query-history-panel.component";
import { SaveQueryModal } from "@/lib/components/collections/save-query-modal.component";
import {
  isDefaultQuery,
  isEmptyObjectString,
  useQueryHistory,
} from "@/lib/hooks/use-query-history.hook";
import type { QueryBarValues } from "@compooss/types";
import {
  Bookmark,
  Braces,
  History,
  Play,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, IconButton, Input } from "@compooss/ui";

export type QueryBarState = QueryBarValues;

type Props = {
  onRunQuery: (state: QueryBarState) => void;
  /** Recent and saved queries are kept per namespace, e.g. "db.collection". */
  historyNamespace: string;
  fieldSuggestions?: string[];
  /** Optional initial state (e.g. after reset from parent) */
  initialState?: Partial<QueryBarState>;
};

function getSuggestions(
  text: string,
  cursorPos: number,
  fieldSuggestions: string[],
  valueSuffix: string = ": ",
): string[] {
  if (!fieldSuggestions.length) return [];
  const beforeCursor = text.slice(0, cursorPos);
  const fieldMatch = beforeCursor.match(/[{,]\s*"?(\w*)$/);
  if (!fieldMatch) return [];
  const partial = fieldMatch[1].toLowerCase();
  return fieldSuggestions
    .filter((f) => f.toLowerCase().includes(partial) && f.toLowerCase() !== partial)
    .slice(0, 8);
}

export const QueryBar: React.FC<Props> = ({
  onRunQuery,
  historyNamespace,
  fieldSuggestions = [],
  initialState,
}) => {
  const [filter, setFilter] = useState(initialState?.filter ?? QUERY_BAR_DEFAULT_STATE.filter);
  const [project, setProject] = useState(initialState?.project ?? QUERY_BAR_DEFAULT_STATE.project);
  const [sort, setSort] = useState(initialState?.sort ?? QUERY_BAR_DEFAULT_STATE.sort);
  const [limit, setLimit] = useState(initialState?.limit ?? QUERY_BAR_DEFAULT_STATE.limit);
  const [skip, setSkip] = useState(initialState?.skip ?? QUERY_BAR_DEFAULT_STATE.skip);
  const [showOptions, setShowOptions] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [suggestionContext, setSuggestionContext] = useState<"filter" | "project" | "sort" | null>(null);

  const filterRef = useRef<HTMLInputElement>(null);
  const projectRef = useRef<HTMLInputElement>(null);
  const sortRef = useRef<HTMLInputElement>(null);

  const { history, savedQueries, recordQuery, saveQuery, deleteSavedQuery, clearHistory } =
    useQueryHistory(historyNamespace);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [queryToSave, setQueryToSave] = useState<QueryBarValues | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Close the history panel on an outside click or Escape.
  useEffect(() => {
    if (!historyOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (!historyRef.current?.contains(e.target as Node)) setHistoryOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHistoryOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [historyOpen]);

  const updateSuggestions = useCallback(
    (
      value: string,
      cursorPos: number,
      context: "filter" | "project" | "sort",
      inputRef: React.RefObject<HTMLInputElement | null>,
    ) => {
      const suffix = context === "filter" ? ": " : context === "sort" ? ": -1" : ": 1";
      const next = getSuggestions(value, cursorPos, fieldSuggestions, suffix);
      setSuggestions(next);
      setShowSuggestions(next.length > 0);
      setSelectedSuggestion(0);
      setSuggestionContext(next.length > 0 ? context : null);
    },
    [fieldSuggestions],
  );

  const handleFilterChange = useCallback(
    (value: string) => {
      setFilter(value);
      const cursorPos = filterRef.current?.selectionStart ?? value.length;
      updateSuggestions(value, cursorPos, "filter", filterRef);
    },
    [updateSuggestions],
  );

  const handleProjectChange = useCallback(
    (value: string) => {
      setProject(value);
      const cursorPos = projectRef.current?.selectionStart ?? value.length;
      updateSuggestions(value, cursorPos, "project", projectRef);
    },
    [updateSuggestions],
  );

  const handleSortChange = useCallback(
    (value: string) => {
      setSort(value);
      const cursorPos = sortRef.current?.selectionStart ?? value.length;
      updateSuggestions(value, cursorPos, "sort", sortRef);
    },
    [updateSuggestions],
  );

  const applySuggestion = useCallback(
    (field: string, context: "filter" | "project" | "sort") => {
      const suffix = context === "filter" ? ": " : context === "sort" ? ": -1" : ": 1";
      const insertion = `${field}${suffix}`;

      if (context === "filter") {
        const el = filterRef.current;
        const pos = el?.selectionStart ?? filter.length;
        const before = filter.slice(0, pos);
        const after = filter.slice(pos);
        const replaced = before.replace(/(\w*)$/, insertion);
        setFilter(replaced + after);
        setTimeout(() => el?.focus(), 0);
      } else if (context === "project") {
        const el = projectRef.current;
        const pos = el?.selectionStart ?? project.length;
        const before = project.slice(0, pos);
        const after = project.slice(pos);
        const replaced = before.replace(/(\w*)$/, insertion);
        setProject(replaced + after);
        setTimeout(() => el?.focus(), 0);
      } else {
        const el = sortRef.current;
        const pos = el?.selectionStart ?? sort.length;
        const before = sort.slice(0, pos);
        const after = sort.slice(pos);
        const replaced = before.replace(/(\w*)$/, insertion);
        setSort(replaced + after);
        setTimeout(() => el?.focus(), 0);
      }
      setShowSuggestions(false);
      setSuggestionContext(null);
    },
    [filter, project, sort],
  );

  const currentValues = useCallback((): QueryBarValues => {
    const limitNum = Number(limit);
    const skipNum = Number(skip);
    return {
      filter: filter.trim(),
      project: project.trim(),
      sort: sort.trim(),
      limit: Number.isFinite(limitNum) && limitNum > 0 ? limitNum : DEFAULT_LIMIT,
      skip: Number.isFinite(skipNum) && skipNum >= 0 ? skipNum : DEFAULT_SKIP,
    };
  }, [filter, project, sort, limit, skip]);

  const runQuery = useCallback(() => {
    const values = currentValues();
    onRunQuery(values);
    recordQuery(values);
  }, [currentValues, onRunQuery, recordQuery]);

  /** Loads a recent or saved query into the bar and runs it. */
  const applyQuery = useCallback(
    (query: QueryBarValues) => {
      setFilter(query.filter);
      setProject(query.project);
      setSort(query.sort);
      setLimit(query.limit);
      setSkip(query.skip);
      // Reveal the options row if the query uses any of them.
      setShowOptions(
        !isEmptyObjectString(query.project) ||
          !isEmptyObjectString(query.sort) ||
          query.limit !== DEFAULT_LIMIT ||
          query.skip > 0,
      );
      setHistoryOpen(false);
      onRunQuery(query);
      recordQuery(query);
    },
    [onRunQuery, recordQuery],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, context: "filter" | "project" | "sort") => {
      if (showSuggestions && suggestionContext === context) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedSuggestion((prev) => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          const sel = suggestions[selectedSuggestion];
          if (sel) {
            e.preventDefault();
            applySuggestion(sel, context);
          }
          return;
        }
        if (e.key === "Escape") {
          setShowSuggestions(false);
          setSuggestionContext(null);
          return;
        }
      }
      if (context === "filter" && e.key === "Enter") {
        runQuery();
      }
    },
    [showSuggestions, suggestionContext, suggestions, selectedSuggestion, applySuggestion, runQuery],
  );

  const handleReset = useCallback(() => {
    setFilter(QUERY_BAR_DEFAULT_STATE.filter);
    setProject(QUERY_BAR_DEFAULT_STATE.project);
    setSort(QUERY_BAR_DEFAULT_STATE.sort);
    setLimit(QUERY_BAR_DEFAULT_STATE.limit);
    setSkip(QUERY_BAR_DEFAULT_STATE.skip);
    setShowSuggestions(false);
    onRunQuery(QUERY_BAR_DEFAULT_STATE);
  }, [onRunQuery]);

  return (
    <div className="border-b border-border bg-querybar">
      <div className="flex items-center gap-2 px-4 py-2">
        <Braces className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground font-medium shrink-0">FILTER</span>
        <div className="flex-1 relative">
          <Input
            ref={filterRef}
            variant="mono"
            className="px-3 py-1.5"
            type="text"
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "filter")}
            onSelect={() => {
              const pos = filterRef.current?.selectionStart ?? filter.length;
              updateSuggestions(filter, pos, "filter", filterRef);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder='{ "field": "value" }'
          />
          {showSuggestions && suggestionContext === "filter" && suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-sm shadow-lg z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin">
              {suggestions.map((field, i) => (
                <button
                  key={field}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySuggestion(field, "filter");
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center gap-2 transition-colors ${
                    i === selectedSuggestion ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="text-json-key">{field}</span>
                  <span className="text-muted-foreground text-[10px] ml-auto">field</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <IconButton
          variant={showOptions ? "active" : "default"}
          icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          label="Options"
          onClick={() => setShowOptions(!showOptions)}
        />
        <IconButton
          variant="default"
          icon={<RotateCcw className="h-3.5 w-3.5" />}
          label="Reset"
          onClick={handleReset}
        />
        <IconButton
          variant="default"
          icon={<Bookmark className="h-3.5 w-3.5" />}
          label="Save query"
          onClick={() => setQueryToSave(currentValues())}
          disabled={isDefaultQuery(currentValues())}
        />
        <div ref={historyRef} className="relative">
          <IconButton
            variant={historyOpen ? "active" : "default"}
            icon={<History className="h-3.5 w-3.5" />}
            label="Query history"
            onClick={() => setHistoryOpen((open) => !open)}
          />
          {historyOpen && (
            <div className="absolute right-0 top-full mt-1 z-50">
              <QueryHistoryPanel
                savedQueries={savedQueries}
                history={history}
                onApply={applyQuery}
                onSaveRequest={(query) => {
                  setHistoryOpen(false);
                  setQueryToSave(query);
                }}
                onDeleteSaved={deleteSavedQuery}
                onClearHistory={clearHistory}
              />
            </div>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Play className="h-3 w-3" />}
          onClick={runQuery}
        >
          Find
        </Button>
      </div>

      {showOptions && (
        <div className="flex flex-wrap items-center gap-4 px-4 py-2 border-t border-border text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0">Project:</span>
            <div className="relative">
              <Input
                ref={projectRef}
                variant="mono"
                className="px-3 py-1.5 w-40"
                type="text"
                value={project}
                onChange={(e) => handleProjectChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "project")}
                onSelect={() => {
                  const pos = projectRef.current?.selectionStart ?? project.length;
                  updateSuggestions(project, pos, "project", projectRef);
                }}
                onBlur={() =>
                  setTimeout(() => {
                    if (suggestionContext === "project") setShowSuggestions(false);
                  }, 150)
                }
                placeholder="{ }"
              />
              {showSuggestions && suggestionContext === "project" && suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-sm shadow-lg z-50 py-1 max-h-40 overflow-y-auto">
                  {suggestions.map((field, i) => (
                    <button
                      key={field}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applySuggestion(field, "project");
                      }}
                      className={`w-full text-left px-2 py-1 text-xs font-mono ${i === selectedSuggestion ? "bg-primary/15 text-primary" : "hover:bg-secondary"}`}
                    >
                      {field}: 1
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0">Sort:</span>
            <div className="relative">
              <Input
                ref={sortRef}
                variant="mono"
                className="px-3 py-1.5 w-40"
                type="text"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "sort")}
                onSelect={() => {
                  const pos = sortRef.current?.selectionStart ?? sort.length;
                  updateSuggestions(sort, pos, "sort", sortRef);
                }}
                onBlur={() =>
                  setTimeout(() => {
                    if (suggestionContext === "sort") setShowSuggestions(false);
                  }, 150)
                }
                placeholder="{ }"
              />
              {showSuggestions && suggestionContext === "sort" && suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-sm shadow-lg z-50 py-1 max-h-40 overflow-y-auto">
                  {suggestions.map((field, i) => (
                    <button
                      key={field}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applySuggestion(field, "sort");
                      }}
                      className={`w-full text-left px-2 py-1 text-xs font-mono ${i === selectedSuggestion ? "bg-primary/15 text-primary" : "hover:bg-secondary"}`}
                    >
                      {field}: -1
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0">Limit:</span>
            <Input
              variant="mono"
              className="px-3 py-1.5 w-20"
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(e) => setLimit(e.target.value === "" ? 0 : Number(e.target.value))}
              onBlur={() => {
                const n = Number(limit);
                if (!Number.isFinite(n) || n < 1) setLimit(DEFAULT_LIMIT);
                else if (n > 1000) setLimit(1000);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0">Skip:</span>
            <Input
              variant="mono"
              className="px-3 py-1.5 w-20"
              type="number"
              min={0}
              value={skip}
              onChange={(e) => setSkip(e.target.value === "" ? 0 : Number(e.target.value))}
              onBlur={() => {
                const n = Number(skip);
                if (!Number.isFinite(n) || n < 0) setSkip(DEFAULT_SKIP);
              }}
            />
          </div>
        </div>
      )}

      <SaveQueryModal
        query={queryToSave}
        onSave={saveQuery}
        onClose={() => setQueryToSave(null)}
      />
    </div>
  );
};
