"use client";

import { CreateCollectionModal } from "@/lib/components/collections/create-collection-modal.component";
import { CreateDatabaseModal } from "@/lib/components/databases/create-database-modal.component";
import {
  useCloseAllWorkspaceTabs,
  useCloseWorkspaceTab,
  useWorkspaceTabs,
} from "@/lib/hooks/use-workspace-tabs.hook";
import { useConnection } from "@/lib/providers/connection-provider";
import { useShellPanel } from "@/lib/providers/shell-provider";
import { COLLECTION_QUERY_KEYS } from "@/lib/services/collections/collection-query.key";
import { fetchCollections } from "@/lib/services/collections/collection.service";
import { useGetDatabases } from "@/lib/services/database/database.service";
import {
  collectionPath,
  databaseFromPath,
  namespaceOf,
  parseCollectionPath,
} from "@/lib/utils/collection-path.util";
import { isProtectedDatabase } from "@compooss/types";
import { useQueries } from "@tanstack/react-query";
import { Command } from "cmdk";
import {
  Activity,
  Database,
  FolderPlus,
  LayoutGrid,
  Moon,
  Plug,
  Plus,
  Search,
  Sun,
  Table,
  TerminalSquare,
  X,
  XSquare,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ITEM_CLASS =
  "flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-sm text-foreground cursor-pointer select-none data-[selected=true]:bg-secondary";
const GROUP_CLASS =
  "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground";

/**
 * Every search term must appear in the item's value or keywords. cmdk's
 * default fuzzy matching accepts any letters in order, so "posts" would
 * match "shop.customers" (p…o…s…t…s). Exact names rank first, then matches
 * at the start of a word, then anywhere.
 */
function filterItem(value: string, search: string, keywords: string[] = []): number {
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 1;
  const words = keywords.map((keyword) => keyword.toLowerCase());
  const haystack = `${value} ${words.join(" ")}`.toLowerCase();

  let score = 0;
  for (const term of terms) {
    const index = haystack.indexOf(term);
    if (index === -1) return 0;
    if (words.includes(term)) score += 3;
    else if (index === 0 || /[\s._-]/.test(haystack[index - 1])) score += 2;
    else score += 1;
  }
  return score / (terms.length * 3);
}

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="px-1.5 py-0.5 rounded-sm border border-border bg-secondary text-[10px] font-sans text-muted-foreground">
    {children}
  </kbd>
);

export const CommandPalette: React.FC<Props> = ({ open, onOpenChange }) => {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { isReadOnly } = useConnection();
  const { toggle: toggleShell } = useShellPanel();
  const { resolvedTheme, setTheme } = useTheme();
  const tabs = useWorkspaceTabs();
  const closeTab = useCloseWorkspaceTab();
  const closeAllTabs = useCloseAllWorkspaceTabs();
  const [createDbOpen, setCreateDbOpen] = useState(false);
  const [createCollectionIn, setCreateCollectionIn] = useState<string | null>(null);

  // ⌘K / Ctrl+K toggles the palette anywhere. Captured before the editors,
  // which would otherwise treat it as the start of a key chord.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, onOpenChange]);

  // Remember what had focus before focusing the search input (so not
  // autoFocus, which would run first), and return focus there on close.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [open]);

  const { data: databases = [] } = useGetDatabases();
  // Shares the sidebar's cache, so already-expanded databases load instantly.
  const collectionQueries = useQueries({
    queries: databases.map((db) => ({
      queryKey: COLLECTION_QUERY_KEYS.list(db.name),
      queryFn: () => fetchCollections(db.name),
      enabled: open,
      staleTime: 30_000,
    })),
  });
  const collections = databases.flatMap((db, i) =>
    (collectionQueries[i]?.data ?? [])
      .filter((collection) => !collection.name.startsWith("system."))
      .map((collection) => ({ dbName: db.name, collection })),
  );
  const isLoadingCollections = collectionQueries.some((query) => query.isLoading);

  const activeCollection = parseCollectionPath(pathname);
  const activeTab = activeCollection
    ? tabs.find((tab) => tab.id === namespaceOf(activeCollection))
    : undefined;
  const activeDb = databaseFromPath(pathname);
  const canCreateCollection = !!activeDb && !isReadOnly && !isProtectedDatabase(activeDb);

  const close = () => onOpenChange(false);
  const run = (action: () => void) => {
    close();
    action();
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" onClick={close} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
            className="relative w-full max-w-xl rounded-lg border border-border bg-popover shadow-2xl overflow-hidden"
          >
            <Command label="Command palette" loop filter={filterItem}>
              <div className="flex items-center gap-2 px-3 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Command.Input
                  ref={inputRef}
                  placeholder="Search collections, databases and actions…"
                  className="flex-1 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <Kbd>esc</Kbd>
              </div>

              <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto scrollbar-thin p-1.5">
                <Command.Empty className="py-8 text-center text-xs text-muted-foreground">
                  {isLoadingCollections ? "Loading collections…" : "No matches."}
                </Command.Empty>

                {tabs.length > 0 && (
                  <Command.Group heading="Open tabs" className={GROUP_CLASS}>
                    {tabs.map((tab) => (
                      <Command.Item
                        key={tab.id}
                        value={`tab ${tab.id}`}
                        keywords={[tab.collectionName, tab.dbName]}
                        onSelect={() => run(() => router.push(collectionPath(tab)))}
                        className={ITEM_CLASS}
                      >
                        <Table className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{tab.collectionName}</span>
                        <span className="truncate text-xs text-muted-foreground">{tab.dbName}</span>
                        {tab.id === activeTab?.id && (
                          <span className="ml-auto text-[11px] text-muted-foreground">Current</span>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading="Collections" className={GROUP_CLASS}>
                  {collections.map(({ dbName, collection }) => {
                    const ref = { dbName, collectionName: collection.name };
                    return (
                      <Command.Item
                        key={namespaceOf(ref)}
                        value={`collection ${namespaceOf(ref)}`}
                        keywords={[collection.name, dbName]}
                        onSelect={() => run(() => router.push(collectionPath(ref)))}
                        className={ITEM_CLASS}
                      >
                        <Table className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{collection.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{dbName}</span>
                        <span className="ml-auto text-[11px] text-muted-foreground tabular-nums shrink-0">
                          {collection.documentCount.toLocaleString()} docs
                        </span>
                      </Command.Item>
                    );
                  })}
                </Command.Group>

                <Command.Group heading="Databases" className={GROUP_CLASS}>
                  {databases.map((db) => (
                    <Command.Item
                      key={db.name}
                      value={`database ${db.name}`}
                      keywords={[db.name]}
                      onSelect={() => run(() => router.push(`/databases/${encodeURIComponent(db.name)}`))}
                      className={ITEM_CLASS}
                    >
                      <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{db.name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Actions" className={GROUP_CLASS}>
                  <Command.Item value="Go to databases overview" onSelect={() => run(() => router.push("/databases"))} className={ITEM_CLASS}>
                    <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" /> Go to databases overview
                  </Command.Item>
                  <Command.Item value="Open performance" keywords={["metrics", "server status", "slow queries"]} onSelect={() => run(() => router.push("/performance"))} className={ITEM_CLASS}>
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" /> Open performance
                  </Command.Item>
                  <Command.Item value="Toggle MongoDB shell" keywords={["mongosh", "terminal", "console"]} onSelect={() => run(toggleShell)} className={ITEM_CLASS}>
                    <TerminalSquare className="h-3.5 w-3.5 text-muted-foreground" /> Toggle MongoDB shell
                  </Command.Item>
                  {!isReadOnly && (
                    <Command.Item value="Create database" keywords={["new database"]} onSelect={() => run(() => setCreateDbOpen(true))} className={ITEM_CLASS}>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" /> Create database…
                    </Command.Item>
                  )}
                  {canCreateCollection && (
                    <Command.Item value={`Create collection in ${activeDb}`} keywords={["new collection"]} onSelect={() => run(() => setCreateCollectionIn(activeDb))} className={ITEM_CLASS}>
                      <FolderPlus className="h-3.5 w-3.5 text-muted-foreground" /> Create collection in {activeDb}…
                    </Command.Item>
                  )}
                  {activeTab && (
                    <Command.Item value="Close current tab" onSelect={() => run(() => closeTab(activeTab))} className={ITEM_CLASS}>
                      <X className="h-3.5 w-3.5 text-muted-foreground" /> Close current tab
                    </Command.Item>
                  )}
                  {tabs.length > 0 && (
                    <Command.Item value="Close all tabs" onSelect={() => run(closeAllTabs)} className={ITEM_CLASS}>
                      <XSquare className="h-3.5 w-3.5 text-muted-foreground" /> Close all tabs
                    </Command.Item>
                  )}
                  <Command.Item
                    value="Switch theme"
                    keywords={["dark mode", "light mode"]}
                    onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
                    className={ITEM_CLASS}
                  >
                    {resolvedTheme === "dark" ? (
                      <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    Switch to {resolvedTheme === "dark" ? "light" : "dark"} theme
                  </Command.Item>
                  <Command.Item value="Switch connection" keywords={["connect", "server"]} onSelect={() => run(() => router.push("/connect"))} className={ITEM_CLASS}>
                    <Plug className="h-3.5 w-3.5 text-muted-foreground" /> Switch connection
                  </Command.Item>
                </Command.Group>
              </Command.List>

              <div className="flex items-center gap-3 px-3 py-2 border-t border-border text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
                <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
                <span className="flex items-center gap-1"><Kbd>esc</Kbd> close</span>
              </div>
            </Command>
          </div>
        </div>
      )}

      {createDbOpen && <CreateDatabaseModal onClose={() => setCreateDbOpen(false)} />}
      <CreateCollectionModal
        open={createCollectionIn !== null}
        dbName={createCollectionIn ?? ""}
        onClose={() => setCreateCollectionIn(null)}
      />
    </>
  );
};
