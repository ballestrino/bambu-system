import assert from "node:assert/strict";

import { parseMoneyInput } from "../components/billing/billing-format";
import { parseBillingPeriod } from "../lib/billing/billing-month";
import { moveMonthInText } from "../lib/billing/billing-month-text";
import { getPaymentLabel } from "../lib/billing/billing-month-view";
import { applyDraftLineEdits } from "../lib/billing/draft-edit";
import { buildRepeatDraft, getDueDays, getRepeatSkip, type RepeatContext, type RepeatSource } from "../lib/billing/draft-repeat";
import { readStoredItems, readStoredReceiver } from "../lib/billing/invoice-json";
import { getItemsSubtotal, getItemsTotal } from "../lib/billing/invoice-totals";
import { draftInvoiceEditSchema } from "../schemas/billing";

// Feature 40: el borrador que repite el mes anterior (docs/billing.md).
const october = parseBillingPeriod("2026-10")!;
const november = parseBillingPeriod("2026-11")!;
const december = parseBillingPeriod("2026-12")!;
const january = parseBillingPeriod("2027-01")!;
const september = parseBillingPeriod("2026-09")!;

// --- El mes del detalle pasa al nuevo, con sus mayúsculas.
assert.equal(moveMonthInText("Limpieza de oficina - octubre 2026", october, november), "Limpieza de oficina - noviembre 2026");
assert.equal(moveMonthInText("Servicio de Octubre de 2026", october, november), "Servicio de Noviembre de 2026");
assert.equal(moveMonthInText("LIMPIEZA OCTUBRE", october, november), "LIMPIEZA NOVIEMBRE");
assert.equal(moveMonthInText("Período 10/2026", october, november), "Período 11/2026");
assert.equal(moveMonthInText("Diciembre 2026", december, january), "Enero 2027");
assert.equal(moveMonthInText("Mantenimiento setiembre 2026", september, october), "Mantenimiento octubre 2026");
assert.equal(moveMonthInText("Mantenimiento agosto 2026", september, october), "Mantenimiento agosto 2026");
assert.equal(moveMonthInText("Octubrefest", october, november), "Octubrefest");

// --- Totales por indicador de IVA: 3 básica, 16 IVA mínimo (no suma).
const line = (concepto: string, precio: number, indicador = 3, cantidad = 1) => ({
  codigo: null, cantidad, concepto, descripcion: null, precio, indicador_facturacion: indicador, unidad_medida: null,
});
assert.equal(getItemsTotal([line("a", 12000)]), 14640);
assert.equal(getItemsTotal([line("a", 24400, 16)]), 24400);
assert.equal(getItemsSubtotal([line("a", 1500, 16, 4), line("b", 100, 16)]), 6100);
assert.equal(getItemsTotal([{ ...line("a", 1000, 16), descuento_tipo: "%", descuento_cantidad: 10 }]), 900);

// --- Qué va y qué arranca desmarcado.
const source = (id: string, patch: Partial<RepeatSource> = {}): RepeatSource => ({
  adenda: "Servicio de octubre 2026", billerId: Number(id.replace(/\D/g, "")), cfeType: 111, currency: "UYU",
  dueDate: new Date("2026-11-15T00:00:00Z"), id, issueDate: new Date("2026-10-15T00:00:00Z"),
  items: [line("Limpieza de oficina - octubre 2026", 12000)], paymentForm: null,
  receiver: {
    tipo_documento: 2, documento: `RUT${id}`, razon_social: `Cliente ${id}`, nombre_fantasia: null,
    sucursal: { direccion: null, ciudad: null, departamento: null, pais: "UY" },
  },
  receiverDocument: `RUT${id}`, status: "ACCEPTED", ...patch,
});
const context: RepeatContext = {
  annulledBy: new Map([[2, new Date("2026-10-30T00:00:00Z")]]),
  billedInTarget: new Map([["RUTs3", new Date("2026-11-03T00:00:00Z")]]),
  from: october,
  to: november,
};
const sources = [
  source("s1"),
  source("s2", { cfeType: 101, dueDate: null }),
  source("s3"),
  source("s4", { cfeType: 102 }),
  source("s5", { status: "REJECTED" }),
  source("s6", { items: null }),
];
assert.equal(getRepeatSkip(sources[1], context)?.label, "Anulada en octubre");
assert.equal(getRepeatSkip(sources[2], context)?.label, "Ya facturada el 3/11");
assert.equal(getRepeatSkip(sources[3], context)?.kind, "note");
assert.equal(getRepeatSkip(sources[5], context)?.kind, "no_items");
assert.equal(getRepeatSkip(sources[0], context), null);

const draft = buildRepeatDraft(sources, context);
assert.deepEqual(draft.map((row) => [row.sourceInvoiceId, row.selected]), [
  ["s1", true], ["s2", false], ["s3", false], ["s4", false], ["s6", false],
]);
assert.equal(draft[0].items[0].concepto, "Limpieza de oficina - noviembre 2026");
assert.equal(draft[0].items[0].indicador_facturacion, 3);
assert.equal(draft[0].adenda, "Servicio de noviembre 2026");
assert.equal(draft[0].total, 14640);
assert.equal(draft[0].paymentForm, 2);
assert.equal(draft[1].paymentForm, 1);
assert.equal(getDueDays(sources[0]), 31);
assert.equal(getPaymentLabel(2, 31), "Crédito 31 días");
assert.equal(getPaymentLabel(1, null), "Contado");
assert.equal(sources[0].items?.[0].concepto, "Limpieza de oficina - octubre 2026", "the source is not mutated");

// --- Lo guardado como Json vuelve con la forma de emitir.
assert.deepEqual(readStoredItems(draft[0].items), draft[0].items);
assert.equal(readStoredItems({ not: "items" }), null);
assert.equal(readStoredReceiver(sources[0].receiver)?.razon_social, "Cliente s1");

// --- Editar líneas: concepto y precio; una línea que no existe es un error.
const edited = applyDraftLineEdits([line("a", 100), line("b", 200)], [{ index: 1, precio: 250.555, concepto: "B" }]);
assert.deepEqual(edited?.map((item) => [item.concepto, item.precio]), [["a", 100], ["B", 250.56]]);
assert.equal(applyDraftLineEdits([line("a", 100)], [{ index: 3, precio: 1 }]), null);
const updatedAt = new Date().toISOString();
assert.ok(draftInvoiceEditSchema.safeParse({ invoiceId: "x", updatedAt, selected: false }).success);
assert.ok(!draftInvoiceEditSchema.safeParse({ invoiceId: "x", updatedAt }).success, "an empty edit is rejected");
assert.ok(!draftInvoiceEditSchema.safeParse({ invoiceId: "x", updatedAt, lines: [{ index: 0, precio: -1 }] }).success);
assert.ok(!draftInvoiceEditSchema.safeParse({ invoiceId: "x", updatedAt, lines: [{ index: 0, concepto: "x".repeat(81) }] }).success);

// --- Montos escritos en es-UY.
assert.equal(parseMoneyInput("$ 24.400"), 24400);
assert.equal(parseMoneyInput("24400,5"), 24400.5);
assert.equal(parseMoneyInput("24400.50"), 24400.5);
assert.equal(parseMoneyInput("1.234.567"), 1234567);
assert.equal(parseMoneyInput("abc"), null);
assert.equal(parseMoneyInput(""), null);
