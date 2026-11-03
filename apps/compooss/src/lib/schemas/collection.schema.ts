import { z } from "zod";

const collectionName = z
  .string()
  .min(1, { message: "Collection name is required." })
  .regex(/^[a-zA-Z0-9_\-]+$/, {
    message:
      "Collection name can only contain letters, numbers, underscores, and hyphens.",
  });

const isPositiveInteger = (value: string) => /^\d+$/.test(value) && Number(value) > 0;

export const createCollectionSchema = z
  .object({
    collectionName,
    kind: z.enum(["standard", "capped", "timeseries"]),
    // Numeric fields stay strings in the form and are converted on submit.
    cappedSize: z.string().optional(),
    cappedMax: z.string().optional(),
    timeField: z.string().optional(),
    metaField: z.string().optional(),
    granularity: z.enum(["", "seconds", "minutes", "hours"]).optional(),
    expireAfterSeconds: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const requirePositive = (field: keyof typeof values, value = "", required = false) => {
      const trimmed = value.trim();
      if (!trimmed && !required) return;
      if (!isPositiveInteger(trimmed)) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: required && !trimmed ? "This field is required." : "Enter a whole number greater than 0.",
        });
      }
    };

    if (values.kind === "capped") {
      requirePositive("cappedSize", values.cappedSize, true);
      requirePositive("cappedMax", values.cappedMax);
    }
    if (values.kind === "timeseries") {
      if (!values.timeField?.trim()) {
        ctx.addIssue({ code: "custom", path: ["timeField"], message: "Time field is required." });
      }
      requirePositive("expireAfterSeconds", values.expireAfterSeconds);
    }
  });

export type TCreateCollectionInput = z.input<typeof createCollectionSchema>;

export const renameCollectionSchema = z.object({ newName: collectionName });

export type TRenameCollectionInput = z.infer<typeof renameCollectionSchema>;
