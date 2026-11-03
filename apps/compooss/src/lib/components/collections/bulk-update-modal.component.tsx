"use client";

import { JsonEditor } from "@/lib/components/collections/json-editor.component";
import { BulkFilterSummary } from "@/lib/components/collections/bulk-filter-summary.component";
import {
  useBulkPreview,
  useBulkUpdate,
} from "@/lib/services/documents/documents.service";
import { stripJsonComments } from "@/lib/utils";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@compooss/ui";
import { getApiErrorMessage } from "@/lib/utils/api-error.util";
import { PencilLine, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  dbName: string;
  collectionName: string;
  /** The filter currently applied in the Documents tab. */
  filter: string;
};

const DEFAULT_UPDATE = `{
  "$set": {

  }
}`;

export const BulkUpdateModal: React.FC<Props> = ({
  open,
  onClose,
  dbName,
  collectionName,
  filter,
}) => {
  const [update, setUpdate] = useState(DEFAULT_UPDATE);
  const [error, setError] = useState<string | null>(null);

  const preview = useBulkPreview(dbName, collectionName, "update", filter, {
    enabled: open,
  });
  const matchedCount = preview.data?.matchedCount;

  const { mutate: bulkUpdate, isPending } = useBulkUpdate(dbName, collectionName, {
    onSuccess: (result) => {
      toast.success(
        `Updated ${result.modifiedCount.toLocaleString()} of ${result.matchedCount.toLocaleString()} matching documents`,
      );
      setUpdate(DEFAULT_UPDATE);
      onClose();
    },
    onError: (err) => setError(getApiErrorMessage(err, "Update failed.")),
  });

  const handleSubmit = () => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(stripJsonComments(update));
    } catch {
      setError("The update is not valid JSON.");
      return;
    }
    bulkUpdate({ filter, update: parsed });
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent size="xl">
        <ModalHeader
          title="Update documents"
          icon={<PencilLine className="h-4 w-4" />}
          onClose={handleClose}
        />
        <ModalBody className="space-y-4">
          <BulkFilterSummary
            filter={filter}
            matchedCount={matchedCount}
            isLoading={preview.isLoading}
            error={preview.isError ? getApiErrorMessage(preview.error, "Could not count matching documents.") : null}
          />

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Update</p>
            <JsonEditor value={update} onChange={setUpdate} height="200px" />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Use update operators such as <code>$set</code>, <code>$unset</code> or{" "}
              <code>$inc</code>, or an aggregation pipeline array. Extended JSON like{" "}
              <code>{`{ "$date": "2026-01-01T00:00:00Z" }`}</code> is stored as the real type.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs px-3 py-2.5 rounded-sm border bg-destructive/5 text-destructive border-destructive/20">
              <XCircle className="h-3.5 w-3.5 mt-px shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" size="md" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={isPending}
            disabled={isPending || !matchedCount}
          >
            {matchedCount === undefined
              ? "Update documents"
              : `Update ${matchedCount.toLocaleString()} document${matchedCount === 1 ? "" : "s"}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
