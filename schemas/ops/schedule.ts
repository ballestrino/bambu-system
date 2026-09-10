import { z } from "zod";

const weekKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La semana debe tener el formato AAAA-MM-DD");

export const WeeklyScheduleFiltersSchema = z.object({
  weekStart: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    weekKeySchema.optional()
  ),
});

export type WeeklyScheduleFilters = z.infer<typeof WeeklyScheduleFiltersSchema>;
