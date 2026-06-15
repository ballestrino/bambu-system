import { z } from "zod";

import {
  cuidSchema,
  dateRangeFiltersSchema,
  nullableCuidUpdateSchema,
  nullableTrimmedString,
  optionalBooleanSchema,
  optionalTrimmedString,
  positiveAmountSchema,
} from "@/schemas/ops/common";
import { paymentStatusSchema } from "@/schemas/ops/job-client-payment";

export const operationalCostCategoryKindValues = [
  "GENERAL",
  "BPS",
  "TRANSPORT",
] as const;

export const operationalCostCategoryKindSchema = z.enum(
  operationalCostCategoryKindValues
);

const categoryBaseSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  description: optionalTrimmedString(500),
  color: z.string().trim().min(1).max(40).default("#53985E"),
  kind: operationalCostCategoryKindSchema.default("GENERAL"),
  isActive: z.boolean().default(true),
});

export const CreateOperationalCostCategorySchema = categoryBaseSchema;

export const UpdateOperationalCostCategorySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: nullableTrimmedString(500),
  color: z.string().trim().min(1).max(40).optional(),
  kind: operationalCostCategoryKindSchema.optional(),
  isActive: optionalBooleanSchema,
});

export const OperationalCostCategoryFiltersSchema = z.object({
  includeArchived: optionalBooleanSchema,
  isActive: optionalBooleanSchema,
  kinds: z.array(operationalCostCategoryKindSchema).optional(),
});

const operationalCostBaseSchema = z.object({
  categoryId: cuidSchema,
  assignedMonth: z.coerce.date(),
  costDate: z.coerce.date(),
  amount: positiveAmountSchema,
  jobId: z.preprocess((value) => (value === "" ? null : value), z.union([cuidSchema, z.null()]).optional()),
  employeeId: z.preprocess((value) => (value === "" ? null : value), z.union([cuidSchema, z.null()]).optional()),
  reference: optionalTrimmedString(255),
  notes: optionalTrimmedString(),
  status: paymentStatusSchema.default("RECORDED"),
});

export const CreateOperationalCostSchema = operationalCostBaseSchema;

export const UpdateOperationalCostSchema = z.object({
  categoryId: nullableCuidUpdateSchema,
  assignedMonth: z.coerce.date().optional(),
  costDate: z.coerce.date().optional(),
  amount: positiveAmountSchema.optional(),
  jobId: nullableCuidUpdateSchema,
  employeeId: nullableCuidUpdateSchema,
  reference: nullableTrimmedString(255),
  notes: nullableTrimmedString(),
  status: paymentStatusSchema.optional(),
});

export const OperationalCostFiltersSchema = dateRangeFiltersSchema.extend({
  assignedMonth: z.coerce.date().optional(),
  categoryId: z.preprocess((value) => (value === "" ? undefined : value), cuidSchema.optional()),
  employeeId: z.preprocess((value) => (value === "" ? undefined : value), cuidSchema.optional()),
  jobId: z.preprocess((value) => (value === "" ? undefined : value), cuidSchema.optional()),
  kinds: z.array(operationalCostCategoryKindSchema).optional(),
  statuses: z.array(paymentStatusSchema).optional(),
});

export const OpsCostSettingsSchema = z.object({
  bpsEstimatePercent: z.coerce.number().finite().min(0).max(100),
});

export type CreateOperationalCostCategoryInput = z.infer<typeof CreateOperationalCostCategorySchema>;
export type UpdateOperationalCostCategoryInput = z.infer<typeof UpdateOperationalCostCategorySchema>;
export type OperationalCostCategoryFilters = z.infer<typeof OperationalCostCategoryFiltersSchema>;
export type CreateOperationalCostInput = z.infer<typeof CreateOperationalCostSchema>;
export type UpdateOperationalCostInput = z.infer<typeof UpdateOperationalCostSchema>;
export type OperationalCostFilters = z.infer<typeof OperationalCostFiltersSchema>;
export type OpsCostSettingsInput = z.infer<typeof OpsCostSettingsSchema>;
