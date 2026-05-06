import { z } from "zod";

import {
  booleanSchema,
  cuidSchema,
  dateRangeFiltersSchema,
  nullableDateUpdateSchema,
  optionalBooleanSchema,
  optionalTrimmedString,
  positiveIntSchema,
} from "@/schemas/ops/common";

export const recurrenceFrequencyValues = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
] as const;

export const recurrenceFrequencySchema = z.enum(recurrenceFrequencyValues);

const weekdaysSchema = z
  .array(z.coerce.number().int().min(1).max(7))
  .max(7)
  .transform((weekdays) => [...new Set(weekdays)].sort((a, b) => a - b));

const jobScheduleRuleBaseSchema = z
  .object({
    jobId: cuidSchema,
    isActive: booleanSchema.default(true),
    frequency: recurrenceFrequencySchema,
    interval: positiveIntSchema.default(1),
    weekdays: weekdaysSchema.default([]),
    dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    startTimeMinutes: z.coerce.number().int().min(0).max(1439),
    durationMinutes: positiveIntSchema,
    timezone: optionalTrimmedString(100).default("America/Montevideo"),
  })
  .superRefine((value, ctx) => {
    if (
      value.endDate &&
      value.endDate.getTime() < value.startDate.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha final debe ser mayor o igual a la inicial",
        path: ["endDate"],
      });
    }

    if (value.frequency === "WEEKLY" && value.weekdays.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las reglas semanales necesitan al menos un dia",
        path: ["weekdays"],
      });
    }

    if (value.frequency === "MONTHLY" && !value.dayOfMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las reglas mensuales necesitan un dia del mes",
        path: ["dayOfMonth"],
      });
    }
  });

export const CreateJobScheduleRuleSchema = jobScheduleRuleBaseSchema;

export const UpdateJobScheduleRuleSchema = z.object({
  isActive: optionalBooleanSchema,
  frequency: recurrenceFrequencySchema.optional(),
  interval: positiveIntSchema.optional(),
  weekdays: weekdaysSchema.optional(),
  dayOfMonth: z.preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === "" || value === null) {
      return null;
    }

    return value;
  }, z.union([z.coerce.number().int().min(1).max(31), z.null()]).optional()),
  startDate: z.coerce.date().optional(),
  endDate: nullableDateUpdateSchema,
  startTimeMinutes: z.coerce.number().int().min(0).max(1439).optional(),
  durationMinutes: positiveIntSchema.optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
});

export const JobScheduleRuleFiltersSchema = dateRangeFiltersSchema.extend({
  jobId: z.preprocess((value) => (value === "" ? undefined : value), cuidSchema.optional()),
  isActive: optionalBooleanSchema,
  frequencies: z.array(recurrenceFrequencySchema).optional(),
});

export type CreateJobScheduleRuleInput = z.infer<
  typeof CreateJobScheduleRuleSchema
>;
export type UpdateJobScheduleRuleInput = z.infer<
  typeof UpdateJobScheduleRuleSchema
>;
export type JobScheduleRuleFilters = z.infer<
  typeof JobScheduleRuleFiltersSchema
>;
