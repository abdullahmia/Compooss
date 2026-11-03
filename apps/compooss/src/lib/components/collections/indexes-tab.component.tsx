"use client";

import { Badge, Button, ConfirmDestructiveModal, EmptyState, IconButton } from "@compooss/ui";
import { CreateIndexModal } from "@/lib/components/collections/create-index-modal.component";
import {
  useGetIndexes,
  useDropIndex,
  useHideIndex,
  type IndexWithStats,
} from "@/lib/services/indexes/indexes.service";
import { getIndexType, formatKeySpec } from "@/lib/utils";
import { Eye, EyeOff, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCollectionScope } from "@/lib/providers/collection-scope";
import { useState } from "react";

type Props = { readOnly?: boolean };

function IndexPropertiesBadges({ idx }: { idx: IndexWithStats }) {
  const badges: string[] = [];
  if (idx.unique) badges.push("unique");
  if (idx.sparse) badges.push("sparse");
  if (idx.expireAfterSeconds != null && idx.expireAfterSeconds > 0)
    badges.push("ttl");
  if (
    idx.partialFilterExpression &&
    Object.keys(idx.partialFilterExpression).length > 0
  )
    badges.push("partial");
  if (idx.hidden) badges.push("hidden");
  const key = idx.key ?? {};
  if (Object.values(key).includes("text")) badges.push("text");
  if (Object.values(key).includes("2dsphere")) badges.push("2dsphere");
  if (Object.values(key).includes("2d")) badges.push("2d");
  if (Object.values(key).includes("hashed")) badges.push("hashed");
  if (Object.keys(key).length > 1) badges.push("compound");
  if (badges.length === 0)
    return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <Badge key={b} variant="subtle" size="sm">
          {b}
        </Badge>
      ))}
    </div>
  );
}

export const IndexesTab: React.FC<Props> = ({ readOnly = false }) => {
  const { dbName, collectionName } = useCollectionScope();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const {
    data: indexes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetIndexes(dbName, collectionName, {
    enabled: !!dbName && !!collectionName,
  });

  const dropIndex = useDropIndex(dbName, collectionName, {
    onSuccess: () => setDropTarget(null),
    onError: () => setDropTarget(null),
  });
  const hideIndex = useHideIndex(dbName, collectionName);

  const handleConfirmDrop = () => {
    if (!dropTarget || dropTarget === "_id_") return;
    dropIndex.mutate(dropTarget);
  };

  const handleToggleHidden = (name: string, currentlyHidden: boolean) => {
    hideIndex.mutate({ indexName: name, hidden: !currentlyHidden });
  };

  if (isError && error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-destructive">Failed to load indexes</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          <Button variant="ghost" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground text-sm">
          Loading indexes…
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {indexes.length} index{indexes.length === 1 ? "" : "es"}
            </span>
            <IconButton
              variant="default"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              label="Refresh"
              onClick={() => refetch()}
            />
          </div>
          {!readOnly && (
            <Button
              variant="primary"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create index
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {indexes.length === 0 ? (
            <EmptyState
              title="No indexes"
              description="This collection has no indexes yet. Create an index to improve query performance."
              primaryAction={
                !readOnly
                  ? {
                      label: "Create index",
                      onClick: () => setCreateModalOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 font-medium text-foreground">
                      Name
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground">
                      Fields
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground text-right">
                      Usage (ops)
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground">
                      Properties
                    </th>
                    {!readOnly && (
                      <th className="px-4 py-3 font-medium text-foreground text-right">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {indexes.map((idx) => (
                    <tr
                      key={idx.name}
                      className="border-b border-border last:border-b-0 hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-foreground">
                        {idx.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {getIndexType(idx.key ?? {})}
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[240px] truncate"
                        title={formatKeySpec(idx.key ?? {})}
                      >
                        {formatKeySpec(idx.key ?? {})}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {idx.usage?.ops != null
                          ? idx.usage.ops.toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <IndexPropertiesBadges idx={idx} />
                      </td>
                      {!readOnly && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton
                              variant="default"
                              size="sm"
                              icon={
                                idx.hidden ? (
                                  <Eye className="h-3.5 w-3.5" />
                                ) : (
                                  <EyeOff className="h-3.5 w-3.5" />
                                )
                              }
                              label={idx.hidden ? "Unhide index" : "Hide index"}
                              onClick={() =>
                                handleToggleHidden(idx.name, !!idx.hidden)
                              }
                            />
                            <IconButton
                              variant="default"
                              size="sm"
                              icon={<Trash2 className="h-3.5 w-3.5" />}
                              label="Drop index"
                              onClick={() => setDropTarget(idx.name)}
                              disabled={idx.name === "_id_"}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CreateIndexModal
        open={createModalOpen}
        dbName={dbName}
        collectionName={collectionName}
        onClose={() => setCreateModalOpen(false)}
      />

      <ConfirmDestructiveModal
        open={dropTarget !== null}
        onClose={() => setDropTarget(null)}
        title="Drop index"
        icon={<Trash2 className="h-4 w-4" />}
        description={
          <>
            Are you sure you want to drop the index{" "}
            <strong className="text-foreground font-mono">{dropTarget}</strong>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Drop"
        onConfirm={handleConfirmDrop}
        isPending={dropIndex.isPending}
      />
    </>
  );
};
