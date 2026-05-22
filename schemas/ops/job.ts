import { z } from "zod";

import {
  booleanSchema,
  cuidSchema,
  dateRangeFiltersSchema,
  jsonValueSchema,
  nullableCuidUpdateSchema,
  nullableDateUpdateSchema,
  nullableTrimmedString,
  optionalBooleanSchema,
  optionalDateSchema,
  optionalTrimmedString,
} from "@/schemas/ops/common";

export const jobStatusValues = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
] as const;

export const jobStatusSchema = z.enum(jobStatusValues);

export const jobTypeValues = ["ONGOING", "PUNCTUAL"] as const;
export const jobTypeSchema = z.enum(jobTypeValues);

export const jobVisibilityValues = ["DEFAULT", "PUNCTUAL", "ALL"] as const;
export const jobVisibilitySchema = z.enum(jobVisibilityValues);

const jobBaseSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(255),
    description: optionalTrimmedString(),
    serviceAddress: optionalTrimmedString(255),
    serviceLocation: optionalTrimmedString(255),
    operationalNotes: optionalTrimmedString(),
    status: jobStatusSchema.default("DRAFT"),
    jobType: jobTypeSchema.default("ONGOING"),
    punctualStartDate: optionalDateSchema,
    punctualEndDate: optionalDateSchema,
    budgetIncludesIva: booleanSchema.default(true),
    sourceBudgetId: z.preprocess(
      (value) => (value === "" ? null : value),
      z.union([cuidSchema, z.null()]).optional()
    ),
    sourceBudgetOptionId: z.preprocess(
      (value) => (value === "" ? null : value),
      z.union([cuidSchema, z.null()]).optional()
    ),
    budgetSnapshot: jsonValueSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.jobType === "PUNCTUAL" && !value.punctualStartDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha inicial del puntual es obligatoria",
        path: ["punctualStartDate"],
      });
    }

    if (value.jobType === "PUNCTUAL" && !value.punctualEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha final del puntual es obligatoria",
        path: ["punctualEndDate"],
      });
    }

    if (
      value.punctualStartDate &&
      value.punctualEndDate &&
      value.punctualEndDate.getTime() < value.punctualStartDate.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha final debe ser mayor o igual a la inicial",
        path: ["punctualEndDate"],
      });
    }
  });

export const CreateJobSchema = jobBaseSchema.refine(
  ({ sourceBudgetId, sourceBudgetOptionId }) =>
    !sourceBudgetOptionId || !!sourceBudgetId,
  {
    message: "No puedes asociar una opcion sin seleccionar un presupuesto",
    path: ["sourceBudgetOptionId"],
  }
);

export const UpdateJobSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(255).optional(),
  description: nullableTrimmedString(),
  serviceAddress: nullableTrimmedString(255),
  serviceLocation: nullableTrimmedString(255),
  operationalNotes: nullableTrimmedString(),
  status: jobStatusSchema.optional(),
  jobType: jobTypeSchema.optional(),
  punctualStartDate: nullableDateUpdateSchema,
  punctualEndDate: nullableDateUpdateSchema,
  budgetIncludesIva: optionalBooleanSchema,
  sourceBudgetId: nullableCuidUpdateSchema,
  sourceBudgetOptionId: nullableCuidUpdateSchema,
  budgetSnapshot: z.union([jsonValueSchema, z.null()]).optional(),
});

export const JobFiltersSchema = dateRangeFiltersSchema.extend({
  query: optionalTrimmedString(255),
  statuses: z.array(jobStatusSchema).optional(),
  visibility: jobVisibilitySchema.optional(),
  includeArchived: optionalBooleanSchema,
  sourceBudgetId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.union([cuidSchema, z.null()]).optional()
  ),
  sourceBudgetOptionId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.union([cuidSchema, z.null()]).optional()
  ),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type JobFilters = z.infer<typeof JobFiltersSchema>;
