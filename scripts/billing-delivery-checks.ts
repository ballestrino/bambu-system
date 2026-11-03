import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import {
  buildInvoiceEmailDefaults,
  buildInvoiceEmailHtml,
  canSendInvoice,
  getDeliveryKey,
  getDeliverySummary,
  getInvoicePdfName,
  INVOICE_MAIL_FROM,
  normalizeDeliveryRecipient,
  normalizeEmailList,
  toDeliveryRows,
} from "../lib/billing/invoice-delivery";
import { invoiceSendSchema } from "../schemas/billing-delivery";
import { findForbiddenImport, readRepoSource } from "./billing-import-graph";

// Feature 53: enviar por correo, descargar y el registro de envíos.
const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n");

// --- Correo y WhatsApp: normalizar, validar y deduplicar.
assert.deepEqual(normalizeDeliveryRecipient("EMAIL", "  Cliente@Ejemplo.COM "), { ok: true, recipient: "cliente@ejemplo.com" });
assert.equal(normalizeDeliveryRecipient("EMAIL", "cliente@ejemplo").ok, false);
assert.equal(normalizeDeliveryRecipient("EMAIL", " ").ok, false);
assert.deepEqual(normalizeDeliveryRecipient("WHATSAPP", "099 888 777"), { ok: true, recipient: "099888777" });
assert.deepEqual(normalizeDeliveryRecipient("WHATSAPP", "+598 (99) 888-777"), { ok: true, recipient: "+59899888777" });
assert.equal(normalizeDeliveryRecipient("WHATSAPP", "1234").ok, false);
assert.equal(normalizeDeliveryRecipient("WHATSAPP", "099 888 77a").ok, false);
assert.equal(getDeliveryKey("WHATSAPP", "+59899888777"), getDeliveryKey("WHATSAPP", "099888777"));
assert.equal(getDeliveryKey("EMAIL", "A@b.com"), getDeliveryKey("EMAIL", "a@b.com"));
assert.notEqual(getDeliveryKey("EMAIL", "099888777@x.com"), getDeliveryKey("WHATSAPP", "099888777"));

assert.deepEqual(normalizeEmailList(["A@b.com", "a@b.com", "c@d.com"]), { emails: ["a@b.com", "c@d.com"] });
assert.ok("error" in normalizeEmailList([]));
assert.ok("error" in normalizeEmailList(["a@b.com", "malo"]));
assert.ok("error" in normalizeEmailList(Array.from({ length: 11 }, (_, index) => `c${index}@d.com`)));

// --- Se manda lo emitido y no rechazado, con id de Biller.
assert.equal(canSendInvoice({ billerId: 1, status: "ACCEPTED" }), true);
assert.equal(canSendInvoice({ billerId: 1, status: "ISSUED" }), true);
assert.equal(canSendInvoice({ billerId: 1, status: "REJECTED" }), false);
assert.equal(canSendInvoice({ billerId: null, status: "UNKNOWN" }), false);
assert.equal(canSendInvoice({ billerId: null, status: "ACCEPTED" }), false);

// --- Registro: una fila por envío, por fecha; los íconos sin repetir.
const rows = toDeliveryRows([
  { channel: "WHATSAPP", createdBy: { name: "Nacho" }, id: "d2", recipient: "099888777", sentAt: new Date("2026-11-03T15:00:00Z"), source: "MANUAL" },
  { channel: "EMAIL", createdBy: null, id: "d1", recipient: "cliente@ejemplo.com", sentAt: new Date("2026-11-03T14:00:00Z"), source: "SYSTEM" },
  { channel: "EMAIL", id: "d3", recipient: "contador@ejemplo.com", sentAt: new Date("2026-11-03T16:00:00Z"), source: "SYSTEM" },
  { channel: "WHATSAPP", id: "d4", recipient: "+59899888777", sentAt: new Date("2026-11-03T17:00:00Z"), source: "MANUAL" },
]);
assert.deepEqual(rows.map((row) => row.id), ["d1", "d2", "d3", "d4"]);
assert.equal(rows[1]?.by, "Nacho");
assert.equal(rows[0]?.sentAt, "2026-11-03T14:00:00.000Z");
assert.deepEqual(getDeliverySummary(rows), { email: ["cliente@ejemplo.com", "contador@ejemplo.com"], whatsapp: ["099888777"] });
assert.deepEqual(getDeliverySummary([]), { email: [], whatsapp: [] });
assert.deepEqual(toDeliveryRows(undefined), []);

// --- El PDF: el mismo nombre en la descarga y en el adjunto.
assert.equal(getInvoicePdfName({ billerId: 9, cfeType: 111, number: 123, series: "A" }), "CFE-111-A123.pdf");
assert.equal(getInvoicePdfName({ billerId: 9, cfeType: 101, number: null, series: null }), "CFE-101-9.pdf");

// --- El correo: remitente, asunto y mensaje por defecto, HTML escapado.
assert.equal(INVOICE_MAIL_FROM, "Bambú Servicios <facturacion@bambu-servicios.com>");
const defaults = buildInvoiceEmailDefaults({ cfeType: 111, currency: "UYU", issueDate: "2026-11-03", number: 123, series: "A", total: 3660 });
assert.equal(defaults.subject, "e-Factura A 123 · Bambú Servicios");
assert.match(defaults.message, /e-Factura A 123 del 03\/11\/2026 por \$ 3\.660\./);
assert.match(buildInvoiceEmailDefaults({ cfeType: 101, currency: "USD", issueDate: null, number: 5, series: "B", total: 10.5 }).message, /e-Ticket B 5 por US\$ 10,5\./);
const html = buildInvoiceEmailHtml("Hola <b>Ana</b>,\r\n\r\nLínea 1\nLínea 2 & \"más\"");
assert.ok(!html.includes("<b>"));
assert.match(html, /Hola &lt;b&gt;Ana&lt;\/b&gt;,<\/p>/);
assert.match(html, /Línea 1<br>Línea 2 &amp; &quot;más&quot;/);

// --- El pedido de enviar: requestId, asunto y destinatarios.
const request = { invoiceId: "i1", message: "Hola", requestId: "7f0c4c9e-2a0b-4c1f-9d8e-1a2b3c4d5e6f", subject: "Factura", to: ["a@b.com"] };
assert.ok(invoiceSendSchema.safeParse(request).success);
assert.ok(!invoiceSendSchema.safeParse({ ...request, requestId: "x" }).success);
assert.ok(!invoiceSendSchema.safeParse({ ...request, to: [] }).success);
assert.ok(!invoiceSendSchema.safeParse({ ...request, subject: " " }).success);

// --- Server: Resend con clave de idempotencia; acciones solo admin; la ruta
// del PDF descarga con ?download=1; lo de Bambú no se borra.
assert.match(read("lib/billing/invoice-mail.ts"), /^import "server-only";[\s\S]*idempotencyKey: `invoice-send\/\$\{input\.requestId\}`/);
assert.match(read("lib/billing/invoice-mail.ts"), /response\.error/);
for (const action of ["invoice-send", "invoice-delivery"]) {
  assert.match(read(`actions/billing/${action}.ts`), /^"use server";[\s\S]*requireAdminSession\(\)/, `${action} requires admin`);
}
assert.match(read("actions/billing/invoice-send.ts"), /findSentRequest[\s\S]*sendInvoiceMail[\s\S]*recordSystemDeliveries/);
assert.match(read("lib/billing/invoice-delivery-store.ts"), /skipDuplicates: true/);
assert.match(read("lib/billing/invoice-delivery-store.ts"), /deleteMany\(\{ where: \{ id: input\.deliveryId, source: "MANUAL" \} \}\)/);
assert.match(read("app/api/billing/invoices/[id]/pdf/route.ts"), /get\("download"\) === "1" \? "attachment" : "inline"/);

// --- El agente no envía ni anota: nada suyo llega, ni por el medio, al envío.
const listFiles = (dir: string): string[] => {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full).flatMap((name) => {
    const path = join(full, name);
    return statSync(path).isDirectory()
      ? listFiles(relative(root, path))
      : /\.(ts|tsx)$/.test(name) ? [relative(root, path).replace(/\\/g, "/")] : [];
  });
};
const isDeliveryWrite = (path: string) =>
  /^(lib\/billing\/(invoice-mail|invoice-delivery-store)|actions\/billing\/invoice-(send|delivery)|components\/billing\/actions\/invoice-delivery\.action)\.ts$/.test(path);
const agentEntries = [
  ...listFiles("lib/agent"), ...listFiles("app/api/agent"), ...listFiles("components/agent"),
  "components/billing/billing-agent.tsx",
  "components/billing/new-invoice/new-invoice-agent.tsx",
];
const leak = findForbiddenImport(agentEntries, isDeliveryWrite, readRepoSource(root));
assert.equal(leak, null, `the agent reaches the invoice send code: ${leak?.join(" -> ")}`);
for (const file of listFiles("lib/agent")) assert.doesNotMatch(read(file), /invoiceDelivery/, `${file} touches invoiceDelivery`);
// La lista de "Emitidas" del agente no copia los envíos.
assert.doesNotMatch(read("lib/agent/tools/billing.ts"), /deliveries|receiverEmails/);
// El chequeo encuentra una cadena indirecta hasta el envío.
const fixture: Record<string, string> = {
  "lib/agent/tools/fake.ts": 'import { helper } from "@/lib/billing/helper";',
  "lib/billing/helper.ts": 'export { sendInvoiceMail } from "./invoice-mail";',
  "lib/billing/invoice-mail.ts": "export const sendInvoiceMail = 1;",
};
assert.deepEqual(
  findForbiddenImport(["lib/agent/tools/fake.ts"], isDeliveryWrite, (path) => fixture[path] ?? null),
  ["lib/agent/tools/fake.ts", "lib/billing/helper.ts", "lib/billing/invoice-mail.ts"]
);
