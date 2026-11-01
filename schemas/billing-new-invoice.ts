import { z } from "zod";

import { NEW_INVOICE_CURRENCIES, NEW_INVOICE_TYPES, type NewInvoiceForm } from "@/lib/billing/new-invoice";
import { billingPeriodSchema } from "@/schemas/billing";

// Nueva factura (feature 45): lo que manda la página. Los largos son los de
// Biller; los montos llegan como texto y los valida getNewInvoiceProblems.
const text = (max: number) => z.string().max(max, `Hasta ${max} caracteres`);
const adjustType = z.enum(["%", "$"]);

export const newInvoiceItemSchema = z.object({
  cantidad: text(20),
  codigo: text(35),
  concepto: text(80),
  descripcion: text(500),
  descuento: text(20),
  descuentoTipo: adjustType,
  indicador: z.number().int().min(1).max(16),
  precio: text(20),
  recargo: text(20),
  recargoTipo: adjustType,
  unidad: text(4),
});

export const newInvoiceFormSchema = z.object({
  address: text(70),
  adenda: text(1000),
  cfeType: z.union(NEW_INVOICE_TYPES.map((type) => z.literal(type)) as [z.ZodLiteral<111>, z.ZodLiteral<101>]),
  city: text(30),
  consumer: z.boolean(),
  country: z.string().regex(/^[A-Z]{2}$/),
  currency: z.enum(NEW_INVOICE_CURRENCIES),
  department: text(30),
  document: text(20),
  documentType: z.number().int().min(2).max(7),
  dueDate: z.string().max(10),
  emails: z.array(text(120)).max(10),
  issueDate: z.string().max(10),
  items: z.array(newInvoiceItemSchema).min(1).max(40),
  name: text(70),
  paymentForm: z.number().int().min(1).max(2),
  purchaseOrder: text(50),
  tradeName: text(30),
}) satisfies z.ZodType<NewInvoiceForm>;

// La página genera el id al abrir: la factura se crea con ese id y el número
// interno BAMBU-<id>, así un doble clic o un reintento encuentran la misma.
export const newInvoiceRequestSchema = z.object({
  form: newInvoiceFormSchema,
  month: billingPeriodSchema,
  requestId: z.string().regex(/^[a-z0-9]{20,40}$/, "Pedido inválido"),
});

export type NewInvoiceRequest = z.infer<typeof newInvoiceRequestSchema>;
