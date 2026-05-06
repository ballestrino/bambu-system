import { z } from "zod";

import {
  booleanSchema,
  cuidSchema,
  dateRangeFiltersSchema,
  nullableDateUpdateSchema,
  nullableTrimmedString,
  optionalBooleanSchema,
  optionalTrimmedString,
} from "@/schemas/ops/common";

export const occurrenceStatusValues = [
  "SCHEDULED",
  "DONE",
  "SKIPPED",
  "CANCELED",
] as const;

export const occurrenceStatusSchema = z.enum(occurrenceStatusValues);

const occurrenceTimingShape = {
  scheduledStartAt: z.coerce.date(),
  scheduledEndAt: z.coerce.date(),
  actualStartAt: z.coerce.date().optional(),
  actualEndAt: z.coerce.date().optional(),
};

const jobOccurrenceBaseSchema = z
  .object({
    jobId: cuidSchema,
    scheduleRuleId: z.preprocess(
      (value) => (value === "" ? undefined : value),
      cuidSchema.optional()
    ),
    ...occurrenceTimingShape,
    status: occurrenceStatusSchema.default("SCHEDULED"),
    isDetached: booleanSchema.default(false),
    notes: optionalTrimmedString(),
  })
  .superRefine((value, ctx) => {
    if (value.scheduledEndAt.getTime() <= value.scheduledStartAt.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin programada debe ser posterior al inicio",
        path: ["scheduledEndAt"],
      });
    }

    if (
      value.actualStartAt &&
      value.actualEndAt &&
      value.actualEndAt.getTime() < value.actualStartAt.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin real debe ser posterior al inicio real",
        path: ["actualEndAt"],
      });
    }
  });

export const CreateJobOccurrenceSchema = jobOccurrenceBaseSchema;

export const UpdateJobOccurrenceSchema = z
  .object({
    scheduledStartAt: z.coerce.date().optional(),
    scheduledEndAt: z.coerce.date().optional(),
    actualStartAt: nullableDateUpdateSchema,
    actualEndAt: nullableDateUpdateSchema,
    status: occurrenceStatusSchema.optional(),
    isDetached: optionalBooleanSchema,
    notes: nullableTrimmedString(),
  })
  .superRefine((value, ctx) => {
    if (
      value.scheduledStartAt &&
      value.scheduledEndAt &&
      value.scheduledEndAt.getTime() <= value.scheduledStartAt.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin programada debe ser posterior al inicio",
        path: ["scheduledEndAt"],
      });
    }

    if (
      value.actualStartAt instanceof Date &&
      value.actualEndAt instanceof Date &&
      value.actualEndAt.getTime() < value.actualStartAt.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin real debe ser posterior al inicio real",
        path: ["actualEndAt"],
      });
    }
  });

export const DetachJobOccurrenceSchema = z
  .object({
    scheduledStartAt: z.coerce.date().optional(),
    scheduledEndAt: z.coerce.date().optional(),
    actualStartAt: nullableDateUpdateSchema,
    actualEndAt: nullableDateUpdateSchema,
    status: occurrenceStatusSchema.optional(),
    notes: nullableTrimmedString(),
  })
  .superRefine((value, ctx) => {
    if (
      value.scheduledStartAt &&
      value.scheduledEndAt &&
      value.scheduledEndAt.getTime() <= value.scheduledStartAt.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin programada debe ser posterior al inicio",
        path: ["scheduledEndAt"],
      });
    }

    if (
      value.actualStartAt &&
      value.actualEndAt &&
      value.actualEndAt.getTime() < value.actualStartAt.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin real debe ser posterior al inicio real",
        path: ["actualEndAt"],
      });
    }
  });

export const JobOccurrenceFiltersSchema = dateRangeFiltersSchema.extend({
  jobId: z.preprocess((value) => (value === "" ? undefined : value), cuidSchema.optional()),
  scheduleRuleId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    cuidSchema.optional()
  ),
  statuses: z.array(occurrenceStatusSchema).optional(),
  includeArchived: optionalBooleanSchema,
  isDetached: optionalBooleanSchema,
});

export type CreateJobOccurrenceInput = z.infer<typeof CreateJobOccurrenceSchema>;
export type UpdateJobOccurrenceInput = z.infer<typeof UpdateJobOccurrenceSchema>;
export type DetachJobOccurrenceInput = z.infer<typeof DetachJobOccurrenceSchema>;
export type JobOccurrenceFilters = z.infer<typeof JobOccurrenceFiltersSchema>;
