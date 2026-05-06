import { z } from "zod";

import {
  cuidSchema,
  dateRangeFiltersSchema,
  jsonValueSchema,
  nullableCuidUpdateSchema,
  nullableTrimmedString,
  optionalBooleanSchema,
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

const jobBaseSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(255),
  description: optionalTrimmedString(),
  serviceAddress: optionalTrimmedString(255),
  serviceLocation: optionalTrimmedString(255),
  operationalNotes: optionalTrimmedString(),
  status: jobStatusSchema.default("DRAFT"),
  sourceBudgetId: z.preprocess(
    (value) => (value === "" ? null : value),
    z.union([cuidSchema, z.null()]).optional()
  ),
  sourceBudgetOptionId: z.preprocess(
    (value) => (value === "" ? null : value),
    z.union([cuidSchema, z.null()]).optional()
  ),
  budgetSnapshot: jsonValueSchema.optional(),
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
  sourceBudgetId: nullableCuidUpdateSchema,
  sourceBudgetOptionId: nullableCuidUpdateSchema,
  budgetSnapshot: z.union([jsonValueSchema, z.null()]).optional(),
});

export const JobFiltersSchema = dateRangeFiltersSchema.extend({
  query: optionalTrimmedString(255),
  statuses: z.array(jobStatusSchema).optional(),
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
