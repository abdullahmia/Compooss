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
import { createDatabaseSchema, type TCreateDatabaseFormData } from "@/lib/schemas";
import {
  useCreateDatabase,
  useGetDatabases,
} from "@/lib/services/database/database.service";
import { collectionPath } from "@/lib/utils/collection-path.util";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  onClose: () => void;
};

export const CreateDatabaseModal: React.FC<Props> = ({ onClose }) => {
  const router = useRouter();
  const { data: databases = [] } = useGetDatabases();
  const { mutateAsync: createDatabase, isPending } = useCreateDatabase({
    // A retried create would only fail with "already exists".
    retry: false,
  });

  const form = useForm<TCreateDatabaseFormData>({
    resolver: zodResolver(createDatabaseSchema),
    defaultValues: {
      dbName: "",
      collectionName: "",
    },
  });
  const hookForm = form as unknown as UseFormReturn<Record<string, unknown>>;
  const { errors } = form.formState;

  const close = isPending ? () => {} : onClose;

  const handleSubmit = async (values: TCreateDatabaseFormData) => {
    // MongoDB also rejects names that differ from an existing one only by case.
    const existing = databases.find(
      (db) => db.name.toLowerCase() === values.dbName.toLowerCase(),
    );
    if (existing) {
      form.setError("dbName", {
        message: `A database named "${existing.name}" already exists.`,
      });
      return;
    }

    try {
      await createDatabase(values);
    } catch (error) {
      const apiErr = error as { payload?: { message?: string } };
      form.setError("root.server", {
        message: apiErr.payload?.message ?? "The database couldn't be created.",
      });
      return;
    }

    toast.success(`Created database "${values.dbName}"`);
    router.push(collectionPath(values));
    onClose();
  };

  return (
    <Modal open onClose={close}>
      <ModalContent
        size="md"
        role="dialog"
        aria-modal="true"
        aria-label="Create database"
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
      >
        <ModalHeader
          title="Create database"
          icon={<Database className="h-4 w-4" />}
          onClose={isPending ? undefined : onClose}
        />

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <ModalBody>
            <div>
              <Input
                hookForm={hookForm}
                name="dbName"
                label="Database name"
                placeholder="e.g. my_database"
                variant="default"
                inputSize="md"
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
            </div>
            <div>
              <Input
                hookForm={hookForm}
                name="collectionName"
                label="First collection name"
                placeholder="e.g. my_collection"
                variant="default"
                inputSize="md"
                autoComplete="off"
                spellCheck={false}
              />
              {!errors.collectionName && (
                <p className="mt-1.5 ms-0.5 text-[11px] text-muted-foreground">
                  MongoDB doesn&apos;t keep empty databases, so the database is
                  created together with this collection.
                </p>
              )}
            </div>

            {errors.root?.server?.message && (
              <div
                role="alert"
                className="flex items-start gap-2 text-xs px-3 py-2.5 rounded-sm border bg-destructive/5 text-destructive border-destructive/20"
              >
                <XCircle className="h-3.5 w-3.5 mt-px shrink-0" />
                <span>{errors.root.server.message}</span>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              size="md"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              variant="primary"
              size="md"
              loading={isPending}
            >
              {isPending ? "Creating…" : "Create database"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
