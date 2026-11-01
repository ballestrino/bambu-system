import { z } from "zod";

import { monthKeySchema } from "@/schemas/agent-tools";
import { BILLING_ITEM_CONCEPT_MAX } from "@/schemas/billing";

// Entradas de las tools de Facturación (docs/billing.md, "Agente"). Como el
// resto: campos obligatorios y nullable, null es "sin dato" o "sin cambio".
// El mes null es el que mira el usuario en Facturación o, si no, el actual.
const billingMonth = monthKeySchema.describe(
  "Mes AAAA-MM; null es el mes que el usuario mira en Facturación o, si no, el actual"
);

export const billingMonthInputSchema = z.object({ month: billingMonth });

export const listInvoicesInputSchema = z.object({
  month: billingMonth,
  which: z
    .enum(["issued", "draft", "both"])
    .nullable()
    .describe("issued: lo emitido en el mes; draft: el borrador del mes; null o both: las dos"),
  query: z.string().trim().max(80).nullable().describe("Filtra por razón social, nombre o RUT; null trae todas"),
});

export const getInvoiceInputSchema = z.object({
  invoiceId: z.string().trim().min(1).max(64).describe("El id de la factura, como lo devuelve listInvoices"),
});

const rutSchema = z.string().trim().min(8).max(20).describe("RUT de 12 dígitos, con o sin puntos");

export const lookupRutInputSchema = z.object({ rut: rutSchema });

const conceptSchema = z.string().trim().min(1).max(BILLING_ITEM_CONCEPT_MAX);
const priceSchema = z.number().finite().min(0).max(1_000_000_000);

export const draftInvoicesInputSchema = z.object({
  month: billingMonth,
  repeatPreviousMonth: z
    .boolean()
    .nullable()
    .describe("true: si el mes no tiene borrador abierto, lo crea repitiendo lo emitido el mes anterior (si ya hay uno, se usa ese)"),
  changes: z
    .array(
      z.object({
        invoiceId: z.string().trim().min(1).max(64).describe("Id de una factura del borrador (listInvoices con which draft)"),
        selected: z.boolean().nullable().describe("false la desmarca (no se emite), true la marca; null si no cambia"),
        lines: z
          .array(
            z.object({
              index: z.number().int().min(0).max(199).describe("Línea de la factura, desde 0"),
              concepto: conceptSchema.nullable().describe(`Detalle de la línea, hasta ${BILLING_ITEM_CONCEPT_MAX} caracteres; null si no cambia`),
              precio: priceSchema.nullable().describe("Precio unitario sin IVA; null si no cambia"),
            })
          )
          .max(50)
          .nullable()
          .describe("Cambios de detalle o precio por línea; null si no cambian"),
      })
    )
    .max(100)
    .nullable()
    .describe("Cambios a facturas que ya están en el borrador; null si no hay"),
  newInvoices: z
    .array(
      z.object({
        rut: rutSchema,
        concepto: conceptSchema.describe("Detalle de la única línea"),
        precio: priceSchema.describe("Precio unitario sin IVA, pedido por el usuario"),
        cantidad: z.number().finite().positive().max(10_000).nullable().describe("Cantidad; null es 1"),
      })
    )
    .max(10)
    .nullable()
    .describe("e-Facturas nuevas al contado para clientes que no están en el borrador; la razón social sale de DGI. null si no hay"),
});

export type DraftInvoicesInput = z.infer<typeof draftInvoicesInputSchema>;

// prepareCreditNote (feature 43): arma una nota de crédito para que el usuario
// la emita desde su página. No emite.
export const prepareCreditNoteInputSchema = z.object({
  invoiceId: z.string().trim().min(1).max(64).describe("El id de la factura emitida que se corrige, como lo devuelve listInvoices"),
  mode: z.enum(["full", "partial"]).describe("full: anula la factura entera; partial: solo los montos de lines"),
  lines: z
    .array(
      z.object({
        index: z.number().int().min(0).max(199).describe("La línea de la factura, desde 0"),
        amount: z.number().finite().min(0).max(1_000_000_000).describe("Cuánto acreditar de la línea, sin IVA"),
      })
    )
    .max(200)
    .nullable()
    .describe("Solo con partial: el monto sin IVA a acreditar de cada línea; null con full"),
  reason: z.string().trim().min(1).max(90).describe("La razón de la nota, que sale en la adenda del PDF (hasta 90 caracteres)"),
});

export type PrepareCreditNoteInput = z.infer<typeof prepareCreditNoteInputSchema>;
