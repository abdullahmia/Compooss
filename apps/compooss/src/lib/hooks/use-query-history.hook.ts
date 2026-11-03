"use client";

import type { QueryBarValues, QueryHistoryEntry, SavedQuery } from "@compooss/types";
import { useCallback, useSyncExternalStore } from "react";

const MAX_HISTORY = 25;
const EMPTY_LIST: never[] = [];

// localStorage-backed lists. The cache keeps snapshots referentially stable,
// which useSyncExternalStore requires, and listeners re-render every reader
// when a list changes.
const cache = new Map<string, unknown[]>();
const listeners = new Set<() => void>();

function readList<T>(key: string): T[] {
  if (!cache.has(key)) {
    let list: unknown[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
      if (Array.isArray(parsed)) list = parsed;
    } catch {}
    cache.set(key, list);
  }
  return cache.get(key) as T[];
}

function writeList<T>(key: string, list: T[]): void {
  cache.set(key, list);
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function useStoredList<T>(key: string): T[] {
  return useSyncExternalStore(
    subscribe,
    () => readList<T>(key),
    () => EMPTY_LIST,
  );
}

// Not crypto.randomUUID: that only exists on HTTPS or localhost.
function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function toValues({ filter, project, sort, limit, skip }: QueryBarValues): QueryBarValues {
  return { filter, project, sort, limit, skip };
}

/** True for a blank field or an empty object literal, the query bar's defaults. */
export const isEmptyObjectString = (value: string) =>
  ["", "{}", "{ }"].includes(value.trim());

/** The default "show everything" query isn't worth remembering. */
export function isDefaultQuery(query: QueryBarValues): boolean {
  return (
    isEmptyObjectString(query.filter) &&
    isEmptyObjectString(query.project) &&
    isEmptyObjectString(query.sort) &&
    query.skip === 0
  );
}

function isSameQuery(a: QueryBarValues, b: QueryBarValues): boolean {
  return (
    a.filter.trim() === b.filter.trim() &&
    a.project.trim() === b.project.trim() &&
    a.sort.trim() === b.sort.trim() &&
    a.limit === b.limit &&
    a.skip === b.skip
  );
}

/** Recent and saved queries for one collection, kept in this browser. */
export function useQueryHistory(namespace: string) {
  const historyKey = `compooss:query-history:${namespace}`;
  const savedKey = `compooss:saved-queries:${namespace}`;
  const history = useStoredList<QueryHistoryEntry>(historyKey);
  const savedQueries = useStoredList<SavedQuery>(savedKey);

  /** Moves the query to the top of the history, dropping older duplicates. */
  const recordQuery = useCallback(
    (query: QueryBarValues) => {
      if (isDefaultQuery(query)) return;
      const others = readList<QueryHistoryEntry>(historyKey).filter(
        (entry) => !isSameQuery(entry, query),
      );
      const entry: QueryHistoryEntry = {
        ...toValues(query),
        id: generateId(),
        executedAt: new Date().toISOString(),
      };
      writeList(historyKey, [entry, ...others].slice(0, MAX_HISTORY));
    },
    [historyKey],
  );

  const saveQuery = useCallback(
    (name: string, query: QueryBarValues) => {
      const saved: SavedQuery = {
        ...toValues(query),
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
      };
      writeList(savedKey, [saved, ...readList<SavedQuery>(savedKey)]);
    },
    [savedKey],
  );

  const deleteSavedQuery = useCallback(
    (id: string) =>
      writeList(
        savedKey,
        readList<SavedQuery>(savedKey).filter((query) => query.id !== id),
      ),
    [savedKey],
  );

  const clearHistory = useCallback(() => writeList(historyKey, []), [historyKey]);

  return { history, savedQueries, recordQuery, saveQuery, deleteSavedQuery, clearHistory };
}
