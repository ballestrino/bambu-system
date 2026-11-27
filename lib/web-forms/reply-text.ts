// El texto de una respuesta a un formulario web: asunto y saludo por defecto,
// firma y la cita del mensaje original. Puro: lo usan el composer, el envío y
// el check. El cuerpo con formato se arma en reply-doc.ts.
import { escapeHtml, replyDocToHtml, type ReplyDoc } from "@/lib/web-forms/reply-doc";

export type WebFormKindValue = "CONTACT" | "JOB_APPLICATION";

const BUSINESS = "Bambú Servicios Integrales";

// El saludo de cierre es opcional (quien responde puede escribir el suyo); los
// datos de la empresa van siempre.
export const WEB_FORM_CLOSING = "Saludos,";

export const WEB_FORM_SIGNATURE = [BUSINESS, "contacto@bambu-servicios.com · bambu-servicios.com"].join("\n");

export const replySignature = (includeClosing: boolean) =>
  includeClosing ? `${WEB_FORM_CLOSING}\n${WEB_FORM_SIGNATURE}` : WEB_FORM_SIGNATURE;

// "Limpieza Doméstica" → "Petición de servicio de limpieza doméstica - …". Sin
// servicio, "Otro" o uno que no es de limpieza: el genérico.
const serviceSubject = (service: string | null | undefined) => {
  const phrase = service?.trim().toLocaleLowerCase("es") ?? "";
  const cleaning = phrase.startsWith("limpieza") ? phrase : "limpieza";
  return `Petición de servicio de ${cleaning} - ${BUSINESS}`;
};

export const defaultReplySubject = (kind: WebFormKindValue, service?: string | null) =>
  kind === "JOB_APPLICATION" ? `Tu postulación en ${BUSINESS}` : serviceSubject(service);

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export const defaultReplyBody = (name: string) => {
  const first = firstName(name);
  return first ? `Hola ${first},\n\n` : "Hola,\n\n";
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("es-UY", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Montevideo",
  }).format(date);

export type ReplyQuote = { name: string; sentAt: Date; message: string };

const quoteHeader = (quote: ReplyQuote) =>
  `El ${formatDate(quote.sentAt)}, ${quote.name} escribió en el formulario de la web:`;

export const buildReplyText = (body: string, quote: ReplyQuote | null, includeClosing = true) => {
  const parts = [body.trim(), replySignature(includeClosing)];
  if (quote?.message.trim()) {
    const quoted = quote.message
      .trim()
      .split(/\r?\n/)
      .map((line) => `> ${line}`)
      .join("\n");
    parts.push(`${quoteHeader(quote)}\n${quoted}`);
  }
  return parts.join("\n\n");
};

const paragraphs = (text: string) =>
  text
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px">${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");

export const buildReplyHtml = (body: ReplyDoc, quote: ReplyQuote | null, includeClosing = true) => {
  const signature = `<p style="margin:18px 0 0;color:#4b5563">${escapeHtml(replySignature(includeClosing)).replace(/\n/g, "<br>")}</p>`;
  const quoted = quote?.message.trim()
    ? `<p style="margin:24px 0 6px;color:#6b7280;font-size:13px">${escapeHtml(quoteHeader(quote))}</p>` +
      `<blockquote style="margin:0;padding:0 0 0 12px;border-left:3px solid #d1d5db;color:#6b7280;font-size:13px">${paragraphs(quote.message)}</blockquote>`
    : "";
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827">${replyDocToHtml(body)}${signature}${quoted}</div>`;
};
