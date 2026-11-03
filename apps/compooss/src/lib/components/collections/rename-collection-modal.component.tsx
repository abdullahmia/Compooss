"use client";

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@compooss/ui";
import { renameCollectionSchema, type TRenameCollectionInput } from "@/lib/schemas";
import { workspaceTabs } from "@/lib/hooks/use-workspace-tabs.hook";
import { collectionPath, parseCollectionPath } from "@/lib/utils/collection-path.util";
import { useRenameCollection } from "@/lib/services/collections/collection.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  dbName: string;
  /** The collection to rename; the modal is open while this is set. */
  collectionName: string | null;
  onClose: () => void;
};

export const RenameCollectionModal: React.FC<Props> = ({
  dbName,
  collectionName,
  onClose,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const form = useForm<TRenameCollectionInput>({
    resolver: zodResolver(renameCollectionSchema),
    values: { newName: collectionName ?? "" },
  });

  const { mutateAsync: renameCollection, isPending } = useRenameCollection(dbName, {
    onSuccess: (_data, { collectionName: oldName, newName }) => {
      toast.success(`Renamed "${oldName}" to "${newName}"`);
      workspaceTabs.rename(dbName, oldName, newName);
      // Keep the user on the renamed collection if they were viewing it.
      const viewing = parseCollectionPath(pathname);
      if (viewing?.dbName === dbName && viewing.collectionName === oldName) {
        const query = searchParams.toString();
        router.replace(
          `${collectionPath({ dbName, collectionName: newName })}${query ? `?${query}` : ""}`,
        );
      }
      onClose();
    },
    onError: (error) => {
      const apiErr = error as { payload?: { message?: string } };
      toast.error(apiErr.payload?.message ?? "Rename failed.");
    },
  });

  const handleSubmit = async ({ newName }: TRenameCollectionInput) => {
    if (!collectionName || newName === collectionName) {
      onClose();
      return;
    }
    await renameCollection({ collectionName, newName });
  };

  return (
    <Modal open={collectionName !== null} onClose={onClose}>
      <ModalContent size="sm">
        <ModalHeader
          title="Rename collection"
          icon={<Pencil className="h-4 w-4" />}
          onClose={onClose}
        />
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <ModalBody>
            <Input
              hookForm={form as unknown as UseFormReturn<Record<string, unknown>>}
              name="newName"
              label={`New name for ${dbName}.${collectionName ?? ""}`}
              variant="default"
              inputSize="md"
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button type="button" onClick={onClose} variant="outline" size="md">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isPending} disabled={isPending}>
              Rename
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
