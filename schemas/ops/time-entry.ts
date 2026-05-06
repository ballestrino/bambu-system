import { z } from "zod";

import {
  amountSchema,
  cuidSchema,
  dateRangeFiltersSchema,
  nullableCuidUpdateSchema,
  nullableDateUpdateSchema,
  nullableTrimmedString,
  optionalBooleanSchema,
  optionalTrimmedString,
} from "@/schemas/ops/common";

export const timeEntryStatusValues = ["DRAFT", "APPROVED", "REJECTED"] as const;

export const timeEntryStatusSchema = z.enum(timeEntryStatusValues);

const timeEntryBaseSchema = z
  .object({
    employeeId: cuidSchema,
    jobId: cuidSchema,
    jobOccurrenceId: z.preprocess(
      (value) => (value === "" ? undefined : value),
      cuidSchema.optional()
    ),
    workDate: z.coerce.date(),
    startedAt: z.coerce.date().optional(),
    endedAt: z.coerce.date().optional(),
    hours: amountSchema,
    status: timeEntryStatusSchema.default("DRAFT"),
    notes: optionalTrimmedString(),
  })
  .superRefine((value, ctx) => {
    if (value.hours <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las horas deben ser mayores a cero",
        path: ["hours"],
      });
    }

    if (
      value.startedAt &&
      value.endedAt &&
      value.endedAt.getTime() < value.startedAt.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La hora de fin debe ser posterior a la de inicio",
        path: ["endedAt"],
      });
    }
  });

export const CreateTimeEntrySchema = timeEntryBaseSchema;
export const UpdateTimeEntrySchema = z
  .object({
    employeeId: cuidSchema.optional(),
    jobId: cuidSchema.optional(),
    jobOccurrenceId: nullableCuidUpdateSchema,
    workDate: z.coerce.date().optional(),
    startedAt: nullableDateUpdateSchema,
    endedAt: nullableDateUpdateSchema,
    hours: amountSchema.optional(),
    status: timeEntryStatusSchema.optional(),
    notes: nullableTrimmedString(),
  })
  .superRefine((value, ctx) => {
    if (value.hours !== undefined && value.hours <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las horas deben ser mayores a cero",
        path: ["hours"],
      });
    }

    if (
      value.startedAt instanceof Date &&
      value.endedAt instanceof Date &&
      value.endedAt.getTime() < value.startedAt.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La hora de fin debe ser posterior a la de inicio",
        path: ["endedAt"],
      });
    }
  });

export const SetTimeEntryStatusSchema = z.object({
  status: timeEntryStatusSchema,
  notes: optionalTrimmedString(),
});

export const TimeEntryFiltersSchema = dateRangeFiltersSchema.extend({
  jobId: z.preprocess((value) => (value === "" ? undefined : value), cuidSchema.optional()),
  employeeId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    cuidSchema.optional()
  ),
  jobOccurrenceId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    cuidSchema.optional()
  ),
  statuses: z.array(timeEntryStatusSchema).optional(),
  approvedOnly: optionalBooleanSchema,
});

export type CreateTimeEntryInput = z.infer<typeof CreateTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof UpdateTimeEntrySchema>;
export type SetTimeEntryStatusInput = z.infer<typeof SetTimeEntryStatusSchema>;
export type TimeEntryFilters = z.infer<typeof TimeEntryFiltersSchema>;
