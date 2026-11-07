"use client";

import { Button, CollectionsSkeleton } from "@compooss/ui";
import { CreateCollectionModal } from "@/lib/components/collections/create-collection-modal.component";
import { useConnection } from "@/lib/providers/connection-provider";
import { useGetCollections } from "@/lib/services/collections/collection.service";
import { formatBytes } from "@/lib/utils";
import { isProtectedDatabase, type Collection } from "@compooss/types";
import { DatabaseBackupIcon, Plus, Table } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Props = {
  dbName: string;
};

export const DatabaseView: React.FC<Props> = ({ dbName }) => {
  const { data: collections, isLoading } = useGetCollections(dbName);
  const [addCollectionModalOpen, setAddCollectionModalOpen] = useState(false);
  const { isReadOnly } = useConnection();
  const readOnly = isReadOnly || isProtectedDatabase(dbName);

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <div className="px-4 py-3 border-b border-border bg-card/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <DatabaseBackupIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                {dbName}
              </h2>
              <span className="text-xs text-muted-foreground">
                {collections?.length ?? 0} collection
                {collections?.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!readOnly && (
                <Button
                  variant="primary"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setAddCollectionModalOpen(true)}
                >
                  Add collection
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <CollectionsSkeleton />
          ) : !collections?.length ? (
            <div className="text-sm text-muted-foreground">
              No collections in this database.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 font-medium text-foreground">
                      Collection Name
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground">
                      Properties
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground text-right">
                      Storage size
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground text-right">
                      Data size
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground text-right">
                      Documents
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground text-right">
                      Avg. Document size
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground text-right">
                      Index
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground text-right">
                      Total Index size
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((col: Collection) => (
                    <tr
                      key={col.name}
                      className="border-b border-border last:border-b-0 hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/databases/${dbName}/collections/${col.name}`}
                          className="flex items-center gap-2 text-primary hover:underline font-medium"
                        >
                          <Table className="h-3.5 w-3.5 shrink-0" />
                          {col.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {col.type ?? "collection"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatBytes(col.storageSize ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatBytes(col.size ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                        {(col.documentCount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatBytes(col.avgObjSize ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                        {col.indexCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatBytes(col.totalIndexSize ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CreateCollectionModal
        open={addCollectionModalOpen}
        dbName={dbName}
        onClose={() => setAddCollectionModalOpen(false)}
      />
    </>
  );
};
