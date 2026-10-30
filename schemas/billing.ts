import { z } from "zod";

// Facturación (docs/billing.md): el mes de un resumen o de una sincronización.
export const billingPeriodSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Usá AAAA-MM");
