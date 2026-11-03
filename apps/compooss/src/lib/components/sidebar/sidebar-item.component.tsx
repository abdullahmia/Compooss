"use client";

import { Badge, ConfirmDestructiveModal, IconButton } from "@compooss/ui";
import { SidebarCollectionSkeleton } from "./sidebar-collection-skeleton.component";
import { CreateCollectionModal } from "@/lib/components/collections/create-collection-modal.component";
import { RenameCollectionModal } from "@/lib/components/collections/rename-collection-modal.component";
import { isProtectedDatabase } from "@compooss/types";
import { useConnection } from "@/lib/providers/connection-provider";
import { useDeleteDatabase } from "@/lib/services/database/database.service";
import {
  useDeleteCollection,
  useGetCollections,
} from "@/lib/services/collections/collection.service";
import type { Collection, Database } from "@compooss/types";
import {
  ChevronDown,
  ChevronRight,
  DatabaseBackupIcon,
  Pencil,
  Plus,
  Table,
  Trash2,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { workspaceTabs } from "@/lib/hooks/use-workspace-tabs.hook";
import {
  collectionPath,
  databaseFromPath,
  parseCollectionPath,
} from "@/lib/utils/collection-path.util";
import React, { useState } from "react";

type Props = {
  db: Database;
  isExpanded: boolean;
  onToggleExpand: () => void;
};

export const SidebarItem: React.FC<Props> = ({
  db,
  isExpanded: expanded,
  onToggleExpand,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const activeDbName = databaseFromPath(pathname);
  const { isReadOnly } = useConnection();
  const isProtected = isReadOnly || isProtectedDatabase(db.name);

  const [deleteDbModalOpen, setDeleteDbModalOpen] = useState(false);
  const [addCollectionModalOpen, setAddCollectionModalOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] =
    useState<Collection | null>(null);
  const [collectionToRename, setCollectionToRename] = useState<string | null>(null);

  const { data: collections, isLoading: isLoadingCollections } = useGetCollections(db.name, {
    enabled: expanded,
  });

  const { mutateAsync: deleteDatabase, isPending: isDeletingDb } =
    useDeleteDatabase({
      onSuccess: () => {
        setDeleteDbModalOpen(false);
        workspaceTabs.closeDropped(db.name);
        if (activeDbName === db.name) router.push("/databases");
      },
    });

  const { mutateAsync: deleteCollection, isPending: isDeletingCol } =
    useDeleteCollection(db.name, {
      onSuccess: (_data, collectionName) => {
        setCollectionToDelete(null);
        workspaceTabs.closeDropped(db.name, collectionName);
        const viewing = parseCollectionPath(pathname);
        if (viewing?.dbName === db.name && viewing.collectionName === collectionName) {
          router.push(`/databases/${encodeURIComponent(db.name)}`);
        }
      },
    });

  const handleSelectCollection = (collection: Collection) => {
    router.push(collectionPath({ dbName: db.name, collectionName: collection.name }));
  };

  const handleDeleteDbClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDbModalOpen(true);
  };

  const handleAddCollectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAddCollectionModalOpen(true);
  };

  const handleConfirmDeleteDb = async () => {
    await deleteDatabase(db.name);
  };

  const handleDeleteCollectionClick = (
    e: React.MouseEvent,
    collection: Collection,
  ) => {
    e.stopPropagation();
    setCollectionToDelete(collection);
  };

  const handleConfirmDeleteCollection = async () => {
    if (!collectionToDelete) return;
    await deleteCollection(collectionToDelete.name);
  };

  const handleNavigate = () => {
    if (!expanded) onToggleExpand();
    router.push(`/databases/${db.name}`);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleExpand();
  };

  return (
    <>
      <div key={db.name}>
        <div
          onClick={handleNavigate}
          className="group flex items-center w-full hover:bg-sidebar-accent transition-colors"
        >
          <IconButton
            icon={
              expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )
            }
            label={expanded ? "Collapse" : "Expand"}
            variant="ghost"
            size="sm"
            onClick={handleChevronClick}
          />
          <div className="flex-1 flex items-center gap-1.5 px-1 py-1.5 text-xs cursor-pointer min-w-0 text-sidebar-foreground hover:text-sidebar-foreground no-underline">
            <DatabaseBackupIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium truncate">{db.name}</span>
          </div>
          <div className="relative flex items-center shrink-0 pr-3">
            <Badge
              variant="subtle"
              size="sm"
              className="shrink-0 transition-transform duration-200 ease-out group-hover:-translate-x-10"
            >
              {db.sizeOnDisk}
            </Badge>
            {!isProtected && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 ml-5 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto">
                <IconButton
                  icon={<Plus className="h-3 w-3" />}
                  label="Add collection"
                  variant="default"
                  size="sm"
                  className="shrink-0"
                  onClick={handleAddCollectionClick}
                />
                <IconButton
                  icon={<Trash2 className="h-3 w-3" />}
                  label="Delete database"
                  variant="danger"
                  size="sm"
                  className="shrink-0"
                  onClick={handleDeleteDbClick}
                />
              </div>
            )}
          </div>
        </div>

        {expanded && (
          <div className="ml-4">
            {isLoadingCollections && <SidebarCollectionSkeleton />}
            {!isLoadingCollections && collections?.map((col) => (
              <div
                key={col.name}
                className="group/col flex items-center w-full hover:bg-sidebar-accent transition-colors"
              >
                <button
                  type="button"
                  onClick={() => handleSelectCollection(col)}
                  className="flex-1 flex items-center gap-1.5 pl-5 pr-2 py-1.5 text-xs text-sidebar-foreground cursor-pointer text-left min-w-0"
                >
                  <Table className="h-3 w-3 shrink-0" />
                  <span className="truncate">{col.name}</span>
                </button>
                <div className="flex items-center shrink-0 pr-2">
                  <Badge
                    variant="subtle"
                    size="sm"
                    className="shrink-0 transition-transform duration-200 ease-out group-hover/col:-translate-x-1"
                  >
                    {col.documentCount.toLocaleString()}
                  </Badge>
                  {!isProtected && (
                    <>
                      <IconButton
                        icon={<Pencil className="h-3 w-3" />}
                        label="Rename collection"
                        variant="toolbar"
                        size="sm"
                        className="opacity-0 translate-x-1 group-hover/col:opacity-100 group-hover/col:translate-x-0 transition-all duration-200 ease-out shrink-0"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setCollectionToRename(col.name);
                        }}
                      />
                      <IconButton
                        icon={<Trash2 className="h-3 w-3" />}
                        label="Delete collection"
                        variant="danger"
                        size="sm"
                        className="opacity-0 translate-x-1 group-hover/col:opacity-100 group-hover/col:translate-x-0 transition-all duration-200 ease-out shrink-0"
                        onClick={(e: React.MouseEvent) =>
                          handleDeleteCollectionClick(e, col)
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateCollectionModal
        open={addCollectionModalOpen}
        dbName={db.name}
        onClose={() => setAddCollectionModalOpen(false)}
      />

      <RenameCollectionModal
        dbName={db.name}
        collectionName={collectionToRename}
        onClose={() => setCollectionToRename(null)}
      />

      <ConfirmDestructiveModal
        open={deleteDbModalOpen}
        onClose={() => setDeleteDbModalOpen(false)}
        title="Delete database"
        icon={<Trash2 className="h-4 w-4" />}
        description={
          <>
            Are you sure you want to delete <strong>{db.name}</strong>? This
            will remove the database and all its collections. This action cannot
            be undone.
          </>
        }
        onConfirm={handleConfirmDeleteDb}
        isPending={isDeletingDb}
      />

      <ConfirmDestructiveModal
        open={!!collectionToDelete}
        onClose={() => setCollectionToDelete(null)}
        title="Delete collection"
        icon={<Trash2 className="h-4 w-4" />}
        description={
          <>
            Are you sure you want to delete{" "}
            <strong>{collectionToDelete?.name}</strong> from{" "}
            <strong>{db.name}</strong>? All documents in this collection will be
            removed. This action cannot be undone.
          </>
        }
        onConfirm={handleConfirmDeleteCollection}
        isPending={isDeletingCol}
      />
    </>
  );
};
