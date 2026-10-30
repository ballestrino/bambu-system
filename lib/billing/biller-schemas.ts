import { z } from "zod";

// Biller arma el JSON desde XML: un texto vacío llega como [] o {}. Se pasan a
// null antes de validar (probado en test el 2026-10-30, ver docs/billing.md).
const blankToNull = (value: unknown) => {
  if (Array.isArray(value) && value.length === 0) return null;
  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) {
    return null;
  }
  return value;
};

const text = z.preprocess(
  blankToNull,
  z
    .union([z.string(), z.number()])
    .nullish()
    .transform((value) => (value === null || value === undefined || value === "" ? null : String(value)))
);
const decimal = z.union([z.string(), z.number()]).transform(String);
const integer = z.union([z.number().int(), z.string().regex(/^-?\d+$/)]).transform(Number);

const billerBranchSchema = z.object({
  direccion: text.optional(),
  ciudad: text.optional(),
  departamento: text.optional(),
  pais: text.optional(),
});

export const billerReceiverSchema = z.object({
  tipo_documento: z.union([z.string(), z.number()]).transform(String),
  documento: text.optional(),
  razon_social: text.optional(),
  nombre_fantasia: text.optional(),
  sucursal: z.preprocess(blankToNull, billerBranchSchema.nullish()).optional(),
});

export const billerItemSchema = z.object({
  codigo: text.optional(),
  cantidad: decimal,
  concepto: z.string(),
  descripcion: text.optional(),
  precio: decimal,
  indicador_facturacion: integer,
  unidad_medida: text.optional(),
  descuento_tipo: text.optional(),
  descuento_cantidad: text.optional(),
  recargo_tipo: text.optional(),
  recargo_cantidad: text.optional(),
});

export const billerReferenceSchema = z.object({
  id: z.number().int().nullish(),
  tipo_comprobante: integer,
  serie: text.optional(),
  numero: integer,
  fecha_emision: text.optional(),
});

const billerCaeSchema = z.object({
  numero: text.optional(),
  serie: text.optional(),
  inicio: integer.nullish(),
  fin: integer.nullish(),
  fecha_expiracion: text.optional(),
});

// Una fila de GET /v2/comprobantes/obtener: sin ítems ni referencias.
export const billerInvoiceSchema = z.object({
  id: z.number().int(),
  tipo_comprobante: integer,
  serie: text.optional(),
  numero: integer,
  sucursal: integer.nullish(),
  numero_interno: text.optional(),
  moneda: z.string().default("UYU"),
  total: decimal,
  estado: text.optional(),
  cliente: z.preprocess(blankToNull, billerReceiverSchema.nullish()).optional(),
  adenda: text.optional(),
  // v3 lo llama numero_compra; obtener (v2) lo devuelve como numero_orden.
  numero_compra: text.optional(),
  numero_orden: text.optional(),
  fecha_creacion: text.optional(),
  fecha_emision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_vencimiento: text.optional(),
  cae: z.preprocess(blankToNull, billerCaeSchema.nullish()).optional(),
});

// GET /v3/comprobantes/detalle: la fila más ítems y referencias.
export const billerInvoiceDetailSchema = billerInvoiceSchema.extend({
  items: z.preprocess(blankToNull, z.array(billerItemSchema).nullish()).optional(),
  referencias: z.preprocess(blankToNull, z.array(billerReferenceSchema).nullish()).optional(),
  referenciado_por: z.preprocess(blankToNull, z.array(billerReferenceSchema).nullish()).optional(),
});

export const billerInvoiceListSchema = z.array(billerInvoiceSchema);

// GET /v2/dgi/empresas/datos-entidad. En test devuelve siempre la misma
// entidad de prueba, sea cual sea el RUT pedido.
export const billerEntitySchema = z.object({
  RUC: text,
  RazonSocial: text,
  WS_DomicilioFiscalPrincipal: z
    .preprocess(
      blankToNull,
      z
        .object({
          Calle_Nom: text.optional(),
          Dom_Pta_Nro: text.optional(),
          Loc_Nom: text.optional(),
          Dpto_Nom: text.optional(),
        })
        .nullish()
    )
    .optional(),
});

export type BillerReceiver = z.infer<typeof billerReceiverSchema>;
export type BillerItem = z.infer<typeof billerItemSchema>;
export type BillerReference = z.infer<typeof billerReferenceSchema>;
export type BillerInvoice = z.infer<typeof billerInvoiceSchema>;
export type BillerInvoiceDetail = z.infer<typeof billerInvoiceDetailSchema>;
export type BillerEntity = z.infer<typeof billerEntitySchema>;
