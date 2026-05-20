import { z } from "zod";

import {
  booleanSchema,
  cuidSchema,
  dateRangeFiltersSchema,
  nullableCuidUpdateSchema,
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

const normalizeEmployeeIds = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return value;
  }

  const ids = value
    .filter((item) => item !== undefined && item !== null && item !== "")
    .map((item) => (typeof item === "string" ? item.trim() : item));

  return Array.from(new Set(ids));
};

const optionalEmployeeIdsSchema = z.preprocess(
  normalizeEmployeeIds,
  z.array(cuidSchema).optional()
);

const jobOccurrenceBaseSchema = z
  .object({
    jobId: cuidSchema,
    employeeIds: optionalEmployeeIdsSchema,
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
    employeeIds: optionalEmployeeIdsSchema,
    scheduleRuleId: nullableCuidUpdateSchema,
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
    employeeIds: optionalEmployeeIdsSchema,
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
  employeeId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    cuidSchema.optional()
  ),
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
