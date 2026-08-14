import { z } from "zod";

import {
  booleanSchema,
  cuidSchema,
} from "@/schemas/ops/common";
import { occurrenceStatusSchema } from "@/schemas/ops/job-occurrence";

const allSelectionSchema = z.literal("ALL");

export const VisitFeedFiltersSchema = z.object({
  attentionOnly: booleanSchema.default(false),
  cursor: z.coerce.date(),
  employeeId: z
    .union([allSelectionSchema, z.literal("UNASSIGNED"), cuidSchema])
    .default("ALL"),
  exactDate: z.iso.date().optional(),
  jobId: z.union([allSelectionSchema, cuidSchema]).default("ALL"),
  status: z.union([allSelectionSchema, occurrenceStatusSchema]).default("ALL"),
});

export type VisitFeedFilters = z.infer<typeof VisitFeedFiltersSchema>;
