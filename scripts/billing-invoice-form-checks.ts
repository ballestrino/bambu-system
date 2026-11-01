import assert from "node:assert/strict";

import { AGENT_SKILLS, resolveSkillToolNames } from "../lib/agent/skills";
import { buildAgentInstructions } from "../lib/agent/system-prompt";
import { AGENT_TOOL_CATALOG } from "../lib/agent/tool-catalog";
import { emptyNewInvoiceItem, getNewInvoiceProblems, getNewInvoiceTotals, newInvoiceDefaults, parseDecimal } from "../lib/billing/new-invoice";
import {
  describeNewInvoiceForm,
  formatNewInvoiceContext,
  getNewInvoiceFormAmounts,
  sanitizeNewInvoiceForm,
} from "../lib/billing/new-invoice-agent-context";
import { planInvoiceFormFill, receiverToNewInvoiceForm, rutToNewInvoiceForm, toFormNumber } from "../lib/billing/new-invoice-agent-fill";
import { agentChatRequestSchema } from "../schemas/agent";
import { fillInvoiceFormInputSchema, type FillInvoiceFormInput } from "../schemas/agent-invoice-form-tools";

// Feature 46: el agente dentro de Nueva factura completa el formulario y
// nunca emite ni guarda.
const today = "2026-11-20";
const blank = newInvoiceDefaults(today, 3);
const none: FillInvoiceFormInput = {
  cfeType: null, issueDate: null, payment: null, creditDays: null, currency: null, purchaseOrder: null,
  clientDocument: null, consumer: null, client: null, items: null, adenda: null,
};

// --- El contexto: un campo inválido no rechaza el formulario; un ítem roto se descarta.
const sanitized = sanitizeNewInvoiceForm(
  { name: "Los Pinos", cfeType: 999, paymentForm: 2, dueDate: "2026-12-20", items: [{ ...emptyNewInvoiceItem(3), concepto: "Limpieza", precio: "10.000" }, { concepto: 5 }], extra: "x" },
  today,
  3
);
assert.equal(sanitized.name, "Los Pinos");
assert.equal(sanitized.cfeType, 111);
assert.equal(sanitized.paymentForm, 2);
assert.equal(sanitized.items.length, 1);
assert.ok(!("extra" in sanitized));
assert.equal(sanitizeNewInvoiceForm(null, today, 16).items[0].indicador, 16);
const described = describeNewInvoiceForm(sanitized, today);
assert.match(described, /crédito, vence 2026-12-20 \(30 días\)/);
assert.match(described, /"Limpieza" · 1 × \$ 10\.000 sin IVA/);
assert.match(described, /La e-Factura va solo con un RUT de 12 dígitos/);
assert.match(formatNewInvoiceContext(sanitized, today, "noviembre de 2026"), /Nueva factura .*noviembre de 2026.*fillInvoiceForm/);
assert.deepEqual(getNewInvoiceFormAmounts(sanitized).slice(0, 2), [10000, 10000]);

// --- Precios en el formato de la página: coma decimal, sin miles.
assert.deepEqual([1234.5, 10000, 2.345].map(toFormNumber), ["1234,5", "10000", "2,35"]);
assert.deepEqual(["1234,5", "10000", "2,35"].map(parseDecimal), [1234.5, 10000, 2.35]);

// --- Completar: cliente de su última factura, ítems sin IVA, crédito a 30 días y adenda.
const receiver = {
  tipo_documento: 2, documento: "211186720014", razon_social: "Colegio Los Pinos S.A.", nombre_fantasia: "Los Pinos",
  sucursal: { direccion: "Av. Italia 1234", ciudad: "Montevideo", departamento: "Montevideo", pais: "UY" },
};
const filled = planInvoiceFormFill(
  blank,
  {
    ...none, payment: "credito", creditDays: 30, adenda: "Servicio de noviembre",
    clientDocument: "211186720014",
    items: [{ concepto: "Limpieza noviembre 2026", cantidad: null, precio: 10000, unidad: null, indicador: null, descripcion: null },
      { concepto: "Vidrios", cantidad: 2, precio: 1500.5, unidad: "un", indicador: 2, descripcion: null }],
  },
  { fields: receiverToNewInvoiceForm(receiver), label: "de su última factura" }
);
assert.equal(filled.form.name, "Colegio Los Pinos S.A.");
assert.equal(filled.form.tradeName, "Los Pinos");
assert.equal(filled.form.dueDate, "2026-12-20");
assert.deepEqual(filled.form.items.map((item) => [item.concepto, item.cantidad, item.precio, item.indicador, item.unidad]), [
  ["Limpieza noviembre 2026", "1", "10000", 3, ""],
  ["Vidrios", "2", "1500,5", 2, "un"],
]);
assert.deepEqual(getNewInvoiceTotals(filled.form), { subtotal: 13001, taxes: [{ amount: 2200, rate: 0.22 }, { amount: 300.1, rate: 0.1 }], total: 15501.1 });
assert.deepEqual(getNewInvoiceProblems(filled.form, today), []);
// El patch trae solo lo que cambió (la moneda y el tipo no) y lo cuenta en palabras.
assert.ok(!("currency" in filled.patch) && !("cfeType" in filled.patch));
assert.deepEqual(Object.keys(filled.patch).sort(), ["address", "adenda", "city", "document", "dueDate", "items", "name", "tradeName"]);
assert.equal(filled.changes[0], "Cliente Colegio Los Pinos S.A. (de su última factura)");
assert.ok(filled.changes.includes("Crédito, vence 2026-12-20"));
assert.ok(filled.changes.includes("Adenda: Servicio de noviembre"));

// --- Una segunda llamada parte de la primera: cambiar solo el precio no toca el cliente.
const again = planInvoiceFormFill(filled.form, { ...none, items: [{ concepto: "Limpieza noviembre 2026", cantidad: 1, precio: 12000, unidad: null, indicador: null, descripcion: null }] }, null);
assert.deepEqual(Object.keys(again.patch), ["items"]);
assert.equal(again.form.name, "Colegio Los Pinos S.A.");
// Mandar lo mismo no cambia nada.
assert.deepEqual(planInvoiceFormFill(filled.form, { ...none, payment: "credito", adenda: "Servicio de noviembre" }, null).patch, {});

// --- e-Ticket a consumidor final; pasar a e-Factura vuelve a pedir el RUT.
const ticket = planInvoiceFormFill(blank, { ...none, cfeType: "e-Ticket", consumer: true, items: [{ concepto: "Limpieza", cantidad: null, precio: 2000, unidad: null, indicador: null, descripcion: null }] }, null);
assert.deepEqual([ticket.form.cfeType, ticket.form.consumer], [101, true]);
assert.deepEqual(getNewInvoiceProblems(ticket.form, today), []);
const backToInvoice = planInvoiceFormFill(ticket.form, { ...none, cfeType: "e-Factura" }, null);
assert.deepEqual([backToInvoice.form.consumer, backToInvoice.form.documentType], [false, 2]);
// Consumidor final solo en un e-Ticket.
assert.equal(planInvoiceFormFill(blank, { ...none, consumer: true }, null).form.consumer, false);
// Un RUT nuevo con los datos de DGI; lo escrito a mano pisa lo encontrado.
const dgi = planInvoiceFormFill(
  blank,
  { ...none, clientDocument: "219999990019", client: { documentType: null, document: null, name: null, tradeName: "Nueva", address: null, city: null, department: null, emails: ["pagos@nueva.uy"] } },
  { fields: rutToNewInvoiceForm("219999990019", { address: "Rambla 1", city: "Montevideo", department: "Montevideo", name: "Nueva SA" }), label: "datos de DGI" }
);
assert.deepEqual([dgi.form.name, dgi.form.tradeName, dgi.form.emails], ["Nueva SA", "Nueva", ["pagos@nueva.uy"]]);
assert.ok(dgi.changes.includes("Cliente: nombre de fantasía, emails"));
// El formulario arranca a crédito (50). Crédito sin días: el 10 del mes de
// emisión, o a 5 días si se emite después del 10, como la página.
assert.deepEqual([blank.paymentForm, blank.dueDate], [2, "2026-11-25"]);
const cash = { ...blank, dueDate: "", paymentForm: 1 };
assert.equal(planInvoiceFormFill(cash, { ...none, payment: "credito" }, null).form.dueDate, "2026-11-25");
assert.equal(planInvoiceFormFill(cash, { ...none, payment: "credito", issueDate: "2026-12-01" }, null).form.dueDate, "2026-12-10");
// Mover la emisión mueve un vencimiento de la regla; uno elegido se respeta.
assert.equal(planInvoiceFormFill(blank, { ...none, issueDate: "2026-12-01" }, null).form.dueDate, "2026-12-10");
assert.equal(planInvoiceFormFill({ ...blank, dueDate: "2026-12-31" }, { ...none, issueDate: "2026-12-01" }, null).form.dueDate, "2026-12-31");

// --- La entrada: todo obligatorio y nullable; precio sin IVA no negativo.
assert.ok(fillInvoiceFormInputSchema.safeParse(none).success);
assert.ok(!fillInvoiceFormInputSchema.safeParse({ ...none, items: [{ concepto: "X", cantidad: null, precio: -1, unidad: null, indicador: null, descripcion: null }] }).success);
assert.ok(!fillInvoiceFormInputSchema.safeParse({ ...none, issueDate: "20/11/2026" }).success);

// --- La habilidad: completa, no emite; el contexto viaja con el formulario.
const factura = resolveSkillToolNames(AGENT_SKILLS.factura);
assert.ok(factura.includes("fillInvoiceForm") && factura.includes("findBillingClient"));
assert.ok(!factura.includes("draftInvoices"));
assert.equal(AGENT_TOOL_CATALOG.fillInvoiceForm.kind, "draft");
const prompt = buildAgentInstructions({ today: "viernes", actorName: null, skill: AGENT_SKILLS.factura, memoryBlock: null, billingContextText: "Nueva factura" });
assert.match(prompt, /No emitís ni guardás/);
const turn = { id: "conv_12345678", mode: "alto", skill: "factura", message: { id: "user_1_abcdef", role: "user", parts: [{ type: "text", text: "Hola" }] } };
assert.ok(agentChatRequestSchema.safeParse({ ...turn, context: { kind: "new-invoice", month: "2026-11", form: blank } }).success);
assert.ok(!agentChatRequestSchema.safeParse({ ...turn, context: { kind: "new-invoice", month: "2026-13", form: blank } }).success);
