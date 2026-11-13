"use client";

import { useConnection } from "@/lib/providers/connection-provider";
import { useGetDatabases } from "@/lib/services/database/database.service";
import type { Database } from "@compooss/types";
import { isProtectedDatabase } from "@compooss/types";
import { Button, DatabasesListSkeleton, EmptyState } from "@compooss/ui";
import { AlertTriangle, DatabaseBackupIcon, Plus, RefreshCw, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { CreateDatabaseModal } from "./create-database-modal.component";
import { ImportDatabaseModal } from "./export-import/import-database-modal.component";
import { DatabaseCard } from "./database-card.component";

export const Databases: React.FC = () => {
  const { data: databases = [], isLoading, isError, error, refetch, isRefetching } = useGetDatabases();
  const { isReadOnly } = useConnection();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const { userDatabases, systemDatabases } = useMemo(() => {
    const user: Database[] = [];
    const system: Database[] = [];
    for (const db of databases) {
      if (isProtectedDatabase(db.name)) system.push(db);
      else user.push(db);
    }
    return { userDatabases: user, systemDatabases: system };
  }, [databases]);

  return (
    <>
      <div className="flex flex-1 flex-col h-full overflow-hidden bg-background">
        <div className="px-4 py-3 border-b border-border bg-card/50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-base font-semibold text-foreground">
                Databases
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                All databases on this MongoDB server
              </p>
            </div>
            {!isReadOnly && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Upload className="h-3.5 w-3.5" />}
                  onClick={() => setImportModalOpen(true)}
                >
                  Import database
                </Button>
                <Button
                  variant="primary"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Create database
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-8">
          {isLoading ? (
            <DatabasesListSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-sm mx-auto">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-5">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">
                Connection failed
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                Unable to connect to the MongoDB server. Please check your
                connection string and ensure the database server is running.
              </p>
              {error?.message && (
                <p className="text-xs text-destructive/80 font-mono bg-destructive/5 rounded-md px-3 py-2 mt-2 w-full break-all">
                  {error.message}
                </p>
              )}
              <Button
                variant="primary"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                loading={isRefetching}
                onClick={() => refetch()}
                className="mt-6"
              >
                {isRefetching ? "Retrying…" : "Retry connection"}
              </Button>
            </div>
          ) : !databases.length ? (
            <EmptyState
              icon={<DatabaseBackupIcon className="h-12 w-12 text-muted-foreground" />}
              title="No databases yet"
              description="Create your first database to start storing collections and documents."
              primaryAction={
                isReadOnly
                  ? undefined
                  : {
                      label: "Create database",
                      onClick: () => setCreateModalOpen(true),
                    }
              }
            />
          ) : (
            <>
              {userDatabases.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    User databases
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {userDatabases.map((db) => (
                      <DatabaseCard
                        key={db.name}
                        db={db}
                        isSystem={isProtectedDatabase(db.name)}
                      />
                    ))}
                  </div>
                </section>
              )}
              {systemDatabases.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    System databases
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {systemDatabases.map((db) => (
                      <DatabaseCard
                        key={db.name}
                        db={db}
                        isSystem={isProtectedDatabase(db.name)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {createModalOpen && (
        <CreateDatabaseModal onClose={() => setCreateModalOpen(false)} />
      )}
      <ImportDatabaseModal open={importModalOpen} onClose={() => setImportModalOpen(false)} />
    </>
  );
};
