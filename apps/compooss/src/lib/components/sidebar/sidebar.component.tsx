"use client";

import { CreateDatabaseModal } from "@/lib/components/databases/create-database-modal.component";
import { SidebarItem } from "@/lib/components/sidebar/sidebar-item.component";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_WIDTH_STORAGE_KEY,
} from "@/lib/constants";
import { useResizableWidth } from "@/lib/hooks/use-resizable-width.hook";
import { useConnection } from "@/lib/providers/connection-provider";
import { useGetDatabases } from "@/lib/services/database/database.service";
import type { Database } from "@compooss/types";
import {
  Button,
  cn,
  DatabaseSidebarSkeleton,
  IconButton,
  Input,
} from "@compooss/ui";
import { AlertTriangle, Plus, RefreshCw, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

/** Parses pathname to get the active database name (e.g. /databases/foo/... -> foo). */
function getActiveDbNameFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/databases\/([^/]+)/);
  return match ? match[1] : null;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const activeDbName = getActiveDbNameFromPath(pathname ?? "");
  const { activeConnection } = useConnection();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<boolean>(false);
  const [expandedDbNames, setExpandedDbNames] = useState<Set<string>>(
    () => new Set(),
  );
  const { width, isResizing, startResize, resetWidth } = useResizableWidth({
    storageKey: SIDEBAR_WIDTH_STORAGE_KEY,
    defaultWidth: SIDEBAR_DEFAULT_WIDTH,
    minWidth: SIDEBAR_MIN_WIDTH,
    maxWidth: SIDEBAR_MAX_WIDTH,
  });

  const handleToggleExpand = useCallback((dbName: string) => {
    setExpandedDbNames((prev) => {
      const next = new Set(prev);
      if (next.has(dbName)) next.delete(dbName);
      else next.add(dbName);
      return next;
    });
  }, []);

  const {
    data: databases,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGetDatabases();

  const filtered = useMemo(() => {
    return databases?.filter((db) =>
      db?.name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [databases, search]);

  return (
    <>
      <div
        className="relative bg-sidebar border-r border-border flex flex-col shrink-0 h-full"
        style={{ width }}
      >
        {/* Resize handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          title="Drag to resize, double-click to reset"
          className={cn(
            "absolute top-0 right-0 z-10 h-full w-1 translate-x-1/2 cursor-col-resize transition-colors hover:bg-primary/50 hover:delay-150",
            isResizing && "bg-primary/50",
          )}
          onMouseDown={startResize}
          onDoubleClick={resetWidth}
        />

        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Databases
          </span>
          <div className="flex items-center gap-1">
            <IconButton
              variant="toolbar"
              icon={<Plus className="h-3.5 w-3.5" />}
              label="Create Database"
              onClick={() => setOpen(true)}
            />
            <IconButton
              variant="toolbar"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              label="Refresh"
            />
          </div>
        </div>

        <div className="p-2">
          <Input
            variant="search"
            icon={<Search className="h-3.5 w-3.5" />}
            type="text"
            placeholder="Filter databases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
          {isLoading ? (
            <DatabaseSidebarSkeleton />
          ) : isError ? (
            <div className="px-3 py-6 flex flex-col items-center text-center">
              <AlertTriangle className="h-5 w-5 text-destructive mb-2" />
              <p className="text-xs font-medium text-destructive mb-1">
                Connection failed
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                Could not reach the database server. Check your connection
                string.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<RefreshCw className="h-3 w-3" />}
                loading={isRefetching}
                onClick={() => refetch()}
              >
                {isRefetching ? "Retrying…" : "Retry"}
              </Button>
            </div>
          ) : filtered?.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No databases found
            </div>
          ) : (
            filtered?.map((db: Database) => (
              <SidebarItem
                key={db.name}
                db={db}
                isExpanded={
                  expandedDbNames.has(db.name) || activeDbName === db.name
                }
                onToggleExpand={() => handleToggleExpand(db.name)}
              />
            ))
          )}
        </div>

        <div className="p-3 border-t border-border">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            {isError ? (
              <>
                <span className="text-destructive font-medium">●</span>{" "}
                Disconnected
              </>
            ) : (filtered?.length ?? 0) > 0 ? (
              <>
                {activeConnection?.color ? (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: activeConnection.color }}
                  />
                ) : (
                  <span className="text-primary font-medium">●</span>
                )}
                {`Connected ${filtered?.length ?? 0} databases`}
              </>
            ) : (
              <>
                <span className="text-muted-foreground font-medium">●</span> Not
                connected
              </>
            )}
          </div>
        </div>
      </div>

      {open && <CreateDatabaseModal onClose={() => setOpen(false)} />}
    </>
  );
};
