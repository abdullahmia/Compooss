"use client";

import {
  collectionPath,
  namespaceOf,
  parseCollectionPath,
  type CollectionRef,
} from "@/lib/utils/collection-path.util";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";

export type WorkspaceTab = CollectionRef & {
  /** The collection's namespace, e.g. "shop.orders". */
  id: string;
};

const STORAGE_KEY = "compooss:workspace-tabs";
const EMPTY_TABS: WorkspaceTab[] = [];

// Open tabs live outside React so the sidebar, palette and modals can update
// them. Kept in sessionStorage: a reload restores them, other browser tabs
// keep their own.
let tabs: WorkspaceTab[] | null = null;
const listeners = new Set<() => void>();

function getTabs(): WorkspaceTab[] {
  if (tabs === null) {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
      tabs = Array.isArray(parsed) ? parsed : [];
    } catch {
      tabs = [];
    }
  }
  return tabs;
}

function setTabs(next: WorkspaceTab[]): void {
  tabs = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const workspaceTabs = {
  /** Adds a tab for the collection unless it's already open. */
  open(ref: CollectionRef): void {
    const id = namespaceOf(ref);
    if (getTabs().some((tab) => tab.id === id)) return;
    setTabs([...getTabs(), { id, dbName: ref.dbName, collectionName: ref.collectionName }]);
  },

  close(id: string): void {
    setTabs(getTabs().filter((tab) => tab.id !== id));
  },

  /** Closes the tabs of a dropped database, or of one dropped collection. */
  closeDropped(dbName: string, collectionName?: string): void {
    setTabs(
      getTabs().filter(
        (tab) =>
          tab.dbName !== dbName ||
          (collectionName !== undefined && tab.collectionName !== collectionName),
      ),
    );
  },

  rename(dbName: string, oldName: string, newName: string): void {
    const renamed = { dbName, collectionName: newName };
    setTabs(
      getTabs().map((tab) =>
        tab.id === namespaceOf({ dbName, collectionName: oldName })
          ? { ...renamed, id: namespaceOf(renamed) }
          : tab,
      ),
    );
  },

  clear(): void {
    setTabs([]);
  },
};

export function useWorkspaceTabs(): WorkspaceTab[] {
  return useSyncExternalStore(subscribe, getTabs, () => EMPTY_TABS);
}

/**
 * Closes a tab. Closing the active one moves to its right-hand neighbour,
 * then the left, then the collection's database page.
 */
export function useCloseWorkspaceTab() {
  const router = useRouter();
  const pathname = usePathname();
  const openTabs = useWorkspaceTabs();

  return useCallback(
    (tab: WorkspaceTab) => {
      const active = parseCollectionPath(pathname);
      if (active && namespaceOf(active) === tab.id) {
        const index = openTabs.findIndex((t) => t.id === tab.id);
        const next = openTabs[index + 1] ?? openTabs[index - 1];
        router.push(next ? collectionPath(next) : `/databases/${encodeURIComponent(tab.dbName)}`);
      }
      workspaceTabs.close(tab.id);
    },
    [router, pathname, openTabs],
  );
}

/** Closes every tab, leaving the active collection for its database page. */
export function useCloseAllWorkspaceTabs() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(() => {
    const active = parseCollectionPath(pathname);
    if (active) router.push(`/databases/${encodeURIComponent(active.dbName)}`);
    workspaceTabs.clear();
  }, [router, pathname]);
}
