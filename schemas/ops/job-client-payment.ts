import { z } from "zod";

import {
  cuidSchema,
  dateRangeFiltersSchema,
  nullableTrimmedString,
  optionalTrimmedString,
  positiveAmountSchema,
} from "@/schemas/ops/common";

export const paymentStatusValues = ["RECORDED", "VOIDED"] as const;
export const paymentStatusSchema = z.enum(paymentStatusValues);

const jobClientPaymentBaseSchema = z.object({
  jobId: cuidSchema,
  assignedMonth: z.coerce.date(),
  paymentDate: z.coerce.date(),
  amount: positiveAmountSchema,
  reference: optionalTrimmedString(255),
  notes: optionalTrimmedString(),
  status: paymentStatusSchema.default("RECORDED"),
});

export const CreateJobClientPaymentSchema = jobClientPaymentBaseSchema;

export const UpdateJobClientPaymentSchema = z.object({
  assignedMonth: z.coerce.date().optional(),
  paymentDate: z.coerce.date().optional(),
  amount: positiveAmountSchema.optional(),
  reference: nullableTrimmedString(255),
  notes: nullableTrimmedString(),
  status: paymentStatusSchema.optional(),
});

export const JobClientPaymentFiltersSchema = dateRangeFiltersSchema.extend({
  assignedMonth: z.coerce.date().optional(),
  jobId: z.preprocess((value) => (value === "" ? undefined : value), cuidSchema.optional()),
  statuses: z.array(paymentStatusSchema).optional(),
});

export type CreateJobClientPaymentInput = z.infer<
  typeof CreateJobClientPaymentSchema
>;
export type UpdateJobClientPaymentInput = z.infer<
  typeof UpdateJobClientPaymentSchema
>;
export type JobClientPaymentFilters = z.infer<
  typeof JobClientPaymentFiltersSchema
>;
