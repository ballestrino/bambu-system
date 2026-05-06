import { z } from "zod";

import {
  cuidSchema,
  dateRangeFiltersSchema,
  nullableDateUpdateSchema,
  nullableTrimmedString,
  optionalBooleanSchema,
  optionalDateSchema,
  optionalTrimmedString,
} from "@/schemas/ops/common";

const jobEmployeeAssignmentBaseSchema = z
  .object({
    jobId: cuidSchema,
    employeeId: cuidSchema,
    roleLabel: optionalTrimmedString(255),
    assignedFrom: z.coerce.date(),
    assignedTo: optionalDateSchema,
  })
  .refine(
    ({ assignedFrom, assignedTo }) =>
      !assignedTo || assignedTo.getTime() >= assignedFrom.getTime(),
    {
      message: "La fecha de fin debe ser mayor o igual a la de inicio",
      path: ["assignedTo"],
    }
  );

export const CreateJobEmployeeAssignmentSchema = jobEmployeeAssignmentBaseSchema;

export const UpdateJobEmployeeAssignmentSchema = z
  .object({
    roleLabel: nullableTrimmedString(255),
    assignedFrom: z.coerce.date().optional(),
    assignedTo: nullableDateUpdateSchema,
  })
  .refine(
    ({ assignedFrom, assignedTo }) =>
      !(assignedFrom && assignedTo instanceof Date) ||
      assignedTo.getTime() >= assignedFrom.getTime(),
    {
      message: "La fecha de fin debe ser mayor o igual a la de inicio",
      path: ["assignedTo"],
    }
  );

export const JobEmployeeAssignmentFiltersSchema = dateRangeFiltersSchema.extend({
  jobId: z.preprocess((value) => (value === "" ? undefined : value), cuidSchema.optional()),
  employeeId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    cuidSchema.optional()
  ),
  activeOnDate: optionalDateSchema,
  includeArchived: optionalBooleanSchema,
});

export type CreateJobEmployeeAssignmentInput = z.infer<
  typeof CreateJobEmployeeAssignmentSchema
>;
export type UpdateJobEmployeeAssignmentInput = z.infer<
  typeof UpdateJobEmployeeAssignmentSchema
>;
export type JobEmployeeAssignmentFilters = z.infer<
  typeof JobEmployeeAssignmentFiltersSchema
>;
