import { z } from "zod";

import { dateSchema } from "@/schemas/ops/common";

export const FinanceTrendQuerySchema = z.object({
  month: dateSchema,
  months: z.coerce.number().int().min(1).max(12).default(3),
});

export type FinanceTrendQueryInput = z.input<typeof FinanceTrendQuerySchema>;
