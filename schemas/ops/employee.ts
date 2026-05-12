import { z } from "zod";

import {
  amountSchema,
  nullableTrimmedString,
  optionalBooleanSchema,
  dateRangeFiltersSchema,
  optionalTrimmedString,
} from "@/schemas/ops/common";

const optionalHourlyRateSchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, amountSchema.optional());

const nullableHourlyRateUpdateSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "" || value === null) {
    return null;
  }

  return value;
}, z.union([amountSchema, z.null()]).optional());

const employeeBaseSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(255),
  email: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value ?? undefined;
      }

      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.string().email("Email invalido").optional()
  ),
  phone: optionalTrimmedString(100),
  hourlyRate: optionalHourlyRateSchema,
  notes: optionalTrimmedString(),
  isActive: optionalBooleanSchema.default(true),
});

export const CreateEmployeeSchema = employeeBaseSchema;
export const UpdateEmployeeSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(255).optional(),
  email: z.preprocess(
    (value) => {
      if (value === undefined) {
        return undefined;
      }

      if (value === null) {
        return null;
      }

      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    },
    z.string().email("Email invalido").nullable().optional()
  ),
  phone: nullableTrimmedString(100),
  hourlyRate: nullableHourlyRateUpdateSchema,
  notes: nullableTrimmedString(),
  isActive: optionalBooleanSchema,
});

export const EmployeeFiltersSchema = dateRangeFiltersSchema.extend({
  query: optionalTrimmedString(255),
  isActive: optionalBooleanSchema,
  includeArchived: optionalBooleanSchema,
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type EmployeeFilters = z.infer<typeof EmployeeFiltersSchema>;
