"use client";

import { connectionDB } from "@/lib/storage/connection-db";
import { useConnection } from "@/lib/providers/connection-provider";
import { apiClient } from "@/lib/config/api.config";
import { ENDPOINTS } from "@/lib/constants";
import { generateId } from "@/lib/utils/generate-id.util";
import type { SavedConnection } from "@compooss/types";
import { ThemeSwitcher } from "@/lib/components/common/theme-switcher.component";
import { Database, Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ConnectionForm } from "./connection-form.component";
import type { TConnectionForm } from "@/lib/schemas/connection.schema";
import { ConnectionList } from "./connection-list.component";

export const ConnectionPage: React.FC = () => {
  const router = useRouter();
  const { connect, disconnect, testConnection, isConnecting } = useConnection();
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [editingConnection, setEditingConnection] =
    useState<SavedConnection | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    const all = await connectionDB.getAll();
    setConnections(all);
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleFormSubmit = async (data: TConnectionForm) => {
    setSubmitError(null);

    const id = editingConnection?.id ?? generateId();
    const now = new Date().toISOString();

    const saved: SavedConnection = {
      id,
      name: data.connectionName,
      uri: data.connectionString,
      color: data.color,
      label: data.label,
      isFavorite: data.isFavorite,
      readOnly: data.readOnly ?? false,
      isPinned: editingConnection?.isPinned ?? false,
      authType: data.authType,
      authConfig: data.authConfig,
      tlsConfig: data.tlsConfig,
      advancedConfig: data.advancedConfig,
      createdAt: editingConnection?.createdAt ?? now,
      lastUsedAt: now,
    };

    let status;
    try {
      status = await connect(saved);
    } catch (err) {
      const apiErr = err as { payload?: { message?: string } };
      const msg = apiErr?.payload?.message ?? (err instanceof Error ? err.message : "Connection failed");
      setSubmitError(msg);
      return;
    }

    if (status?.resolvedUri) {
      saved.uri = status.resolvedUri;
      toast.info(
        `Docker detected — saved connection using \`${new URL(status.resolvedUri).hostname}\` instead of \`localhost\``,
      );
    }

    try {
      await apiClient.get(ENDPOINTS.databases.root);
    } catch {
      await disconnect();
      toast.error("Unable to reach the database. Please check your connection string.");
      return;
    }

    await connectionDB.save(saved);
    toast.success(`Connected to ${saved.name}`);
    router.push("/");
  };

  const handleTest = async (uri: string) => {
    try {
      return await testConnection(uri);
    } catch {
      return { ok: false, message: "Test failed" };
    }
  };

  const handleConnect = async (connection: SavedConnection) => {
    setConnectingId(connection.id);
    try {
      await connect(connection);
      toast.success(`Connected to ${connection.name}`);
      router.push("/");
    } catch (err) {
      const apiErr = err as { payload?: { message?: string } };
      const msg = apiErr?.payload?.message ?? (err instanceof Error ? err.message : "Connection failed");
      toast.error(msg);
    } finally {
      setConnectingId(null);
    }
  };

  const handleEdit = (connection: SavedConnection) => {
    setEditingConnection(connection);
  };

  const handleDelete = async (id: string) => {
    await connectionDB.delete(id);
    if (editingConnection?.id === id) setEditingConnection(null);
    await loadConnections();
    toast.success("Connection removed");
  };

  const handleToggleFavorite = async (id: string) => {
    const conn = connections.find((c) => c.id === id);
    if (!conn) return;
    await connectionDB.update(id, { isFavorite: !conn.isFavorite });
    await loadConnections();
  };

  const handleCancelEdit = () => {
    setEditingConnection(null);
    setSubmitError(null);
  };

  const formDefaults: Partial<TConnectionForm> | undefined = editingConnection
    ? {
        connectionString: editingConnection.uri,
        connectionName: editingConnection.name,
        isFavorite: editingConnection.isFavorite,
        readOnly: editingConnection.readOnly ?? false,
        color: editingConnection.color,
        label: editingConnection.label,
        authType: editingConnection.authType,
        authConfig: editingConnection.authConfig,
        tlsConfig: editingConnection.tlsConfig,
        advancedConfig: editingConnection.advancedConfig,
      }
    : undefined;

  const hasConnections = connections.length > 0;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Topbar */}
      <div className="h-12 flex items-center justify-between px-4 shrink-0 sticky top-0 z-20 bg-topbar/60 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.06]">
        {/* Left edge sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent dark:from-white/[0.04] pointer-events-none" />
        <div className="relative flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
            <Leaf className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">
            Compooss
          </span>
        </div>
        <div className="relative">
          <ThemeSwitcher />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto relative flex items-center justify-center">
          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-xl w-full mx-auto px-6 py-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 mb-4">
                <Leaf className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1.5">
                {editingConnection
                  ? `Edit Connection`
                  : "New Connection"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {editingConnection
                  ? (
                    <span>
                      Editing <span className="text-foreground font-medium">{editingConnection.name}</span>
                      {" · "}
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </span>
                  )
                  : "Connect to your MongoDB deployment"}
              </p>
            </div>

            <ConnectionForm
              key={editingConnection?.id ?? "new"}
              defaultValues={formDefaults}
              onSubmit={handleFormSubmit}
              onTest={handleTest}
              isConnecting={isConnecting}
              editMode={!!editingConnection}
              submitError={submitError}
            />
          </div>
        </div>

        {/* Right sidebar: Saved connections */}
        {hasConnections && (
          <div className="w-[360px] border-l border-border/50 bg-sidebar flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-inset ring-primary/10">
                  <Database className="h-3.5 w-3.5 text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-foreground tracking-tight">
                  Saved Connections
                </h2>
              </div>
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-semibold tabular-nums text-muted-foreground bg-secondary rounded-full">
                {connections.length}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConnectionList
                connections={connections}
                onConnect={handleConnect}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                connectingId={connectingId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
