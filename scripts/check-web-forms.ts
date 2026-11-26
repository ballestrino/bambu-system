import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { resolveSmtpAccount } from "../lib/mailbox/smtp-account";
import { checkCvFile, detectCvType, sanitizeCvFilename, WEB_FORM_MAX_FILE_BYTES } from "../lib/web-forms/file-type";
import { getWebFormsSecret, isWebFormsRequestAuthorized } from "../lib/web-forms/inbound-secret";
import { toWhatsAppNumber } from "../lib/web-forms/labels";
import { buildReplyHtml, buildReplyText, defaultReplyBody, defaultReplySubject } from "../lib/web-forms/reply-text";
import { publicRoutes } from "../routes";
import { replyWebFormSchema, webFormInboundSchema } from "../schemas/web-forms";

// Formularios web (feature 74): entrada de la web, CV, secreto, SMTP y texto
// de la respuesta. Sin base ni red.

// --- El secreto: sin variable o corto no autoriza nada; compara exacto.
const secret = "x".repeat(40);
assert.equal(getWebFormsSecret({}), null);
assert.equal(getWebFormsSecret({ WEB_FORMS_SECRET: "corto" }), null);
assert.equal(getWebFormsSecret({ WEB_FORMS_SECRET: ` ${secret} ` }), secret);
assert.equal(isWebFormsRequestAuthorized(`Bearer ${secret}`, secret), true);
assert.equal(isWebFormsRequestAuthorized(`Bearer ${secret}y`, secret), false);
assert.equal(isWebFormsRequestAuthorized(secret, secret), false);
assert.equal(isWebFormsRequestAuthorized(`Bearer ${secret}`, null), false);
assert.equal(isWebFormsRequestAuthorized(null, secret), false);

// --- La ruta es pública para el proxy (la protege el secreto); el CV no.
assert.ok(publicRoutes.includes("/api/web-forms"));
assert.ok(!publicRoutes.some((route) => route.includes("attachment")));

// --- El formulario: email en minúsculas, campos opcionales a null, El Trébol.
const contactInput = {
  externalId: "abc12345",
  kind: "CONTACT",
  name: " María ",
  email: "Maria@Example.COM",
  phone: "099 123 456",
  service: "",
  location: "Pocitos",
  message: "Hola",
  fromTrebol: "true",
};
const contact = webFormInboundSchema.parse(contactInput);
assert.equal(contact.email, "maria@example.com");
assert.equal(contact.name, "María");
assert.equal(contact.service, null);
assert.equal(contact.fromTrebol, true);
assert.equal(webFormInboundSchema.parse({ ...contactInput, fromTrebol: undefined, message: undefined }).message, "");
assert.equal(webFormInboundSchema.safeParse({ ...contactInput, externalId: "a b" }).success, false);
assert.equal(webFormInboundSchema.safeParse({ ...contactInput, kind: "OTRO" }).success, false);
assert.equal(webFormInboundSchema.safeParse({ ...contactInput, email: "no-es-mail" }).success, false);

// --- El CV: se mira el contenido, no el nombre; tope de 4 MB; nombre limpio.
const bytes = (...values: number[]) => new Uint8Array([...values, 0, 0, 0, 0]);
assert.equal(detectCvType(bytes(0x25, 0x50, 0x44, 0x46)), "application/pdf");
assert.equal(detectCvType(bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)), "application/msword");
assert.equal(detectCvType(bytes(0x50, 0x4b, 0x03, 0x04)), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
assert.equal(detectCvType(new TextEncoder().encode("<html>")), null);
assert.equal(checkCvFile("cv.pdf", new TextEncoder().encode("hola")).ok, false);
assert.equal(checkCvFile("cv.pdf", new Uint8Array(0)).ok, false);
const tooBig = new Uint8Array(WEB_FORM_MAX_FILE_BYTES + 1);
tooBig.set([0x25, 0x50, 0x44, 0x46]);
assert.equal(checkCvFile("cv.pdf", tooBig).ok, false);
assert.equal(sanitizeCvFilename("../../CV <Juan> Rodríguez.exe", "application/pdf"), "CV Juan Rodríguez.pdf");
assert.equal(sanitizeCvFilename("???", "application/msword"), "curriculum.doc");

// --- El SMTP de contacto@ sale de las variables HOSTINGER_* del buzón.
const env = {
  HOSTINGER_IMAP_HOST: "imap.hostinger.com",
  HOSTINGER_SMTP_HOST: "smtp.hostinger.com",
  HOSTINGER_MAIL_USER: "contacto@bambu-servicios.com",
  HOSTINGER_MAIL_PASSWORD: "clave",
  HOSTINGER_MAIL_FROM: "Bambú <Contacto@Bambu-Servicios.com>",
};
const smtp = resolveSmtpAccount(env);
assert.ok(smtp.ok);
assert.equal(smtp.account.port, 465);
assert.equal(smtp.account.secure, true);
assert.equal(smtp.account.fromAddress, "contacto@bambu-servicios.com");
const starttls = resolveSmtpAccount({ ...env, HOSTINGER_SMTP_PORT: "587" });
assert.ok(starttls.ok && !starttls.account.secure);
const missing = resolveSmtpAccount({ ...env, HOSTINGER_SMTP_HOST: "", HOSTINGER_MAIL_PASSWORD: "" });
assert.ok(!missing.ok && missing.missing.includes("HOSTINGER_SMTP_HOST") && missing.missing.includes("HOSTINGER_MAIL_PASSWORD"));

// --- La respuesta: saludo con el nombre, firma, cita y HTML escapado.
assert.equal(defaultReplyBody("  Ana   Laura Pérez"), "Hola Ana,\n\n");
assert.equal(defaultReplySubject("JOB_APPLICATION"), "Tu postulación en Bambú Servicios Integrales");
const quote = { name: "Ana", sentAt: new Date("2026-11-26T14:52:00Z"), message: "Hola\n<script>x</script>" };
const text = buildReplyText("Hola Ana,\n\nTe paso precio.", quote);
assert.ok(text.includes("Bambú Servicios Integrales"));
assert.ok(text.includes("> <script>x</script>"));
assert.ok(text.includes("11:52"), "la fecha va en hora de Montevideo");
assert.ok(!buildReplyText("Hola", null).includes(">"));
const html = buildReplyHtml("Hola <b>Ana</b>", quote);
assert.ok(!html.includes("<script>") && !html.includes("<b>Ana"));
assert.ok(html.includes("&lt;script&gt;"));
assert.equal(replyWebFormSchema.safeParse({ id: "cmwxo9eze00000hd09zzlc2ig", requestId: "r".repeat(36), subject: "x", body: " " }).success, false);

// --- WhatsApp con números de Uruguay.
assert.equal(toWhatsAppNumber("099 123 456"), "59899123456");
assert.equal(toWhatsAppNumber("99123456"), "59899123456");
assert.equal(toWhatsAppNumber("+598 98 765 432"), "59898765432");
assert.equal(toWhatsAppNumber("2601 2345"), null);

// --- La descarga del CV pide sesión de admin y siempre baja como adjunto.
const attachmentRoute = readFileSync("app/api/web-forms/[id]/attachment/route.ts", "utf8");
assert.ok(attachmentRoute.includes("requireAdminSession()"));
assert.ok(attachmentRoute.includes('"Content-Disposition": `attachment;'));

console.log("check:web-forms OK");
