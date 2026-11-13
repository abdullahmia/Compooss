import { isProtectedDatabase } from "@compooss/types";
import { z } from "zod";

export const createDatabaseSchema = z.object({
  dbName: z
    .string()
    .trim()
    .min(1, { message: "Database name is required." })
    .max(63, { message: "Database name must be 63 characters or fewer." })
    .regex(/^[a-zA-Z0-9_\-]+$/, {
      message:
        "Database name can only contain letters, numbers, underscores, and hyphens.",
    })
    .refine((name) => !isProtectedDatabase(name), {
      message: "admin, config and local are reserved by MongoDB.",
    }),
  collectionName: z
    .string()
    .trim()
    .min(1, { message: "Collection name is required." })
    .regex(/^[a-zA-Z0-9_\-]+$/, {
      message:
        "Collection name can only contain letters, numbers, underscores, and hyphens.",
    }),
});

export type TCreateDatabaseFormData = z.input<typeof createDatabaseSchema>;
