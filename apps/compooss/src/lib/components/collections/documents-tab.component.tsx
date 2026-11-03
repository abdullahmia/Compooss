"use client";

import { EmptyState } from "@compooss/ui";
import {
  JsonDocumentSkeleton,
  JsonDocument,
} from "@/lib/components/collections/json-document.component";
import { getDocumentId } from "@/lib/utils";
import { useGetDocuments } from "@/lib/services/documents/documents.service";
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Download,
  FileText,
  Grid3X3,
  PencilLine,
  Trash2,
  Upload,
} from "lucide-react";
import { useCollectionScope } from "@/lib/providers/collection-scope";
import { useCallback, useMemo, useState } from "react";
import {
  QueryBar,
  type QueryBarState,
} from "@/lib/components/collections/query-bar.component";
import { QUERY_BAR_DEFAULT_STATE } from "@/lib/constants";
import { Button, IconButton } from "@compooss/ui";
import { AddDocument } from "@/lib/components/collections/add-document.component";
import { DocumentFormModal } from "@/lib/components/collections/document-form-modal.component";
import { ExportModal } from "@/lib/components/collections/export-import/export-modal.component";
import { ImportModal } from "@/lib/components/collections/export-import/import-modal.component";
import { BulkDeleteModal } from "@/lib/components/collections/bulk-delete-modal.component";
import { BulkUpdateModal } from "@/lib/components/collections/bulk-update-modal.component";

type Props = { readOnly?: boolean };

function getFieldsFromDocs(docs: Record<string, unknown>[]): string[] {
  const fields = new Set<string>();
  const extract = (obj: Record<string, unknown>, prefix = "") => {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      fields.add(path);
      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        extract(obj[key] as Record<string, unknown>, path);
      }
    }
  };
  docs.forEach((doc) => extract(doc));
  return Array.from(fields).sort();
}

export const DocumentsTab: React.FC<Props> = ({ readOnly = false }) => {
  const [viewMode, setViewMode] = useState<"list" | "json" | "table">("list");
  const [queryParams, setQueryParams] = useState<QueryBarState>(
    QUERY_BAR_DEFAULT_STATE,
  );
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"update" | "delete" | null>(null);
  const [editingDocument, setEditingDocument] = useState<{
    id: string;
    json: string;
  } | null>(null);

  const { dbName, collectionName } = useCollectionScope();
  const {
    data,
    error: queryError,
    isError,
    isLoading,
  } = useGetDocuments(dbName, collectionName, {
    enabled: !!dbName && !!collectionName,
    queryParams: {
      filter: queryParams.filter,
      sort: queryParams.sort,
      project: queryParams.project,
      limit: queryParams.limit,
      skip: queryParams.skip,
    },
  });

  const documents = useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;
  const currentPage = data?.page ?? 1;
  const pageCount = Math.max(1, data?.totalPages ?? 1);
  const hasNextPage = data?.hasNextPage ?? false;
  const hasPrevPage = data?.hasPrevPage ?? false;
  const startIndex =
    total === 0
      ? 0
      : (currentPage - 1) * (data?.limit ?? queryParams.limit) + 1;
  const endIndex =
    total === 0 ? 0 : Math.min(startIndex + documents.length - 1, total);

  const fieldSuggestions = useMemo(
    () => getFieldsFromDocs(documents),
    [documents],
  );

  const handleRunQuery = useCallback((state: QueryBarState) => {
    setQueryParams(state);
  }, []);

  const handlePrev = useCallback(() => {
    setQueryParams((prev) => ({
      ...prev,
      skip: Math.max(0, prev.skip - prev.limit),
    }));
  }, []);

  const handleNext = useCallback(() => {
    setQueryParams((prev) => ({
      ...prev,
      skip: prev.skip + prev.limit,
    }));
  }, []);

  const handleOpenEdit = (doc: Record<string, unknown>) => {
    setEditingDocument({
      id: getDocumentId(doc),
      json: JSON.stringify(doc, null, 2),
    });
  };

  return (
    <>
      <QueryBar
        onRunQuery={handleRunQuery}
        historyNamespace={`${dbName}.${collectionName}`}
        fieldSuggestions={fieldSuggestions}
      />

      {isError && queryError && (
        <div className="px-4 py-2 text-xs text-destructive bg-destructive/10 border-b border-destructive/30">
          {queryError.message}
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/30">
        <div className="flex items-center gap-2">
          <IconButton
            variant={viewMode === "list" ? "active" : "default"}
            icon={<FileText className="h-3.5 w-3.5" />}
            label="List view"
            onClick={() => setViewMode("list")}
          />
          <IconButton
            variant={viewMode === "json" ? "active" : "default"}
            size="md"
            icon={<Code2 className="h-3.5 w-3.5" />}
            label="JSON view"
            onClick={() => setViewMode("json")}
          />
          <IconButton
            variant={viewMode === "table" ? "active" : "default"}
            size="md"
            icon={<Grid3X3 className="h-3.5 w-3.5" />}
            label="Table view"
            onClick={() => setViewMode("table")}
          />
          <span className="text-xs text-muted-foreground ml-2">
            Displaying {total === 0 ? "0" : `${startIndex}–${endIndex}`} of{" "}
            {total.toLocaleString()} documents
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={() => setExportModalOpen(true)}
            disabled={!dbName || !collectionName}
          >
            Export
          </Button>
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Upload className="h-3.5 w-3.5" />}
              onClick={() => setImportModalOpen(true)}
              disabled={!dbName || !collectionName}
            >
              Import
            </Button>
          )}
          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<PencilLine className="h-3.5 w-3.5" />}
                onClick={() => setBulkAction("update")}
                disabled={total === 0}
              >
                Update
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => setBulkAction("delete")}
                disabled={total === 0}
                className="text-destructive hover:text-destructive/80"
              >
                Delete
              </Button>
            </>
          )}
          {!readOnly && (
            <AddDocument
              dbName={dbName}
              collectionName={collectionName}
              open={addModalOpen}
              onOpenChange={setAddModalOpen}
            />
          )}
          <div className="flex items-center ml-3">
            <IconButton
              variant="default"
              size="sm"
              icon={<ChevronLeft className="h-3.5 w-3.5" />}
              label="Previous page"
              onClick={handlePrev}
              disabled={!hasPrevPage}
            />
            <span className="text-xs text-muted-foreground px-2">
              {currentPage} / {pageCount}
            </span>
            <IconButton
              variant="default"
              size="sm"
              icon={<ChevronRight className="h-3.5 w-3.5" />}
              label="Next page"
              onClick={handleNext}
              disabled={!hasNextPage || total === 0}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-0">
        {isLoading ? (
          viewMode === "list" ? (
            Array.from({ length: 5 }).map((_, i) => (
              <JsonDocumentSkeleton key={i} />
            ))
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading documents…
            </div>
          )
        ) : documents.length === 0 ? (
          <EmptyState
            title="No documents"
            description="No documents match the current filter. Try adjusting the filter or add a new document."
            primaryAction={
              !readOnly
                ? {
                    label: "Add document",
                    onClick: () => setAddModalOpen(true),
                  }
                : undefined
            }
          />
        ) : viewMode === "list" ? (
          documents.map((doc, i) => (
            <JsonDocument
              key={getDocumentId(doc, i)}
              document={doc}
              index={startIndex - 1 + i}
              onEdit={readOnly ? undefined : handleOpenEdit}
              dbName={readOnly ? undefined : dbName}
              collectionName={readOnly ? undefined : collectionName}
              readOnly={readOnly}
            />
          ))
        ) : viewMode === "json" ? (
          <pre className="text-xs font-mono text-foreground bg-card p-4 rounded-sm border border-border overflow-auto">
            {JSON.stringify(documents, null, 2)}
          </pre>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {Object.keys(documents[0]).map((key) => (
                    <th
                      key={key}
                      className="px-3 py-2 text-left font-medium text-muted-foreground bg-muted/30 whitespace-nowrap"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => (
                  <tr
                    key={getDocumentId(doc, i)}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    {Object.values(doc).map((val, i) => (
                      <td
                        key={i}
                        className="px-3 py-2 font-mono text-foreground whitespace-nowrap max-w-[200px] truncate"
                      >
                        {typeof val === "object"
                          ? JSON.stringify(val)
                          : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!readOnly && (
        <DocumentFormModal
          open={editingDocument !== null}
          onClose={() => setEditingDocument(null)}
          mode="edit"
          dbName={dbName}
          collectionName={collectionName}
          documentId={editingDocument?.id}
          initialJson={editingDocument?.json}
        />
      )}

      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        dbName={dbName}
        collectionName={collectionName}
        currentFilter={queryParams.filter}
        totalDocuments={total}
      />

      {!readOnly && (
        <>
          <BulkUpdateModal
            open={bulkAction === "update"}
            onClose={() => setBulkAction(null)}
            dbName={dbName}
            collectionName={collectionName}
            filter={queryParams.filter}
          />
          <BulkDeleteModal
            open={bulkAction === "delete"}
            onClose={() => setBulkAction(null)}
            dbName={dbName}
            collectionName={collectionName}
            filter={queryParams.filter}
          />
        </>
      )}

      {!readOnly && (
        <ImportModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          dbName={dbName}
          collectionName={collectionName}
        />
      )}
    </>
  );
};
