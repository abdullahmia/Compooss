"use client";

import { BulkFilterSummary } from "@/lib/components/collections/bulk-filter-summary.component";
import { isEmptyObjectString } from "@/lib/hooks/use-query-history.hook";
import {
  useBulkDelete,
  useBulkPreview,
} from "@/lib/services/documents/documents.service";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@compooss/ui";
import { getApiErrorMessage } from "@/lib/utils/api-error.util";
import { Trash2, XCircle } from "lucide-react";
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

export const BulkDeleteModal: React.FC<Props> = ({
  open,
  onClose,
  dbName,
  collectionName,
  filter,
}) => {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const preview = useBulkPreview(dbName, collectionName, "delete", filter, {
    enabled: open,
  });
  const matchedCount = preview.data?.matchedCount;
  // Emptying a whole collection needs its name typed out.
  const needsTypedConfirmation = isEmptyObjectString(filter);
  const confirmed = !needsTypedConfirmation || confirmation === collectionName;

  const handleClose = () => {
    setConfirmation("");
    setError(null);
    onClose();
  };

  const { mutate: bulkDelete, isPending } = useBulkDelete(dbName, collectionName, {
    onSuccess: (result) => {
      toast.success(`Deleted ${result.deletedCount.toLocaleString()} documents`);
      handleClose();
    },
    onError: (err) => setError(getApiErrorMessage(err, "Delete failed.")),
  });

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent size="lg">
        <ModalHeader
          title="Delete documents"
          icon={<Trash2 className="h-4 w-4" />}
          onClose={handleClose}
        />
        <ModalBody className="space-y-4">
          <BulkFilterSummary
            filter={filter}
            matchedCount={matchedCount}
            isLoading={preview.isLoading}
            error={preview.isError ? getApiErrorMessage(preview.error, "Could not count matching documents.") : null}
          />

          {needsTypedConfirmation && !!matchedCount && (
            <Input
              label={`Type ${collectionName} to confirm`}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={collectionName}
              variant="default"
              inputSize="md"
              autoComplete="off"
            />
          )}

          <p className="text-xs text-muted-foreground">This cannot be undone.</p>

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
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              setError(null);
              bulkDelete(filter);
            }}
            loading={isPending}
            disabled={isPending || !matchedCount || !confirmed}
          >
            {matchedCount === undefined
              ? "Delete documents"
              : `Delete ${matchedCount.toLocaleString()} document${matchedCount === 1 ? "" : "s"}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
