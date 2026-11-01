import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describeFormChanges, draftToForm, formToDraftData, getDraftEditorBlock, type DraftEditorInvoice } from "../lib/billing/draft-editor";
import { describeSourceChanges } from "../lib/billing/draft-editor-diff";
import { PAYMENT_FORM, type RepeatSource } from "../lib/billing/draft-repeat";
import { getNewInvoiceItems } from "../lib/billing/new-invoice";
import { draftInvoiceFormSchema } from "../schemas/billing-new-invoice";

// Feature 49: el editor lateral del borrador (docs/billing.md).
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");
const oct = new Date(Date.UTC(2026, 9, 1));
const nov = new Date(Date.UTC(2026, 10, 1));

const receiver = {
  tipo_documento: 2, documento: "219667740019", razon_social: "DGI RUC PRUEBA CEDE", nombre_fantasia: null,
  sucursal: { direccion: "Daniel Fernández Crespo 1534", ciudad: "Montevideo", departamento: "Montevideo", pais: "UY" },
};
const item = (concepto: string, precio: number) => ({
  codigo: null, cantidad: 1, concepto, descripcion: null, precio, indicador_facturacion: 3, unidad_medida: null,
  descuento_tipo: "$", descuento_cantidad: 0.125,
});
const invoice: DraftEditorInvoice = {
  adenda: "Servicio de noviembre 2026", cfeType: 111, currency: "UYU", items: [item("Limpieza - noviembre 2026", 12000.3333)],
  paymentForm: PAYMENT_FORM.CREDIT, purchaseOrder: null, receiver,
};
const dates = { dueDate: "2026-11-10", issueDate: "2026-11-03" };

// --- Qué se edita: un borrador abierto, e-Factura o e-Ticket, UYU o USD.
assert.equal(getDraftEditorBlock({ batchStatus: "DRAFT", cfeType: 111, currency: "UYU", status: "DRAFT" }), null);
assert.match(getDraftEditorBlock({ batchStatus: "ISSUING", cfeType: 111, currency: "UYU", status: "DRAFT" }) ?? "", /emit/);
assert.match(getDraftEditorBlock({ batchStatus: "DRAFT", cfeType: 111, currency: "UYU", status: "ISSUED" }) ?? "", /emit/);
assert.match(getDraftEditorBlock({ batchStatus: "DRAFT", cfeType: 112, currency: "UYU", status: "DRAFT" }) ?? "", /notas/);
assert.match(getDraftEditorBlock({ batchStatus: "DRAFT", cfeType: 101, currency: "EUR", status: "DRAFT" }) ?? "", /EUR/);

// --- La factura en el formulario, sin redondear y con sus fechas.
const form = draftToForm(invoice, dates);
assert.equal(form.items[0].precio, "12000,3333");
assert.equal(form.items[0].descuento, "0,125");
assert.equal(form.document, "219667740019");
assert.equal(form.paymentForm, PAYMENT_FORM.CREDIT);
assert.deepEqual([form.issueDate, form.dueDate], ["2026-11-03", "2026-11-10"]);
assert.equal(getNewInvoiceItems(form)[0].precio, 12000.3333);
assert.equal(draftToForm({ ...invoice, paymentForm: PAYMENT_FORM.CASH }, dates).dueDate, "");
const consumer = draftToForm({ ...invoice, cfeType: 101, receiver: null }, dates);
assert.equal(consumer.consumer, true);
assert.equal(draftToForm({ ...invoice, items: null }, dates).items.length, 1);

// --- Sin tocar el cliente ni los ítems quedan los guardados tal cual.
const untouched = formToDraftData(invoice, form, { ...form, adenda: "Otra" });
assert.equal(untouched.receiver, receiver);
assert.equal(untouched.items, invoice.items);
assert.equal(untouched.adenda, "Otra");
const repriced = formToDraftData(invoice, form, { ...form, items: [{ ...form.items[0], precio: "13.000" }] });
assert.equal(repriced.items[0].precio, 13000);
assert.equal(repriced.total, Math.round((13000 - 0.125) * 1.22 * 100) / 100);
const retyped = formToDraftData(invoice, form, { ...form, name: "Otra razón" });
assert.equal(retyped.receiver?.razon_social, "Otra razón");
assert.equal(retyped.receiverDocument, "219667740019");

// --- Lo que cambió, en palabras (auditoría y aviso).
const after = { ...form, cfeType: 101 as const, items: [{ ...form.items[0], precio: "13000" }], paymentForm: PAYMENT_FORM.CASH, dueDate: "" };
const notes = describeFormChanges(form, after, { before: invoice.items!, after: getNewInvoiceItems(after) });
assert.ok(notes.includes("Tipo e-Factura → e-Ticket"), notes.join(" | "));
assert.ok(notes.includes("Crédito → Contado"));
assert.ok(notes.some((note) => /^Precio \$ 12\.000,33 → \$ 13\.000 sin IVA$/.test(note)), notes.join(" | "));
assert.ok(!notes.some((note) => note.startsWith("Cliente")), "cambiar el tipo no es cambiar el cliente");
assert.deepEqual(describeFormChanges(form, form, { before: invoice.items!, after: invoice.items! }), []);
assert.deepEqual(describeFormChanges(form, { ...form, dueDate: "2026-11-20" }, { before: [], after: [] }), ["Vencimiento 10/11/2026 → 20/11/2026"]);

// --- Contra el mes pasado: el mes que se movió solo no cuenta.
const source: RepeatSource = {
  adenda: "Servicio de octubre 2026", billerId: 1, cfeType: 111, currency: "UYU", dueDate: new Date(Date.UTC(2026, 9, 25)), id: "src",
  issueDate: new Date(Date.UTC(2026, 9, 5)), items: [item("Limpieza - octubre 2026", 12000.3333)], paymentForm: null, receiver,
  receiverDocument: "219667740019", status: "ACCEPTED",
};
assert.deepEqual(describeSourceChanges(invoice, source, { from: oct, to: nov }), []);
const changed = describeSourceChanges({ ...invoice, items: [item("Limpieza - noviembre 2026", 12500)], paymentForm: PAYMENT_FORM.CASH }, source, { from: oct, to: nov });
assert.deepEqual(changed, ["Crédito → Contado", "Precio $ 12.000,33 → $ 12.500 sin IVA"]);

// --- El pedido de guardar trae el updatedAt que vio el editor.
assert.equal(draftInvoiceFormSchema.safeParse({ form, invoiceId: "a", updatedAt: "ayer" }).success, false);
assert.equal(draftInvoiceFormSchema.safeParse({ form, invoiceId: "a", updatedAt: new Date().toISOString() }).success, true);

// --- Fuente: compare-and-set, locks y auditoría al guardar; el editor
// vive dentro del diálogo de emitir y usa la cola de la fila.
const store = read("lib/billing/draft-editor-store.ts");
assert.match(store, /lockBillingPeriod\(tx, seen\.batch\.period\)[\s\S]*lockBatch\(tx, seen\.batch\.id\)/);
assert.match(store, /updatedAt: row\.updatedAt \}/);
assert.match(store, /invoiceBatch\.update\(\{ where: \{ id: row\.batch\.id \}, data: \{ updatedAt \} \}\)/);
assert.match(store, /action: "invoice\.edit"/);
assert.match(read("lib/billing/agent-draft-store.ts"), /source: "agent"/);
assert.match(read("lib/billing/draft-update.ts"), /source: "person", via: "row"/);
assert.match(read("components/billing/billing-issue-dialog.tsx"), /<BillingDraftEditor[\s\S]*<\/OpsFormDialogContent>/);
const hook = read("components/billing/hooks/use-draft-editor.ts");
assert.match(hook, /mutationKey: billingQueryKeys\.draftRowMutation/);
assert.match(hook, /updatedAt: patch\.updatedAt/);
