import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { resolveSmtpAccount } from "../lib/mailbox/smtp-account";
import { checkCvFile, detectCvType, sanitizeCvFilename, WEB_FORM_MAX_FILE_BYTES } from "../lib/web-forms/file-type";
import { getWebFormsSecret, isWebFormsRequestAuthorized } from "../lib/web-forms/inbound-secret";
import { toWhatsAppNumber } from "../lib/web-forms/labels";
import { buildCvClassificationPrompt, pickCvIds } from "../lib/web-forms/cv-classification";
import { findFolderPath, noticeKindFromSubject, planMailSort, WEB_FORM_MAIL_FOLDERS } from "../lib/web-forms/mail-sorting";
import { replyDocSchema, replyDocToHtml, replyDocToText, textToReplyDoc } from "../lib/web-forms/reply-doc";
import { agentBudgetContextSchema } from "../schemas/agent";
import "./web-forms-format-checks";
import { buildReplyHtml, buildReplyText, defaultReplyBody, defaultReplySubject } from "../lib/web-forms/reply-text";
import { publicRoutes } from "../routes";
import { replyWebFormSchema, webFormInboundSchema } from "../schemas/web-forms";

// Formularios web (features 74 y 75): entrada de la web, CV, secreto, SMTP,
// respuesta con formato, Detectar currículums y mover avisos. Sin base ni red.

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
assert.ok(text.includes("Saludos,\nBambú"));
assert.ok(!buildReplyText("Hola", null, false).includes("Saludos,"));
assert.ok(buildReplyText("Hola", null, false).includes("Bambú Servicios Integrales"));
const html = buildReplyHtml(textToReplyDoc("Hola <b>Ana</b>"), quote);
assert.ok(!html.includes("<script>") && !html.includes("<b>Ana"));
assert.ok(html.includes("&lt;script&gt;"));
const replyInput = { id: "cmwxo9eze00000hd09zzlc2ig", requestId: "r".repeat(36), subject: "x" };
assert.equal(replyWebFormSchema.safeParse({ ...replyInput, content: textToReplyDoc(" ") }).success, false);
assert.equal(replyWebFormSchema.safeParse({ ...replyInput, content: textToReplyDoc("Hola Ana") }).success, true);

// --- Asunto con el servicio pedido.
assert.equal(defaultReplySubject("CONTACT", "Limpieza Doméstica"), "Petición de servicio de limpieza doméstica - Bambú Servicios Integrales");
assert.equal(defaultReplySubject("CONTACT", "Otro"), "Petición de servicio de limpieza - Bambú Servicios Integrales");
assert.equal(defaultReplySubject("CONTACT", null), "Petición de servicio de limpieza - Bambú Servicios Integrales");

// --- Formato: negrita, cursiva y solo los tamaños permitidos; texto escapado.
const formatted = {
  type: "doc",
  content: [
    { type: "paragraph", content: [] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Precio", marks: [{ type: "bold" }, { type: "italic" }] },
        { type: "hardBreak" },
        { type: "text", text: "<x>", marks: [{ type: "textStyle", attrs: { fontSize: "18px" } }] },
        { type: "text", text: "raro", marks: [{ type: "textStyle", attrs: { fontSize: "99px;color:red" } }] },
      ],
    },
    { type: "paragraph", content: [] },
  ],
};
const doc = replyDocSchema.parse(formatted);
assert.equal(replyDocToText(doc), "\nPrecio\n<x>raro\n");
const docHtml = replyDocToHtml(doc);
assert.equal(
  docHtml,
  '<p style="margin:0"><strong><em>Precio</em></strong><br><span style="font-size:18px">&lt;x&gt;</span>raro</p>'
);
assert.equal(replyDocSchema.safeParse({ type: "doc", content: [{ type: "heading", content: [] }] }).success, false);
assert.equal(replyDocToText(textToReplyDoc("Hola Ana,\n\n")), "Hola Ana,\n\n");

// --- Detectar currículums: solo referencias que existen, sin repetidos.
const candidates = [
  { id: "a", name: "Ana", service: "Limpieza Doméstica", location: null, message: "Quiero presupuesto" },
  { id: "b", name: "Bea", service: "Otro", location: null, message: "Busco trabajo de limpiadora" },
];
assert.ok(buildCvClassificationPrompt(candidates).includes("P2. Bea"));
assert.deepEqual(
  pickCvIds(candidates, { curriculums: [{ ref: "p2", reason: "busca trabajo" }, { ref: "P2", reason: "" }, { ref: "P9", reason: "" }] }),
  ["b"]
);
assert.deepEqual(pickCvIds(candidates, null), []);

// --- Mover avisos: carpeta por nombre (prefijo y tildes), tipo del formulario.
const boxes = [
  { path: "INBOX", name: "INBOX" },
  { path: "INBOX.Trabaja con nosotros", name: "Trabaja con nosotros" },
  { path: "INBOX.Solicitudes de presupuesto", name: "solicitudes de  presupuesto" },
];
assert.equal(findFolderPath(boxes, WEB_FORM_MAIL_FOLDERS.JOB_APPLICATION), "INBOX.Trabaja con nosotros");
assert.equal(findFolderPath(boxes, WEB_FORM_MAIL_FOLDERS.CONTACT), "INBOX.Solicitudes de presupuesto");
assert.equal(findFolderPath(boxes, "Otra"), null);
const day = new Date("2026-11-20T12:00:00Z");
const notices = [
  { uid: 1, subject: "Petición de servicio Web", replyTo: "ana@x.com", date: day },
  { uid: 2, subject: "Peticion de servicio web", replyTo: "Bea@x.com", date: day },
  { uid: 3, subject: "Trabaja con nosotros", replyTo: "caro@x.com", date: day },
  { uid: 4, subject: "Petición de servicio Web", replyTo: "nadie@x.com", date: day },
  { uid: 5, subject: "Factura de noviembre", replyTo: "ana@x.com", date: day },
  { uid: 6, subject: "Petición de servicio Web", replyTo: "ana@x.com", date: new Date("2026-10-01T12:00:00Z") },
];
const known = [
  { email: "ana@x.com", createdAt: new Date("2026-11-20T12:00:05Z"), kind: "CONTACT" as const },
  { email: "bea@x.com", createdAt: new Date("2026-11-20T11:59:00Z"), kind: "JOB_APPLICATION" as const },
];
assert.deepEqual(planMailSort(notices, known, "CONTACT"), { uids: [1], unmatched: 2 });
assert.deepEqual(planMailSort(notices, known, "JOB_APPLICATION"), { uids: [2, 3], unmatched: 2 });
assert.equal(noticeKindFromSubject("Trabaja con nosotros"), "JOB_APPLICATION");

// --- El agente recibe el formulario como contexto; mover solo está acá.
assert.ok(agentBudgetContextSchema.safeParse({ kind: "web-form", submissionId: "cmwxo9eze00000hd09zzlc2ig" }).success);
assert.ok(readFileSync("lib/web-forms/sort-mail.ts", "utf8").includes("messageMove"));

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
