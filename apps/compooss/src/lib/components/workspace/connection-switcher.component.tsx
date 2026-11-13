"use client";

import { useWorkspaceTabs } from "@/lib/hooks/use-workspace-tabs.hook";
import { useConnection } from "@/lib/providers/connection-provider";
import { connectionDB } from "@/lib/storage/connection-db";
import { getApiErrorMessage } from "@/lib/utils/api-error.util";
import { connectionHosts } from "@/lib/utils/connection-uri.util";
import type { SavedConnection } from "@compooss/types";
import { Badge, cn } from "@compooss/ui";
import { Command } from "cmdk";
import {
  Check,
  ChevronDown,
  Database,
  Loader2,
  Lock,
  Search,
  Settings2,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Favorites first, then the most recently used. */
function sortConnections(connections: SavedConnection[]): SavedConnection[] {
  const lastUsed = (connection: SavedConnection) =>
    connection.lastUsedAt ? new Date(connection.lastUsedAt).getTime() : 0;
  return [...connections].sort(
    (a, b) => Number(b.isFavorite) - Number(a.isFavorite) || lastUsed(b) - lastUsed(a),
  );
}

function ColorDot({ color }: { color?: string }) {
  return color ? (
    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
  ) : (
    <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  );
}

/**
 * The active connection in the top bar. Opens a list of saved connections and
 * switches to the one picked without going through the connections page.
 */
export const ConnectionSwitcher: React.FC = () => {
  const router = useRouter();
  const { activeConnection, maskedUri, isReadOnly, connect, checkStatus } = useConnection();
  const openTabs = useWorkspaceTabs();
  const [open, setOpen] = useState(false);
  const [connections, setConnections] = useState<SavedConnection[] | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ id: string; message: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    setFailed(null);
  };

  // Read on every open: connections are added and edited on the connections page.
  const openMenu = async () => {
    setOpen(true);
    setConnections(sortConnections(await connectionDB.getAll()));
  };

  useEffect(() => {
    if (!open || switchingId) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      setFailed(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, switchingId]);

  const handleSwitch = async (connection: SavedConnection) => {
    if (switchingId) return;
    if (connection.id === activeConnection?.id) {
      close();
      return;
    }
    setSwitchingId(connection.id);
    setFailed(null);
    try {
      await connect(connection);
      close();
      toast.success(`Switched to ${connection.name}`);
      router.push("/databases");
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "Connection failed.";
      setFailed({ id: connection.id, message: getApiErrorMessage(error, fallback) });
      // The server keeps the current connection when a switch fails. Confirm it,
      // so the workspace sends you to /connect if that connection is gone anyway.
      void checkStatus();
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div ref={rootRef} className="relative max-w-2xl">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close() : void openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            void openMenu();
          }
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-sm bg-secondary px-3 py-1.5 text-left transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
          open && "bg-secondary/80",
        )}
      >
        {activeConnection?.color && <ColorDot color={activeConnection.color} />}
        <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs font-medium text-foreground">
          {activeConnection?.name ?? "No connection"}
        </span>
        {activeConnection?.label && (
          <span className="shrink-0 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
            {activeConnection.label}
          </span>
        )}
        {isReadOnly && (
          <Badge variant="warning" size="sm" className="shrink-0 gap-1">
            <Lock className="h-2.5 w-2.5" />
            Read-only
          </Badge>
        )}
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
          {maskedUri ?? ""}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Switch connection"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !switchingId) {
              event.preventDefault();
              close();
              triggerRef.current?.focus();
            }
          }}
          className="absolute left-0 top-full z-50 mt-1 w-full min-w-[22rem] overflow-hidden rounded-lg border border-border bg-popover shadow-2xl"
        >
          <Command label="Saved connections" loop>
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Command.Input
                autoFocus
                placeholder="Switch to a saved connection…"
                className="flex-1 bg-transparent py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-[min(50vh,360px)] overflow-y-auto p-1.5 scrollbar-thin">
              {connections === null ? (
                <Command.Loading>
                  <p className="py-6 text-center text-xs text-muted-foreground">Loading connections…</p>
                </Command.Loading>
              ) : (
                <Command.Empty className="py-6 text-center text-xs text-muted-foreground">
                  No saved connections match.
                </Command.Empty>
              )}
              {connections?.map((connection) => {
                const isCurrent = connection.id === activeConnection?.id;
                const isSwitching = connection.id === switchingId;
                const error = failed?.id === connection.id ? failed.message : null;
                return (
                  <Command.Item
                    key={connection.id}
                    value={`${connection.name} ${connection.id}`}
                    keywords={[connection.label ?? "", connectionHosts(connection.uri)]}
                    disabled={!!switchingId && !isSwitching}
                    onSelect={() => void handleSwitch(connection)}
                    className="flex cursor-pointer select-none items-start gap-2.5 rounded-sm px-2.5 py-2 data-[disabled=true]:cursor-default data-[disabled=true]:opacity-50 data-[selected=true]:bg-secondary"
                  >
                    <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                      <ColorDot color={connection.color} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-medium text-foreground">
                          {connection.name}
                        </span>
                        {connection.isFavorite && (
                          <Star className="h-3 w-3 shrink-0 fill-warning text-warning" aria-label="Favorite" />
                        )}
                        {connection.label && (
                          <span className="shrink-0 rounded-sm bg-primary/10 px-1.5 py-px text-[10px] text-primary">
                            {connection.label}
                          </span>
                        )}
                        {connection.readOnly && (
                          <Lock className="h-3 w-3 shrink-0 text-warning" aria-label="Read-only" />
                        )}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">
                        {connectionHosts(connection.uri)}
                      </span>
                      {error && (
                        <span className="mt-1 block text-[11px] leading-4 text-destructive">{error}</span>
                      )}
                    </span>
                    <span className="mt-0.5 flex shrink-0 items-center text-[11px] text-muted-foreground">
                      {isSwitching ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-label="Connecting" />
                      ) : isCurrent ? (
                        <span className="flex items-center gap-1 text-primary">
                          <Check className="h-3.5 w-3.5" />
                          Connected
                        </span>
                      ) : null}
                    </span>
                  </Command.Item>
                );
              })}
            </Command.List>
          </Command>
          <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
            <span className="text-[11px] text-muted-foreground">
              {switchingId
                ? "Connecting…"
                : openTabs.length > 0
                  ? `Switching closes ${openTabs.length === 1 ? "your open tab" : `your ${openTabs.length} open tabs`}.`
                  : ""}
            </span>
            <button
              type="button"
              disabled={!!switchingId}
              onClick={() => {
                close();
                router.push("/connect");
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-sm px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <Settings2 className="h-3 w-3" />
              Manage connections
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
