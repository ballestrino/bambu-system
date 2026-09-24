import { z } from "zod";

import { cuidSchema } from "@/schemas/ops/common";

// A day range the user picks to generate visits: a whole week, a month, or
// from the day a new service starts to the end of the month.
export const MAX_OCCURRENCE_GENERATION_DAYS = 93;

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Fecha inválida" });

const toDayNumber = (key: string) =>
  Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10))) /
  86_400_000;

export const getOccurrenceGenerationDays = (startDate: string, endDate: string) =>
  toDayNumber(endDate) - toDayNumber(startDate) + 1;

export const OccurrenceGenerationSchema = z
  .object({
    startDate: dateKeySchema,
    endDate: dateKeySchema,
    jobId: cuidSchema.optional(),
    scheduleRuleId: cuidSchema.optional(),
    // Visits that no longer match their rule, picked in the preview.
    replaceIds: z.array(cuidSchema).max(500).optional(),
  })
  .refine(({ startDate, endDate }) => endDate >= startDate, {
    message: "La fecha final tiene que ser igual o posterior a la inicial",
    path: ["endDate"],
  })
  .refine(
    ({ startDate, endDate }) =>
      getOccurrenceGenerationDays(startDate, endDate) <= MAX_OCCURRENCE_GENERATION_DAYS,
    {
      message: `El rango puede tener hasta ${MAX_OCCURRENCE_GENERATION_DAYS} días`,
      path: ["endDate"],
    }
  );

export type OccurrenceGenerationInput = z.infer<typeof OccurrenceGenerationSchema>;
