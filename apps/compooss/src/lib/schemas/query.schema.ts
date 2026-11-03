import { z } from "zod";

export const saveQuerySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Give the query a name." })
    .max(80, { message: "Keep the name under 80 characters." }),
});

export type TSaveQueryInput = z.infer<typeof saveQuerySchema>;
