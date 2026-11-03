"use client";

import {
  useCloseWorkspaceTab,
  type WorkspaceTab,
} from "@/lib/hooks/use-workspace-tabs.hook";
import { collectionPath } from "@/lib/utils/collection-path.util";
import { cn } from "@compooss/ui";
import { Table, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = {
  tabs: WorkspaceTab[];
  activeId: string | null;
};

export const WorkspaceTabBar: React.FC<Props> = ({ tabs, activeId }) => {
  const router = useRouter();
  const closeTab = useCloseWorkspaceTab();
  const activeRef = useRef<HTMLDivElement>(null);

  // Keep the active tab visible when there are more tabs than fit.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  return (
    <div
      role="tablist"
      aria-label="Open collections"
      className="flex items-end gap-px h-9 px-2 pt-1 border-b border-border bg-sidebar/40 overflow-x-auto scrollbar-thin shrink-0"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const open = () => router.push(collectionPath(tab));
        return (
          <div
            key={tab.id}
            ref={isActive ? activeRef : undefined}
            role="tab"
            tabIndex={0}
            aria-selected={isActive}
            title={tab.id}
            onClick={open}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            }}
            // Middle-click closes, as in browsers and editors.
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                closeTab(tab);
              }
            }}
            className={cn(
              "group/tab relative flex items-center gap-1.5 h-8 pl-3 pr-1 max-w-[240px] shrink-0 rounded-t-md border border-b-0 text-xs cursor-pointer select-none transition-colors",
              isActive
                ? "bg-background border-border text-foreground"
                : "border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {isActive && <span className="absolute inset-x-0 top-0 h-0.5 rounded-t-md bg-primary" />}
            <Table className="h-3 w-3 shrink-0" />
            <span className="truncate">{tab.collectionName}</span>
            <span className="truncate text-muted-foreground/70">{tab.dbName}</span>
            <button
              type="button"
              aria-label={`Close ${tab.id}`}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab);
              }}
              className={cn(
                "ml-0.5 p-0.5 rounded-sm shrink-0 hover:bg-muted focus-visible:opacity-100",
                isActive ? "opacity-100" : "opacity-0 group-hover/tab:opacity-100",
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
