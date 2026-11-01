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

// Nota de crédito de una factura emitida (feature 43): por el total o parcial
// (monto sin IVA por línea), con la razón. total y credited son lo que vio la
// página: el servidor rechaza si la factura cambió (regla 2).
const creditNoteBase = {
  invoiceId: z.string().trim().min(1),
  reason: z.string().trim().min(1, "Falta la razón de la nota").max(90, "Hasta 90 caracteres"),
  total: z.number().finite().min(0),
  credited: z.number().finite().min(0),
};

export const creditNoteSchema = z.discriminatedUnion("mode", [
  z.object({ ...creditNoteBase, mode: z.literal("full") }),
  z.object({
    ...creditNoteBase,
    mode: z.literal("partial"),
    lines: z
      .array(z.object({ index: z.number().int().min(0).max(199), amount: z.number().finite().min(0).max(1_000_000_000) }))
      .min(1)
      .max(200),
  }),
]);

export type CreditNoteValues = z.infer<typeof creditNoteSchema>;

// Vincular el receptor de una factura a su trabajo de Bambú (feature 43), o
// quitar el vínculo (jobId null). La clave del receptor sale de la factura.
export const receiverJobLinkSchema = z.object({
  invoiceId: z.string().trim().min(1),
  jobId: z.string().trim().min(1).nullable(),
});

export type ReceiverJobLink = z.infer<typeof receiverJobLinkSchema>;
