import { z } from "zod";

import type { InvoiceItemPayload, InvoiceReceiverPayload } from "@/lib/billing/invoice-mapping";

// Invoice.items e Invoice.receiver son Json: se leen de vuelta con la forma
// que guardó toItemPayload y toReceiverPayload.
const nullableText = z.string().nullable().catch(null);

const storedItemSchema = z.object({
  codigo: nullableText,
  cantidad: z.number(),
  concepto: z.string(),
  descripcion: nullableText,
  precio: z.number(),
  indicador_facturacion: z.number().int(),
  unidad_medida: nullableText,
  descuento_tipo: z.string().optional(),
  descuento_cantidad: z.number().optional(),
  recargo_tipo: z.string().optional(),
  recargo_cantidad: z.number().optional(),
});

const storedReceiverSchema = z.object({
  tipo_documento: z.number().int().nullable().catch(null),
  documento: nullableText,
  razon_social: nullableText,
  nombre_fantasia: nullableText,
  sucursal: z
    .object({
      direccion: nullableText,
      ciudad: nullableText,
      departamento: nullableText,
      pais: z.string().catch("UY"),
    })
    .catch({ direccion: null, ciudad: null, departamento: null, pais: "UY" }),
});

export const readStoredItems = (value: unknown): InvoiceItemPayload[] | null => {
  const parsed = z.array(storedItemSchema).safeParse(value);
  return parsed.success ? parsed.data : null;
};

export const readStoredReceiver = (value: unknown): InvoiceReceiverPayload | null => {
  const parsed = storedReceiverSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

// El nombre que se muestra: razón social, nombre de fantasía o consumidor final.
export const getReceiverName = (receiver: InvoiceReceiverPayload | null) =>
  receiver?.razon_social || receiver?.nombre_fantasia || "Consumidor final";
