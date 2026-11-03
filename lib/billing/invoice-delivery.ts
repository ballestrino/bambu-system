import type { InvoiceDeliveryChannel, InvoiceDeliverySource, InvoiceStatus } from "@prisma/client";

import { getCfeLabel } from "@/lib/billing/invoice-mapping";
import { EMAIL_PATTERN } from "@/lib/billing/new-invoice";

// A dónde se mandó una factura emitida (feature 53). Puro: lo usan la página,
// las acciones y check:billing.

export const DELIVERY_CHANNEL_LABEL: Record<InvoiceDeliveryChannel, string> = { EMAIL: "Correo", WHATSAPP: "WhatsApp" };

// El remitente (decidido por el usuario): facturacion@ es un alias de
// contacto@, así que las respuestas llegan a esa casilla. Sale por Resend.
export const INVOICE_MAIL_ADDRESS = "facturacion@bambu-servicios.com";
export const INVOICE_MAIL_FROM = `Bambú Servicios <${INVOICE_MAIL_ADDRESS}>`;

export const MAX_DELIVERY_RECIPIENTS = 10;
export const INVOICE_MAIL_SUBJECT_MAX = 150;
export const INVOICE_MAIL_MESSAGE_MAX = 2000;
export const DELIVERY_RECIPIENT_MAX = 254;

// Se manda (y se anota) lo que ya está emitido; un rechazo o una en curso, no.
export const SENDABLE_STATUSES = ["ISSUED", "ACCEPTED"] as const satisfies readonly InvoiceStatus[];

export const canSendInvoice = (invoice: { billerId: number | null; status: InvoiceStatus }) =>
  invoice.billerId !== null && (SENDABLE_STATUSES as readonly InvoiceStatus[]).includes(invoice.status);

export type RecipientResult = { ok: true; recipient: string } | { ok: false; error: string };

// Un correo va en minúsculas; un WhatsApp sin espacios, guiones ni paréntesis
// ("099 888 777" → "099888777", "+598 99 888 777" → "+59899888777").
export const normalizeDeliveryRecipient = (channel: InvoiceDeliveryChannel, value: string): RecipientResult => {
  const text = value.trim();
  if (!text) return { ok: false, error: channel === "EMAIL" ? "Escribí un correo" : "Escribí un teléfono" };
  if (channel === "EMAIL") {
    const email = text.toLowerCase();
    if (email.length > DELIVERY_RECIPIENT_MAX || !EMAIL_PATTERN.test(email)) return { ok: false, error: `«${text}» no es un correo válido` };
    return { ok: true, recipient: email };
  }
  const phone = text.replace(/[\s().-]/g, "");
  if (!/^\+?\d{8,15}$/.test(phone)) return { ok: false, error: `«${text}» no es un teléfono válido (8 a 15 dígitos)` };
  return { ok: true, recipient: phone };
};

// Dos anotaciones son la misma si es el mismo correo o el mismo número: un
// celular uruguayo con +598 es el mismo que con el 0 adelante.
export const getDeliveryKey = (channel: InvoiceDeliveryChannel, recipient: string) => {
  if (channel === "EMAIL") return `EMAIL:${recipient.trim().toLowerCase()}`;
  const digits = recipient.replace(/\D/g, "");
  return `WHATSAPP:${digits.startsWith("598") ? `0${digits.slice(3)}` : digits}`;
};

// Los destinatarios del diálogo de enviar: válidos, sin repetir y hasta 10.
export const normalizeEmailList = (values: string[]): { emails: string[] } | { error: string } => {
  const emails: string[] = [];
  for (const value of values) {
    const result = normalizeDeliveryRecipient("EMAIL", value);
    if (!result.ok) return { error: result.error };
    if (!emails.includes(result.recipient)) emails.push(result.recipient);
  }
  if (!emails.length) return { error: "Agregá al menos un correo" };
  if (emails.length > MAX_DELIVERY_RECIPIENTS) return { error: `Hasta ${MAX_DELIVERY_RECIPIENTS} correos por envío` };
  return { emails };
};

export type DeliveryRow = {
  by: string | null;
  channel: InvoiceDeliveryChannel;
  id: string;
  recipient: string;
  sentAt: string;
  source: InvoiceDeliverySource;
};

export type DeliveryInput = {
  channel: InvoiceDeliveryChannel;
  createdBy?: { name: string | null } | null;
  id: string;
  recipient: string;
  sentAt: Date;
  source: InvoiceDeliverySource;
};

export const toDeliveryRows = (deliveries: DeliveryInput[] = []): DeliveryRow[] =>
  [...deliveries]
    .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())
    .map((delivery) => ({
      by: delivery.createdBy?.name ?? null,
      channel: delivery.channel,
      id: delivery.id,
      recipient: delivery.recipient,
      sentAt: delivery.sentAt.toISOString(),
      source: delivery.source,
    }));

// Para los íconos de la fila: a quiénes se mandó por cada medio, sin repetir.
export const getDeliverySummary = (rows: Pick<DeliveryRow, "channel" | "recipient">[]) => {
  const summary = { email: [] as string[], whatsapp: [] as string[] };
  const seen = new Set<string>();
  for (const row of rows) {
    const key = getDeliveryKey(row.channel, row.recipient);
    if (seen.has(key)) continue;
    seen.add(key);
    summary[row.channel === "EMAIL" ? "email" : "whatsapp"].push(row.recipient);
  }
  return summary;
};

// El mismo nombre en la descarga y en el adjunto del correo.
export const getInvoicePdfName = (invoice: { billerId: number | null; cfeType: number; number: number | null; series: string | null }) =>
  `CFE-${invoice.cfeType}-${invoice.series ?? ""}${invoice.number ?? invoice.billerId ?? ""}.pdf`;

const moneyFormat = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

const formatAmount = (amount: number, currency: string) =>
  `${currency === "UYU" ? "$" : currency === "USD" ? "US$" : currency} ${moneyFormat.format(amount)}`;

// El asunto y el mensaje que trae el diálogo; la persona los puede cambiar.
export const buildInvoiceEmailDefaults = (invoice: {
  cfeType: number; currency: string; issueDate: string | null; number: number | null; series: string | null; total: number;
}) => {
  const label = [getCfeLabel(invoice.cfeType), invoice.series, invoice.number].filter((part) => part !== null && part !== "").join(" ");
  const date = invoice.issueDate ? ` del ${invoice.issueDate.slice(8, 10)}/${invoice.issueDate.slice(5, 7)}/${invoice.issueDate.slice(0, 4)}` : "";
  return {
    subject: `${label} · Bambú Servicios`,
    message: `Hola,\n\nTe enviamos adjunta la ${label}${date} por ${formatAmount(invoice.total, invoice.currency)}.\n\nSaludos,\nBambú Servicios`,
  };
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// El mensaje en HTML: un párrafo por bloque y un salto por renglón, escapado.
export const buildInvoiceEmailHtml = (message: string) => {
  const paragraphs = message
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p style="margin:0 0 14px">${escapeHtml(block).replace(/\n/g, "<br>")}</p>`);
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222">${paragraphs.join("")}</div>`;
};
