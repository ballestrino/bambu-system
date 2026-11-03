import { z } from "zod";

import {
  DELIVERY_RECIPIENT_MAX,
  INVOICE_MAIL_MESSAGE_MAX,
  INVOICE_MAIL_SUBJECT_MAX,
  MAX_DELIVERY_RECIPIENTS,
} from "@/lib/billing/invoice-delivery";

// Mandar una factura emitida por correo (feature 53). requestId lo genera el
// diálogo al abrirse: un doble clic o un reintento no mandan dos correos.
export const invoiceSendSchema = z.object({
  invoiceId: z.string().trim().min(1),
  requestId: z.string().uuid(),
  to: z.array(z.string().trim().max(DELIVERY_RECIPIENT_MAX)).min(1, "Agregá al menos un correo").max(MAX_DELIVERY_RECIPIENTS, `Hasta ${MAX_DELIVERY_RECIPIENTS} correos por envío`),
  subject: z.string().trim().min(1, "El asunto no puede quedar vacío").max(INVOICE_MAIL_SUBJECT_MAX, `Hasta ${INVOICE_MAIL_SUBJECT_MAX} caracteres en el asunto`),
  message: z.string().trim().min(1, "El mensaje no puede quedar vacío").max(INVOICE_MAIL_MESSAGE_MAX, `Hasta ${INVOICE_MAIL_MESSAGE_MAX} caracteres en el mensaje`),
});

export type InvoiceSendRequest = z.infer<typeof invoiceSendSchema>;

// Anotar a mano que se mandó por correo o WhatsApp.
export const invoiceDeliveryAddSchema = z.object({
  invoiceId: z.string().trim().min(1),
  channel: z.enum(["EMAIL", "WHATSAPP"]),
  recipient: z.string().trim().min(1, "Escribí a quién se mandó").max(DELIVERY_RECIPIENT_MAX),
});

export type InvoiceDeliveryAdd = z.infer<typeof invoiceDeliveryAddSchema>;

export const invoiceDeliveryRemoveSchema = z.object({ deliveryId: z.string().trim().min(1) });

export type InvoiceDeliveryRemove = z.infer<typeof invoiceDeliveryRemoveSchema>;
