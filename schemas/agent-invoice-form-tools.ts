import { z } from "zod";

// Entradas de las tools de Nueva factura (feature 46, docs/billing.md). Como
// el resto: campos obligatorios y nullable, null es "sin cambio".
const text = (max: number, description: string) => z.string().trim().max(max).nullable().describe(description);
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha aaaa-mm-dd")
  .nullable();

export const INVOICE_FORM_DOCUMENT_TYPES = { RUT: 2, CI: 3, Otro: 4, Pasaporte: 5, DNI: 6, NIFE: 7 } as const;

const itemSchema = z.object({
  concepto: z.string().trim().min(1).max(80).describe("Concepto de la línea, hasta 80 caracteres"),
  cantidad: z.number().finite().positive().max(1_000_000).nullable().describe("Cantidad; null es 1"),
  precio: z.number().finite().min(0).max(1_000_000_000).describe("Precio unitario SIN IVA, de una tool o pedido por el usuario"),
  unidad: text(4, "Unidad de medida (hasta 4 letras, por ejemplo h o un); null sin unidad"),
  indicador: z
    .number()
    .int()
    .min(1)
    .max(16)
    .nullable()
    .describe("Indicador de IVA (2: 10 %, 3: 22 %, 16: IVA mínimo); null usa el del formulario"),
  descripcion: text(500, "Descripción larga de la línea; null sin descripción"),
});

export const fillInvoiceFormInputSchema = z.object({
  cfeType: z.enum(["e-Factura", "e-Ticket"]).nullable().describe("Tipo de comprobante; null no cambia"),
  issueDate: day.describe("Fecha de emisión aaaa-mm-dd (hasta dos meses a futuro); null no cambia"),
  payment: z.enum(["contado", "credito"]).nullable().describe("Forma de pago; null no cambia"),
  creditDays: z
    .number()
    .int()
    .min(0)
    .max(365)
    .nullable()
    .describe("Con crédito: días hasta el vencimiento desde la emisión; null deja el vencimiento (o 10 días si no tenía)"),
  currency: z.enum(["UYU", "USD"]).nullable().describe("Moneda; null no cambia"),
  purchaseOrder: text(50, "Orden de compra; cadena vacía la borra; null no cambia"),
  clientDocument: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .nullable()
    .describe("Documento (RUT o CI) del cliente: carga sus datos de su última factura o, si es un RUT nuevo, de DGI. null no busca"),
  consumer: z.boolean().nullable().describe("true: e-Ticket a consumidor final, sin datos del cliente; null no cambia"),
  client: z
    .object({
      documentType: z.enum(["RUT", "CI", "Otro", "Pasaporte", "DNI", "NIFE"]).nullable(),
      document: text(20, "Número de documento"),
      name: text(70, "Razón social (RUT) o nombre"),
      tradeName: text(30, "Nombre de fantasía"),
      address: text(70, "Dirección"),
      city: text(30, "Ciudad"),
      department: text(30, "Departamento"),
      emails: z.array(z.email().max(120)).max(10).nullable().describe("Emails que Biller suma a los del cliente; null no cambia"),
    })
    .nullable()
    .describe("Datos del cliente escritos a mano (pisan los de clientDocument); cada campo null no cambia. null si no hay"),
  items: z
    .array(itemSchema)
    .min(1)
    .max(40)
    .nullable()
    .describe("Las líneas de la factura: reemplazan TODAS las del formulario (mandá también las que quedan). null no cambia"),
  adenda: text(1000, "Adenda (texto libre que sale en el PDF); cadena vacía la borra; null no cambia"),
});

export type FillInvoiceFormInput = z.infer<typeof fillInvoiceFormInputSchema>;

export const findBillingClientInputSchema = z.object({
  query: z.string().trim().min(2).max(60).describe("Razón social, nombre de fantasía o parte del documento"),
});
