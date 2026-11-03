"use client";

import type { MongoDocument } from "@/lib/types/document.type";
import {
  useDeleteDocument,
  useDuplicateDocument,
} from "@/lib/services/documents/documents.service";
import { getDocumentId } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  CopyPlus,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@compooss/ui";
import { toast } from "sonner";

export const JsonDocumentSkeleton: React.FC = () => {
  return (
    <div className="border border-border rounded-lg bg-card mb-3 shadow-xs animate-pulse">
      {/* Header - matches document card header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30 rounded-t-lg relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-muted" />
        <div className="w-5 h-5 rounded bg-muted shrink-0" />
        <div className="w-5 h-5 rounded bg-muted shrink-0" />
        <div className="h-3.5 bg-muted rounded w-32 font-mono shrink-0" />
        <div className="ml-auto flex items-center gap-1">
          <div className="w-8 h-8 rounded bg-muted" />
          <div className="w-8 h-8 rounded bg-muted" />
          <div className="w-8 h-8 rounded bg-muted" />
        </div>
      </div>
      {/* Body - key-value rows */}
      <div className="px-5 py-4 space-y-2">
        {["w-16", "w-24", "w-20", "w-28", "w-20"].map((keyWidth, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className={`h-3.5 bg-muted rounded shrink-0 ${keyWidth}`} />
            <span className="text-muted-foreground shrink-0">:</span>
            <div className="h-3.5 bg-muted rounded flex-1 max-w-[200px]" />
          </div>
        ))}
      </div>
    </div>
  );
};

type Props = {
  document: MongoDocument;
  index: number;
  onEdit?: (document: MongoDocument) => void;
  onDeleted?: () => void;
  /** Required for delete. If not provided, delete button is hidden or disabled. */
  dbName?: string;
  collectionName?: string;
  /** When true, edit and delete actions are hidden (e.g. for system databases). */
  readOnly?: boolean;
};

function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 0);

  if (value === null)
    return <span className="text-json-null font-mono text-xs">null</span>;
  if (typeof value === "boolean")
    return (
      <span className="text-json-boolean font-mono text-xs">
        {value.toString()}
      </span>
    );
  if (typeof value === "number")
    return <span className="text-json-number font-mono text-xs">{value}</span>;
  if (typeof value === "string")
    return (
      <span className="text-json-string font-mono text-xs">
        &quot;{value}&quot;
      </span>
    );

  if (Array.isArray(value)) {
    if (value.length === 0)
      return (
        <span className="text-muted-foreground font-mono text-xs">[ ]</span>
      );
    return (
      <span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span className="text-xs font-mono ml-0.5">
            Array({value.length})
          </span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-border/50 pl-3">
            {value.map((item, i) => (
              <div key={i} className="py-0.5">
                <span className="text-json-number font-mono text-xs mr-2">
                  {i}
                </span>
                <span className="text-muted-foreground mr-1">:</span>
                <JsonValue value={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0)
      return (
        <span className="text-muted-foreground font-mono text-xs">{"{ }"}</span>
      );

    if (keys.length === 1 && keys[0] === "$oid") {
      return (
        <span className="text-json-string font-mono text-xs">
          ObjectId(&quot;{obj.$oid as string}&quot;)
        </span>
      );
    }
    if (keys.length === 1 && keys[0] === "$date") {
      // $date can be a string (relaxed EJSON) or { $numberLong: "..." } (canonical)
      const raw = obj.$date;
      const dateStr =
        typeof raw === "string"
          ? raw
          : typeof raw === "object" && raw !== null && "$numberLong" in (raw as object)
            ? new Date(Number((raw as Record<string, string>).$numberLong)).toISOString()
            : String(raw);
      return (
        <span className="text-json-string font-mono text-xs">
          ISODate(&quot;{dateStr}&quot;)
        </span>
      );
    }
    if (keys.length === 1 && keys[0] === "$numberLong") {
      return (
        <span className="text-json-number font-mono text-xs">
          Long({obj.$numberLong as string})
        </span>
      );
    }
    if (keys.length === 1 && keys[0] === "$numberInt") {
      return (
        <span className="text-json-number font-mono text-xs">
          {obj.$numberInt as string}
        </span>
      );
    }
    if (keys.length === 1 && keys[0] === "$numberDouble") {
      return (
        <span className="text-json-number font-mono text-xs">
          {obj.$numberDouble as string}
        </span>
      );
    }
    if (keys.length === 1 && keys[0] === "$numberDecimal") {
      return (
        <span className="text-json-number font-mono text-xs">
          Decimal128({obj.$numberDecimal as string})
        </span>
      );
    }
    if (keys.length === 1 && keys[0] === "$timestamp") {
      const ts = obj.$timestamp as Record<string, number>;
      return (
        <span className="text-json-number font-mono text-xs">
          Timestamp({ts.t}, {ts.i})
        </span>
      );
    }
    if (keys.length === 1 && keys[0] === "$binary") {
      return (
        <span className="text-json-string font-mono text-xs">Binary(...)</span>
      );
    }
    if (keys.length === 1 && (keys[0] === "$minKey" || keys[0] === "$maxKey")) {
      return (
        <span className="text-muted-foreground font-mono text-xs">{keys[0]}</span>
      );
    }

    return (
      <span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span className="text-xs font-mono ml-0.5">
            Object({keys.length})
          </span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-border/50 pl-3">
            {keys.map((key) => (
              <div key={key} className="py-0.5">
                <span className="text-json-key font-mono text-xs">{key}</span>
                <span className="text-muted-foreground mx-1">:</span>
                <JsonValue value={obj[key]} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }

  return (
    <span className="text-foreground font-mono text-xs">{String(value)}</span>
  );
}

export const JsonDocument: React.FC<Props> = ({
  document,
  onEdit,
  onDeleted,
  dbName,
  collectionName,
  readOnly = false,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const docId = getDocumentId(document);
  const canWrite = !readOnly && !!(dbName && collectionName && docId);

  const { mutateAsync: deleteDocument, isPending: isDeleting } =
    useDeleteDocument(dbName ?? "", collectionName ?? "", {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        onDeleted?.();
      },
    });

  const { mutate: duplicateDocument, isPending: isDuplicating } =
    useDuplicateDocument(dbName ?? "", collectionName ?? "", {
      onSuccess: () => toast.success("Document duplicated"),
      onError: (error) => {
        const apiErr = error as { payload?: { message?: string } };
        toast.error(apiErr.payload?.message ?? "Duplicate failed.");
      },
    });

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(document, null, 2));
    toast.success("Document copied to clipboard");
  };

  const handleDeleteClick = () => {
    if (canWrite) setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!canWrite) return;
    await deleteDocument(docId);
  };

  return (
    <div className="border border-border rounded-lg bg-card mb-3 group shadow-xs hover:border-primary/20 transition-colors">
      {/* Document header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30 rounded-t-lg relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
        <IconButton
          variant="ghost"
          size="sm"
          icon={
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          }
          label={expanded ? "Collapse" : "Expand"}
          className="ml-1"
          onClick={() => setExpanded(!expanded)}
        />
        <FileText className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-mono text-json-string truncate">
          ObjectId(&quot;{getDocumentId(document)}&quot;)
        </span>

        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton
            variant="default"
            size="md"
            icon={<Copy className="h-3 w-3" />}
            label="Copy Document"
            onClick={handleCopy}
          />
          {!readOnly && (
            <IconButton
              variant="default"
              size="md"
              icon={<Pencil className="h-3 w-3" />}
              label="Edit Document"
              onClick={() => onEdit?.(document)}
            />
          )}
          {canWrite && (
            <IconButton
              variant="default"
              size="md"
              icon={<CopyPlus className="h-3 w-3" />}
              label="Duplicate Document"
              disabled={isDuplicating}
              onClick={() => duplicateDocument(docId)}
            />
          )}
          {canWrite && (
            <IconButton
              variant="danger"
              size="md"
              icon={<Trash2 className="h-3 w-3" />}
              label="Delete Document"
              onClick={handleDeleteClick}
            />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-4">
          {Object.entries(document).map(([key, value]) => (
            <div key={key} className="py-0.5 flex items-start">
              <span className="text-json-key font-mono text-xs min-w-[100px] shrink-0">
                {key}
              </span>
              <span className="text-muted-foreground mx-1.5">:</span>
              <JsonValue value={value} />
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation bar at the bottom */}
      {showDeleteConfirm && (
        <div className="px-4 py-3 border-t border-border bg-destructive/10 rounded-b-lg flex items-center justify-between gap-3">
          <p className="text-xs text-foreground">
            Delete this document? This action cannot be undone.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
