"use client";

import { saveQuerySchema, type TSaveQueryInput } from "@/lib/schemas";
import type { QueryBarValues } from "@compooss/types";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@compooss/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bookmark } from "lucide-react";
import { useForm, type UseFormReturn } from "react-hook-form";

type Props = {
  /** The query to save; the modal is open while this is set. */
  query: QueryBarValues | null;
  onSave: (name: string, query: QueryBarValues) => void;
  onClose: () => void;
};

export const SaveQueryModal: React.FC<Props> = ({ query, onSave, onClose }) => {
  const form = useForm<TSaveQueryInput>({
    resolver: zodResolver(saveQuerySchema),
    values: { name: "" },
  });

  const handleSubmit = ({ name }: TSaveQueryInput) => {
    if (query) onSave(name, query);
    onClose();
  };

  return (
    <Modal open={query !== null} onClose={onClose}>
      <ModalContent size="sm">
        <ModalHeader
          title="Save query"
          icon={<Bookmark className="h-4 w-4" />}
          onClose={onClose}
        />
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <ModalBody className="space-y-3">
            <Input
              hookForm={form as unknown as UseFormReturn<Record<string, unknown>>}
              name="name"
              label="Name"
              placeholder="e.g. Active users this month"
              variant="default"
              inputSize="md"
              autoFocus
            />
            {query && (
              <pre className="text-[11px] font-mono text-muted-foreground bg-secondary rounded-sm border border-border px-3 py-2 whitespace-pre-wrap break-all max-h-32 overflow-auto">
                {query.filter}
              </pre>
            )}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
