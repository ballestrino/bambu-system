import { z } from "zod";

import { cuidSchema, optionalTrimmedString } from "@/schemas/ops/common";

export const employeeAvailabilityKindValues = [
  "AVAILABLE",
  "UNAVAILABLE",
] as const;

export const employeeAvailabilityKindSchema = z.enum(
  employeeAvailabilityKindValues
);

const DAY_MINUTES = 24 * 60;

const minuteOfDaySchema = z.coerce
  .number()
  .int("Debe ser un horario valido")
  .min(0, "Debe ser un horario valido")
  .max(DAY_MINUTES, "Debe ser un horario valido");

// Una lista vacia significa "todos los dias": la regla horaria sin dias
// elegidos aplica a la semana entera.
const weekdaysSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (!Array.isArray(value)) {
    return value;
  }

  return Array.from(new Set(value.map(Number))).sort((left, right) => left - right);
}, z.array(z.number().int().min(1).max(7)).max(7));

export const CreateEmployeeAvailabilityRuleSchema = z
  .object({
    employeeId: cuidSchema,
    kind: employeeAvailabilityKindSchema.default("UNAVAILABLE"),
    weekdays: weekdaysSchema,
    startMinute: minuteOfDaySchema,
    endMinute: minuteOfDaySchema,
    note: optionalTrimmedString(255),
  })
  .superRefine((value, ctx) => {
    if (value.endMinute <= value.startMinute) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La hora de fin debe ser posterior al inicio",
        path: ["endMinute"],
      });
    }
  });

export const EmployeeAvailabilityFiltersSchema = z.object({
  employeeId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    cuidSchema.optional()
  ),
});

export type CreateEmployeeAvailabilityRuleInput = z.infer<
  typeof CreateEmployeeAvailabilityRuleSchema
>;
export type EmployeeAvailabilityFilters = z.infer<
  typeof EmployeeAvailabilityFiltersSchema
>;
