"use client";

import { JsonEditor } from "@/lib/components/collections/json-editor.component";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@compooss/ui";
import { useUpdateDocument } from "@/lib/services/documents/documents.service";
import { stripJsonComments } from "@/lib/utils";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  dbName: string;
  collectionName: string;
  documentId?: string;
  initialJson?: string;
};

export const EditDocumentModal: React.FC<Props> = ({
  open,
  onClose,
  dbName,
  collectionName,
  documentId,
  initialJson,
}) => {
  const [json, setJson] = useState("{}");
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: updateDocument, isPending } = useUpdateDocument(
    dbName,
    collectionName,
    {
      onSuccess: () => {
        onClose();
        setError(null);
      },
      onError: (err) => {
        console.error(err);
      },
    },
  );

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      setError(null);
      if (initialJson != null) setJson(initialJson);
    });
    return () => cancelAnimationFrame(id);
  }, [open, initialJson]);

  const handleSubmit = async () => {
    setError(null);
    try {
      const cleaned = stripJsonComments(json).trim();
      if (!cleaned) {
        setError("Updated document JSON cannot be empty.");
        return;
      }

      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        setError("Provide a single JSON object, not an array.");
        return;
      }
      if (!parsed || typeof parsed !== "object") {
        setError("Document must be a JSON object.");
        return;
      }

      if (!documentId) {
        setError("Missing document id.");
        return;
      }
      const incomingId = (parsed as Record<string, unknown>)._id;
      if (
        incomingId !== undefined &&
        incomingId !== null &&
        String(incomingId) !== String(documentId)
      ) {
        setError("`_id` is read-only and cannot be changed during edit.");
        return;
      }
      const { _id: _, ...payload } = parsed as Record<string, unknown>;
      if (Object.keys(payload).length === 0) {
        setError("Update must contain at least one field besides _id.");
        return;
      }
      await updateDocument({ documentId, payload });
    } catch (err) {
      let message = "Invalid JSON. Please check the syntax.";
      if (err instanceof Error) {
        const payload = (err as Error & { payload?: unknown }).payload;
        if (
          payload &&
          typeof payload === "object" &&
          "message" in payload &&
          typeof (payload as { message: unknown }).message === "string"
        ) {
          message = (payload as { message: string }).message;
        } else {
          message = err.message;
        }
      }
      setError(message);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent size="lg">
        <ModalHeader title={`Edit document in ${dbName}.${collectionName}`} onClose={onClose} />
        <ModalBody>
          <p className="text-xs text-muted-foreground">
            Edit the document JSON below. The <code>_id</code> field is treated as
            read-only and must not be changed.
          </p>
          <div className="mt-2">
            <JsonEditor value={json} onChange={setJson} />
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={isPending}
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
