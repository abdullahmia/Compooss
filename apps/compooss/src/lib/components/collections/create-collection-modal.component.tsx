"use client";

import {
  Button,
  cn,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@compooss/ui";
import { createCollectionSchema, type TCreateCollectionInput } from "@/lib/schemas";
import { useCreateCollection } from "@/lib/services/collections/collection.service";
import type { CollectionKind, CreateCollectionOptions } from "@compooss/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

type Props = {
  open: boolean;
  dbName: string;
  onClose: () => void;
};

const KINDS: { value: CollectionKind; label: string; description: string }[] = [
  { value: "standard", label: "Standard", description: "A regular collection" },
  { value: "capped", label: "Capped", description: "Fixed size, oldest documents removed first" },
  { value: "timeseries", label: "Time series", description: "Measurements stored by time" },
];

const DEFAULT_VALUES: TCreateCollectionInput = {
  collectionName: "",
  kind: "standard",
  cappedSize: "",
  cappedMax: "",
  timeField: "",
  metaField: "",
  granularity: "",
  expireAfterSeconds: "",
};

function toOptions(values: TCreateCollectionInput): CreateCollectionOptions | undefined {
  if (values.kind === "capped") {
    return {
      capped: {
        size: Number(values.cappedSize),
        ...(values.cappedMax?.trim() && { max: Number(values.cappedMax) }),
      },
    };
  }
  if (values.kind === "timeseries") {
    return {
      timeseries: {
        timeField: values.timeField!.trim(),
        ...(values.metaField?.trim() && { metaField: values.metaField.trim() }),
        ...(values.granularity && { granularity: values.granularity }),
      },
      ...(values.expireAfterSeconds?.trim() && {
        expireAfterSeconds: Number(values.expireAfterSeconds),
      }),
    };
  }
  return undefined;
}

export const CreateCollectionModal: React.FC<Props> = ({
  open,
  dbName,
  onClose,
}) => {
  const form = useForm<TCreateCollectionInput>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const hookForm = form as unknown as UseFormReturn<Record<string, unknown>>;
  const kind = useWatch({ control: form.control, name: "kind" });

  const { mutateAsync: createCollection, isPending } = useCreateCollection(
    dbName,
    {
      onSuccess: () => {
        form.reset(DEFAULT_VALUES);
        onClose();
      },
    },
  );

  const handleSubmit = async (values: TCreateCollectionInput) => {
    await createCollection({
      collectionName: values.collectionName,
      options: toOptions(values),
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent size="md">
        <ModalHeader
          title="Create collection"
          icon={<Plus className="h-4 w-4" />}
          onClose={onClose}
        />
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <ModalBody className="space-y-4">
            <Input
              hookForm={hookForm}
              name="collectionName"
              label="Collection name"
              placeholder="e.g. my_collection"
              variant="default"
              inputSize="md"
              autoFocus
            />

            <div>
              <Label>Type</Label>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Collection type">
                {KINDS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={kind === option.value}
                    onClick={() => form.setValue("kind", option.value)}
                    className={cn(
                      "text-left rounded-sm border px-3 py-2 transition-colors",
                      kind === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-secondary",
                    )}
                  >
                    <span className="block text-xs font-medium text-foreground">
                      {option.label}
                    </span>
                    <span className="block text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {kind === "capped" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  hookForm={hookForm}
                  name="cappedSize"
                  label="Maximum size (bytes)"
                  placeholder="e.g. 1048576"
                  inputMode="numeric"
                  inputSize="md"
                />
                <Input
                  hookForm={hookForm}
                  name="cappedMax"
                  label="Maximum documents (optional)"
                  placeholder="No limit"
                  inputMode="numeric"
                  inputSize="md"
                />
              </div>
            )}

            {kind === "timeseries" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  hookForm={hookForm}
                  name="timeField"
                  label="Time field"
                  placeholder="e.g. timestamp"
                  inputSize="md"
                />
                <Input
                  hookForm={hookForm}
                  name="metaField"
                  label="Meta field (optional)"
                  placeholder="e.g. sensorId"
                  inputSize="md"
                />
                <div>
                  <Label htmlFor="granularity">Granularity (optional)</Label>
                  <select
                    id="granularity"
                    {...form.register("granularity")}
                    className="w-full bg-secondary text-sm px-3 py-2 rounded-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="">Default (seconds)</option>
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
                <Input
                  hookForm={hookForm}
                  name="expireAfterSeconds"
                  label="Expire after seconds (optional)"
                  placeholder="Never"
                  inputMode="numeric"
                  inputSize="md"
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button type="button" onClick={onClose} variant="outline" size="md">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              variant="primary"
              size="md"
              loading={isPending}
            >
              {isPending ? "Creating…" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
