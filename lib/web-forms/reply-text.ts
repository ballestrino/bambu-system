// El texto de una respuesta a un formulario web: asunto y saludo por defecto,
// firma y la cita del mensaje original. Puro: lo usan el composer, el envío y
// el check.
export type WebFormKindValue = "CONTACT" | "JOB_APPLICATION";

export const WEB_FORM_SIGNATURE = [
  "Saludos,",
  "Bambú Servicios Integrales",
  "contacto@bambu-servicios.com · bambu-servicios.com",
].join("\n");

export const defaultReplySubject = (kind: WebFormKindValue) =>
  kind === "JOB_APPLICATION"
    ? "Tu postulación en Bambú Servicios Integrales"
    : "Tu consulta en Bambú Servicios Integrales";

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

export const buildReplyText = (body: string, quote: ReplyQuote | null) => {
  const parts = [body.trim(), WEB_FORM_SIGNATURE];
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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const paragraphs = (text: string) =>
  text
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px">${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");

export const buildReplyHtml = (body: string, quote: ReplyQuote | null) => {
  const signature = `<p style="margin:18px 0 0;color:#4b5563">${escapeHtml(WEB_FORM_SIGNATURE).replace(/\n/g, "<br>")}</p>`;
  const quoted = quote?.message.trim()
    ? `<p style="margin:24px 0 6px;color:#6b7280;font-size:13px">${escapeHtml(quoteHeader(quote))}</p>` +
      `<blockquote style="margin:0;padding:0 0 0 12px;border-left:3px solid #d1d5db;color:#6b7280;font-size:13px">${paragraphs(quote.message)}</blockquote>`
    : "";
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827">${paragraphs(body)}${signature}${quoted}</div>`;
};
