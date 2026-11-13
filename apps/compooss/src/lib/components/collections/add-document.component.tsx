"use client";

import { InsertDocumentsModal } from "@/lib/components/collections/insert-documents/insert-documents-modal.component";
import { Button } from "@compooss/ui";
import { Plus } from "lucide-react";
import { useState } from "react";

type Props = {
  dbName: string;
  collectionName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Dotted paths of fields seen in the collection, offered as field names. */
  fieldSuggestions?: string[];
};

export const AddDocument: React.FC<Props> = ({
  dbName,
  collectionName,
  open: controlledOpen,
  onOpenChange,
  fieldSuggestions,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const canAdd = !!dbName && !!collectionName;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        icon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => setOpen(true)}
        disabled={!canAdd}
      >
        Add Data
      </Button>
      <InsertDocumentsModal
        open={open}
        onClose={() => setOpen(false)}
        dbName={dbName}
        collectionName={collectionName}
        fieldSuggestions={fieldSuggestions}
      />
    </>
  );
};
