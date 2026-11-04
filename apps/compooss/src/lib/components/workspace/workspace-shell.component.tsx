"use client";

import { CollectionView } from "@/lib/components/collections/collection-view.component";
import { Sidebar } from "@/lib/components/sidebar/sidebar.component";
import { ShellPanel } from "@/lib/components/shell/shell-panel.component";
import { CommandPalette } from "@/lib/components/workspace/command-palette.component";
import { DesktopBridge } from "@/lib/components/workspace/desktop-bridge.component";
import { TopBar } from "@/lib/components/workspace/top-bar.component";
import { WorkspaceTabBar } from "@/lib/components/workspace/workspace-tab-bar.component";
import {
  useWorkspaceTabs,
  workspaceTabs,
} from "@/lib/hooks/use-workspace-tabs.hook";
import { namespaceOf, parseCollectionPath } from "@/lib/utils/collection-path.util";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
};

export const WorkspaceShell: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const tabs = useWorkspaceTabs();

  const active = parseCollectionPath(pathname);
  const activeId = active ? namespaceOf(active) : null;

  // Visiting a collection's URL (sidebar, links, palette, back/forward) opens its tab.
  useEffect(() => {
    const visited = parseCollectionPath(pathname);
    if (visited) workspaceTabs.open(visited);
  }, [pathname]);

  // Include the active collection before the effect above has stored it, so
  // the first render after navigating already shows it.
  const renderedTabs =
    active && !tabs.some((tab) => tab.id === activeId)
      ? [...tabs, { id: activeId!, ...active }]
      : tabs;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar onOpenCommandPalette={() => setPaletteOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {renderedTabs.length > 0 && (
            <WorkspaceTabBar tabs={renderedTabs} activeId={activeId} />
          )}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/*
              Open collections stay mounted while hidden, so switching tabs
              keeps each one's query, results, pipeline and scroll position.
              Other routes render through children as usual.
            */}
            {renderedTabs.map((tab) => (
              <div
                key={tab.id}
                className={tab.id === activeId ? "flex-1 flex flex-col min-h-0" : "hidden"}
              >
                <CollectionView
                  dbName={tab.dbName}
                  collectionName={tab.collectionName}
                  initialTab={tab.id === activeId ? searchParams.get("tab") ?? undefined : undefined}
                />
              </div>
            ))}
            {!activeId && children}
          </main>
          <ShellPanel />
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <DesktopBridge />
    </div>
  );
};
