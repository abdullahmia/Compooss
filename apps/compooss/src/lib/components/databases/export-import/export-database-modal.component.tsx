"use client";

import { CollectionChecklist } from "@/lib/components/databases/export-import/collection-checklist.component";
import { useGetCollections } from "@/lib/services/collections/collection.service";
import { useExportDatabase } from "@/lib/services/export/export.service";
import { formatBytes } from "@/lib/utils";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Toggle,
} from "@compooss/ui";
import { Download, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  dbName: string;
};

const plural = (count: number, noun: string) =>
  `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;

function ExportDatabaseDialog({ onClose, dbName }: Omit<Props, "open">) {
  const { data: collections = [], isLoading } = useGetCollections(dbName);
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [received, setReceived] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const exportable = useMemo(
    () =>
      collections
        .filter((collection) => !collection.name.startsWith("system."))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [collections],
  );
  const selected = exportable.filter((collection) => !excluded.has(collection.name));

  const { mutate: exportDatabase, isPending } = useExportDatabase({
    onSuccess: () => {
      toast.success(`Exported ${dbName}`);
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  const handleExport = () => {
    setError(null);
    setReceived(0);
    exportDatabase({
      db: dbName,
      collections: excluded.size > 0 ? selected.map((collection) => collection.name) : undefined,
      includeDocuments,
      onProgress: setReceived,
    });
  };

  const close = isPending ? () => {} : onClose;

  return (
    <Modal open onClose={close}>
      <ModalContent size="lg">
        <ModalHeader
          title={`Export ${dbName}`}
          icon={<Download className="h-4 w-4" />}
          onClose={isPending ? undefined : onClose}
        />
        <ModalBody className="space-y-4">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading collections…</p>
          ) : exportable.length === 0 ? (
            <p className="text-xs text-muted-foreground">This database has no collections to export.</p>
          ) : (
            <CollectionChecklist
              items={exportable.map((collection) => ({
                name: collection.name,
                type: collection.type,
                // collStats counts time series buckets, not documents.
                detail:
                  collection.type === "view"
                    ? "view"
                    : collection.type === "timeseries"
                      ? "time series"
                      : plural(collection.documentCount, "document"),
              }))}
              excluded={excluded}
              onChange={setExcluded}
            />
          )}

          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-md border border-border px-3 py-2.5">
            <span>
              <span className="block text-xs font-medium text-foreground">Include documents</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                Turn off to export only the structure: collections, views, validation rules
                and indexes.
              </span>
            </span>
            <Toggle
              checked={includeDocuments}
              onChange={setIncludeDocuments}
              label="Include documents"
              disabled={isPending}
            />
          </label>

          <p className="text-[11px] text-muted-foreground">
            Saved as one JSON file in Extended JSON, so dates, ObjectIds and number types come
            back as they were. Import it from the Databases page or into any database.
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-sm border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
              <XCircle className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="justify-between">
          <span className="text-xs tabular-nums text-muted-foreground">
            {isPending
              ? received > 0
                ? `Downloading… ${formatBytes(received)}`
                : "Preparing export…"
              : plural(selected.length, "collection")}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Download className="h-3.5 w-3.5" />}
              loading={isPending}
              disabled={selected.length === 0}
              onClick={handleExport}
            >
              {isPending ? "Exporting…" : "Export"}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** Exports a database's collections, views and indexes, with or without documents. */
export const ExportDatabaseModal: React.FC<Props> = ({ open, ...props }) =>
  open ? <ExportDatabaseDialog {...props} /> : null;
