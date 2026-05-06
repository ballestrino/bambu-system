import { z } from "zod";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ])
);

export const cuidSchema = z.string().cuid("Id invalido");

const normalizeOptionalBoolean = (value: unknown) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === "true") {
      return true;
    }

    if (normalizedValue === "false") {
      return false;
    }
  }

  return value;
};

export const positiveIntSchema = z.coerce
  .number()
  .int("Debe ser un numero entero")
  .positive("Debe ser mayor a cero");

export const amountSchema = z.coerce
  .number()
  .finite("Debe ser un numero valido")
  .nonnegative("Debe ser mayor o igual a cero");

export const positiveAmountSchema = z.coerce
  .number()
  .finite("Debe ser un numero valido")
  .positive("Debe ser mayor a cero");

export const dateSchema = z.coerce.date();

export const optionalDateSchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, z.coerce.date().optional());

export const nullableDateUpdateSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "" || value === null) {
    return null;
  }

  return value;
}, z.union([z.coerce.date(), z.null()]).optional());

export const optionalTrimmedString = (maxLength = 5000) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value ?? undefined;
    }

    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().max(maxLength).optional());

export const nullableTrimmedString = (maxLength = 5000) =>
  z.preprocess((value) => {
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
  }, z.string().max(maxLength).nullable().optional());

export const optionalBooleanSchema = z.preprocess(
  normalizeOptionalBoolean,
  z.boolean().optional()
);

export const booleanSchema = z.preprocess(
  normalizeOptionalBoolean,
  z.boolean()
);

export const nullableCuidUpdateSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
}, z.union([cuidSchema, z.null()]).optional());

export const dateRangeFiltersSchema = z
  .object({
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
  })
  .refine(
    ({ startDate, endDate }) =>
      !startDate || !endDate || endDate.getTime() >= startDate.getTime(),
    {
      message: "La fecha final debe ser mayor o igual a la inicial",
      path: ["endDate"],
    }
  );
