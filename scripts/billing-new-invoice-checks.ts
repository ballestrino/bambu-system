import assert from "node:assert/strict";

import { BillerError } from "../lib/billing/biller-errors";
import type { BillerInvoice } from "../lib/billing/biller-schemas";
import { groupBillingClients, toClientSearch } from "../lib/billing/billing-clients";
import { readStoredReceiver } from "../lib/billing/invoice-json";
import { buildIssuePlan, toCliente } from "../lib/billing/issue-payload";
import type { IssueOutcome } from "../lib/billing/issue-run";
import {
  emptyNewInvoiceItem,
  getNewInvoiceDueDays,
  getNewInvoiceItems,
  getNewInvoiceProblems,
  getNewInvoiceReceiver,
  getNewInvoiceTotals,
  newInvoiceDefaults,
  parseDecimal,
  type NewInvoiceForm,
} from "../lib/billing/new-invoice";
import { runNewInvoiceIssue } from "../lib/billing/new-invoice-run";
import { newInvoiceRequestSchema } from "../schemas/billing-new-invoice";
import { eFacturaRow } from "./billing-fixtures";

// Feature 45: Nueva factura. Lo que falta para emitir, los totales por tasa,
// el receptor y los ítems que se mandan, y la emisión de una sola con un
// Biller falso (emitida, encontrada tras un timeout, sin confirmar, rechazo).
const today = "2026-11-20";
const form = (patch: Partial<NewInvoiceForm> = {}): NewInvoiceForm => ({
  ...newInvoiceDefaults(today, 3),
  document: "21 118672 0014", name: "Colegio Los Pinos S.A.", address: "Av. Italia 1234", city: "Montevideo",
  items: [{ ...emptyNewInvoiceItem(3), concepto: "Limpieza noviembre", precio: "10.000" }, { ...emptyNewInvoiceItem(2), concepto: "Insumos", precio: "1000,50", cantidad: "2" }],
  ...patch,
});

// --- Números como los escribe la gente.
assert.deepEqual(["1.234,50", "1234.5", "$ 2.400", "10.000", "2.5", "", "abc", "1,2,3"].map(parseDecimal), [1234.5, 1234.5, 2400, 10000, 2.5, null, null, null]);

// --- Totales: neto, IVA por tasa y total; el 16 (IVA mínimo) no suma IVA.
assert.deepEqual(getNewInvoiceTotals(form()), {
  subtotal: 12001,
  taxes: [{ amount: 2200, rate: 0.22 }, { amount: 200.1, rate: 0.1 }],
  total: 14401.1,
});
const minimum = form({ items: [{ ...emptyNewInvoiceItem(16), concepto: "Limpieza", precio: "8000" }] });
assert.deepEqual(getNewInvoiceTotals(minimum), { subtotal: 8000, taxes: [], total: 8000 });

// --- Lo que falta, en el orden del formulario.
assert.deepEqual(getNewInvoiceProblems(form(), today), []);
assert.deepEqual(getNewInvoiceProblems(form({ document: "1234567" }), today), ["La e-Factura va solo con un RUT de 12 dígitos."]);
assert.deepEqual(getNewInvoiceProblems(form({ cfeType: 101, consumer: true, document: "", name: "" }), today), []);
assert.deepEqual(getNewInvoiceProblems(form({ cfeType: 101, name: " " }), today), ["Falta el nombre del cliente."]);
assert.deepEqual(getNewInvoiceProblems(form(), today), [], "arranca a crédito con el vencimiento de la regla (50)");
assert.deepEqual(getNewInvoiceProblems(form({ paymentForm: 2, dueDate: "" }), today), ["A crédito necesita vencimiento."]);
assert.deepEqual(getNewInvoiceProblems(form({ paymentForm: 2, dueDate: "2026-11-01" }), today), ["El vencimiento no puede ser antes de la emisión."]);
assert.deepEqual(getNewInvoiceProblems(form({ issueDate: "2027-02-01", paymentForm: 1 }), today), ["La fecha de emisión va hasta dos meses a futuro."]);
assert.deepEqual(getNewInvoiceProblems(form({ emails: ["contador@"] }), today), ["Hay un email que no es válido."]);
assert.deepEqual(getNewInvoiceProblems(form({ items: [emptyNewInvoiceItem(3)] }), today), ["Falta al menos un ítem con concepto y precio."]);
assert.ok(getNewInvoiceProblems(form({ items: [{ ...emptyNewInvoiceItem(3), precio: "100" }] }), today).includes("Hay un ítem con precio y sin concepto."));
assert.ok(getNewInvoiceProblems(form({ items: [{ ...emptyNewInvoiceItem(3), concepto: "X", precio: "10", cantidad: "0" }] }), today)
  .includes("Hay un ítem sin cantidad o con un precio que no se entiende."));

// --- Ítems y receptor como los pide emitir; las filas vacías no van.
const withBlank = form({ items: [...form().items, emptyNewInvoiceItem(3)] });
assert.equal(getNewInvoiceItems(withBlank).length, 2);
assert.deepEqual(getNewInvoiceItems(form({ items: [{ ...emptyNewInvoiceItem(3), concepto: " Vidrios ", precio: "500", descuento: "10", unidad: "hs" }] })), [{
  cantidad: 1, codigo: null, concepto: "Vidrios", descripcion: null, indicador_facturacion: 3, precio: 500, unidad_medida: "hs",
  descuento_cantidad: 10, descuento_tipo: "%",
}]);
const receiver = getNewInvoiceReceiver(form({ emails: ["admin@lospinos.edu.uy"] }))!;
assert.deepEqual(toCliente(receiver), {
  tipo_documento: 2, documento: "211186720014", razon_social: "Colegio Los Pinos S.A.",
  sucursal: { direccion: "Av. Italia 1234", ciudad: "Montevideo", departamento: "Montevideo", pais: "UY", emails: ["admin@lospinos.edu.uy"] },
});
assert.deepEqual(readStoredReceiver(JSON.parse(JSON.stringify(receiver)))?.sucursal.emails, ["admin@lospinos.edu.uy"], "los emails se guardan");
assert.equal(getNewInvoiceReceiver(form({ cfeType: 101, consumer: true })), null, "consumidor final");
const ci = getNewInvoiceReceiver(form({ cfeType: 101, documentType: 3, document: "1.234.567-8", name: "Ana Pérez" }))!;
assert.deepEqual([ci.razon_social, ci.nombre_fantasia, ci.documento], ["Ana Pérez", "Ana Pérez", "12345678"]);
assert.equal(getNewInvoiceDueDays(form({ paymentForm: 2, dueDate: "2026-12-20" })), 30);
assert.equal(getNewInvoiceDueDays(form({ dueDate: "2026-12-20", paymentForm: 1 })), null, "contado no tiene vencimiento");

// --- El pedido: un id que arma el número interno, y los largos de Biller.
const request = { form: form(), month: "2026-11", requestId: "k3j4h5g6f7d8s9a0q1w2e3r4" };
assert.ok(newInvoiceRequestSchema.safeParse(request).success);
assert.ok(!newInvoiceRequestSchema.safeParse({ ...request, requestId: "../x" }).success);
assert.ok(!newInvoiceRequestSchema.safeParse({ ...request, form: form({ name: "x".repeat(71) }) }).success);

// --- La orden de compra va como numero_compra.
const plan = buildIssuePlan({
  adenda: null, cfeType: 111, currency: "UYU", dueDays: 30, internalNumber: "BAMBU-x", items: getNewInvoiceItems(form()),
  paymentForm: 2, purchaseOrder: "OC-77", receiver,
}, new Date("2026-11-20T00:00:00Z"));
assert.ok(plan.ok && plan.payload.numero_compra === "OC-77" && plan.payload.fecha_vencimiento === "20/12/2026");

// --- Las facturas anteriores agrupadas por cliente, la más nueva primero.
const row = (documento: string | null, razon: string, issued: string) => ({
  cfeType: 111, issueDate: new Date(`${issued}T00:00:00Z`), total: 100,
  receiver: { ...receiver, documento, razon_social: razon },
});
const clients = groupBillingClients([row("211186720014", "Los Pinos", "2026-10-03"), row("211186720014", "Los Pinos viejo", "2026-09-03"), row(null, "Ana", "2026-10-01")], 8);
assert.deepEqual(clients.map((client) => [client.key, client.receiver.razon_social]), [["211186720014", "Los Pinos"], ["nombre:ana", "Ana"]]);
assert.deepEqual(toClientSearch(" 50%_pinos "), { digits: null, text: "50pinos" });
assert.deepEqual(toClientSearch("2111"), { digits: "2111", text: "2111" });

// --- Emitir una con un Biller falso.
const runOne = async (replies: (() => unknown)[], found: BillerInvoice | null = null) => {
  const saved: IssueOutcome[] = [];
  let sends = 0;
  const result = await runNewInvoiceIssue("inv1", {
    findByInternalNumber: async () => found,
    issuer: { issue: async () => { sends += 1; const reply = replies.shift()!(); if (reply instanceof Error) throw reply; return reply as never; } },
    now: () => new Date("2026-11-20T15:00:00Z"),
    sleep: async () => undefined,
    store: {
      load: async () => ({ adenda: null, cfeType: 111, currency: "UYU", dueDays: null, internalNumber: "BAMBU-inv1",
        issueDate: new Date("2026-11-18T00:00:00Z"), items: getNewInvoiceItems(form()), paymentForm: 1, receiver }),
      save: async (_id, outcome) => { saved.push(outcome); },
    },
  });
  return { result, saved, sends };
};
export const billingNewInvoiceChecks = (async () => {
  const issued = await runOne([() => ({ billerId: 9001, number: 18, series: "A" })]);
  assert.deepEqual(issued.result, { kind: "issued", number: 18, series: "A" });
  assert.equal(issued.saved[0]?.kind === "issued" && issued.saved[0].issueDate.toISOString().slice(0, 10), "2026-11-18", "con la fecha elegida");
  const existing = { ...eFacturaRow, numero_interno: "BAMBU-inv1" } as unknown as BillerInvoice;
  const found = await runOne([() => new BillerError("network", "timeout")], existing);
  assert.deepEqual([found.result.kind, found.sends], ["found", 1]);
  const lost = await runOne([() => new BillerError("network", "t"), () => new BillerError("network", "t")]);
  assert.deepEqual([lost.result.kind, lost.sends], ["unknown", 2]);
  const rejected = await runOne([() => new BillerError("validation", "Documento inválido")]);
  assert.deepEqual([rejected.result.kind, rejected.saved[0]?.kind], ["failed", "failed"]);
})();
