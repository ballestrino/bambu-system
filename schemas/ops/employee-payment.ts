import { z } from "zod";

import {
  cuidSchema,
  dateRangeFiltersSchema,
  nullableTrimmedString,
  optionalTrimmedString,
  positiveAmountSchema,
} from "@/schemas/ops/common";

import { paymentStatusSchema } from "@/schemas/ops/job-client-payment";

const employeePaymentBaseSchema = z
  .object({
    employeeId: cuidSchema,
    periodStart: z.coerce.date(),
    periodEnd: z.coerce.date(),
    paymentDate: z.coerce.date(),
    amount: positiveAmountSchema,
    reference: optionalTrimmedString(255),
    notes: optionalTrimmedString(),
    status: paymentStatusSchema.default("RECORDED"),
  })
  .superRefine((value, ctx) => {
    if (value.periodEnd.getTime() < value.periodStart.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El periodo final debe ser mayor o igual al inicial",
        path: ["periodEnd"],
      });
    }
  });

export const CreateEmployeePaymentSchema = employeePaymentBaseSchema;

export const UpdateEmployeePaymentSchema = z
  .object({
    periodStart: z.coerce.date().optional(),
    periodEnd: z.coerce.date().optional(),
    paymentDate: z.coerce.date().optional(),
    amount: positiveAmountSchema.optional(),
    reference: nullableTrimmedString(255),
    notes: nullableTrimmedString(),
    status: paymentStatusSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.periodStart &&
      value.periodEnd &&
      value.periodEnd.getTime() < value.periodStart.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El periodo final debe ser mayor o igual al inicial",
        path: ["periodEnd"],
      });
    }
  });

export const EmployeePaymentFiltersSchema = dateRangeFiltersSchema.extend({
  employeeId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    cuidSchema.optional()
  ),
  statuses: z.array(paymentStatusSchema).optional(),
});

export type CreateEmployeePaymentInput = z.infer<
  typeof CreateEmployeePaymentSchema
>;
export type UpdateEmployeePaymentInput = z.infer<
  typeof UpdateEmployeePaymentSchema
>;
export type EmployeePaymentFilters = z.infer<
  typeof EmployeePaymentFiltersSchema
>;
