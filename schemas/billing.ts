import { z } from "zod";

// Facturación (docs/billing.md): el mes de un resumen o de una sincronización.
export const billingPeriodSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Usá AAAA-MM");

// DGI admite hasta 80 caracteres en el nombre de un ítem.
export const BILLING_ITEM_CONCEPT_MAX = 80;

// Un cambio a una factura del borrador: la casilla, o el concepto y el precio
// de sus líneas. updatedAt es el que vio la página (compare-and-set).
export const draftInvoiceEditSchema = z
  .object({
    invoiceId: z.string().trim().min(1),
    updatedAt: z.string().datetime(),
    selected: z.boolean().optional(),
    lines: z
      .array(
        z.object({
          index: z.number().int().min(0).max(199),
          concepto: z.string().trim().min(1, "El detalle no puede quedar vacío").max(BILLING_ITEM_CONCEPT_MAX, `Hasta ${BILLING_ITEM_CONCEPT_MAX} caracteres`).optional(),
          precio: z.number().finite().min(0, "El precio no puede ser negativo").max(1_000_000_000).optional(),
        })
      )
      .max(200)
      .optional(),
  })
  .refine((value) => value.selected !== undefined || value.lines?.length, "No hay cambios");

export type DraftInvoiceEdit = z.infer<typeof draftInvoiceEditSchema>;

// "Emitir N": lo que vio el diálogo. El servidor rechaza si el borrador cambió.
export const issueBatchSchema = z.object({
  batchId: z.string().trim().min(1),
  updatedAt: z.string().datetime(),
  count: z.number().int().min(1).max(500),
  total: z.number().finite().min(0),
});

export type IssueBatchRequest = z.infer<typeof issueBatchSchema>;
