import { z } from "zod";

import { cuidSchema, dateSchema } from "@/schemas/ops/common";

export const ProfitabilityQuerySchema = z
  .object({
    jobId: cuidSchema.optional(),
    mode: z.enum(["MONTH", "HISTORY"]).default("MONTH"),
    month: dateSchema,
  })
  .refine(({ jobId, mode }) => mode !== "HISTORY" || Boolean(jobId), {
    message: "El histórico requiere un servicio",
    path: ["jobId"],
  });

export type ProfitabilityQueryInput = z.input<
  typeof ProfitabilityQuerySchema
>;
