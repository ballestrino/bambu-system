import assert from "node:assert/strict";

import { BILLING_RULE } from "../lib/agent/billing-rule";
import { BILLING_AGENT_CONVERSATIONS, conversationListInput, pageContextLabel } from "../lib/agent/conversation-scope";
import { AGENT_SKILLS, resolveSkillToolNames } from "../lib/agent/skills";
import { buildAgentInstructions } from "../lib/agent/system-prompt";
import { AGENT_TOOL_CATALOG } from "../lib/agent/tool-catalog";
import { planDraftAddition, planDraftChanges, type AgentDraftInvoice } from "../lib/billing/agent-draft-plan";
import { agentChatRequestSchema, agentConversationListSchema } from "../schemas/agent";
import { draftInvoicesInputSchema } from "../schemas/agent-billing-tools";

// El agente de Facturación (docs/billing.md, "Agente"): arma borradores y
// nunca emite.
const item = (concepto: string, precio: number) => ({
  codigo: null, cantidad: 1, concepto, descripcion: null, precio, indicador_facturacion: 3, unidad_medida: null,
});
const receiver = (name: string, rut: string) => ({
  tipo_documento: 2, documento: rut, razon_social: name, nombre_fantasia: null,
  sucursal: { direccion: null, ciudad: null, departamento: null, pais: "UY" },
});
const invoices: AgentDraftInvoice[] = [
  { id: "a", items: [item("Limpieza noviembre 2026", 10000)], receiver: receiver("Pepito SA", "211111110011"), receiverDocument: "211111110011", selected: true, status: "DRAFT" },
  { id: "b", items: [item("Oficina", 5000), item("Vidrios", 800)], receiver: receiver("Norte SRL", "212222220012"), receiverDocument: "212222220012", selected: true, status: "DRAFT" },
  { id: "c", items: [item("Limpieza", 3000)], receiver: receiver("Emitida SA", "213333330013"), receiverDocument: "213333330013", selected: true, status: "ISSUED" },
];

// --- Cambiar: precio, detalle y casilla, con lo que cambió en palabras.
const plan = planDraftChanges(invoices, [
  { invoiceId: "a", selected: null, lines: [{ index: 0, concepto: null, precio: 12000 }] },
  { invoiceId: "b", selected: false, lines: [{ index: 1, concepto: "Vidrios y cortinas", precio: null }] },
]);
assert.ok(plan.ok);
assert.deepEqual(plan.edits.map((edit) => [edit.invoiceId, edit.selected, edit.items?.map((line) => line.precio)]), [
  ["a", null, [12000]],
  ["b", false, [5000, 800]],
]);
assert.deepEqual(plan.edits[1].items?.[1].concepto, "Vidrios y cortinas");
assert.deepEqual(plan.edits.flatMap((edit) => edit.notes.map((note) => note.text)), [
  "Precio $ 10.000 → $ 12.000 sin IVA",
  "Desmarcada",
  'Detalle "Vidrios" → "Vidrios y cortinas"',
]);
// Mandar lo mismo no es un cambio; una emitida, otra factura o una línea que no existe frenan todo.
assert.deepEqual(planDraftChanges(invoices, [{ invoiceId: "a", selected: true, lines: [{ index: 0, concepto: "Limpieza noviembre 2026", precio: 10000 }] }]), { edits: [], ok: true });
assert.equal(planDraftChanges(invoices, [{ invoiceId: "c", selected: false, lines: null }]).ok, false);
assert.equal(planDraftChanges(invoices, [{ invoiceId: "zzz", selected: false, lines: null }]).ok, false);
assert.equal(planDraftChanges(invoices, [{ invoiceId: "a", selected: null, lines: [{ index: 3, concepto: null, precio: 1 }] }]).ok, false);

// --- Sumar un cliente nuevo por RUT: e-Factura al contado con la razón social de DGI.
const rutData = { address: "Av. Siempre Viva 123", city: "Montevideo", department: "Montevideo", name: "Nueva SA", rut: "219999990019" };
const added = planDraftAddition({ rut: "21.999.999.0019", concepto: "Limpieza noviembre", precio: 7000, cantidad: null }, rutData, invoices, 16);
assert.ok(!("error" in added));
assert.equal(added.receiver.documento, "219999990019");
assert.equal(added.receiver.razon_social, "Nueva SA");
assert.equal(added.items[0].indicador_facturacion, 16);
assert.equal(added.total, 7000);
// Sin una emitida de la que tomar el indicador, tasa básica (22 %).
const basic = planDraftAddition({ rut: "21.999.999.0019", concepto: "X", precio: 1000, cantidad: 1 }, rutData, invoices, null);
assert.equal("error" in basic ? null : basic.total, 1220);
assert.ok("error" in planDraftAddition({ rut: "211111110011", concepto: "X", precio: 1, cantidad: 1 }, rutData, invoices, 3));
assert.ok("error" in planDraftAddition({ rut: "1234", concepto: "X", precio: 1, cantidad: 1 }, rutData, invoices, 3));
assert.ok("error" in planDraftAddition({ rut: "219999990019", concepto: "X", precio: 1, cantidad: 1 }, { ...rutData, name: null }, invoices, 3));

// --- Ninguna tool emite: el catálogo de Facturación no tiene emitir, la
// escritura es un borrador y la regla va en el prompt de las habilidades que la tienen.
assert.ok(!Object.keys(AGENT_TOOL_CATALOG).some((name) => /issue|emit|anular|void/i.test(name)));
assert.equal(AGENT_TOOL_CATALOG.draftInvoices.kind, "draft");
const facturacion = resolveSkillToolNames(AGENT_SKILLS.facturacion);
for (const name of ["getBillingSummary", "listInvoices", "getInvoice", "lookupRut", "draftInvoices"] as const) {
  assert.ok(facturacion.includes(name), name);
}
const prompt = (skill: keyof typeof AGENT_SKILLS) =>
  buildAgentInstructions({ today: "jueves", actorName: null, skill: AGENT_SKILLS[skill], memoryBlock: null });
assert.ok(prompt("facturacion").includes(BILLING_RULE));
assert.ok(prompt("general").includes(BILLING_RULE));
assert.ok(!prompt("presupuestos").includes(BILLING_RULE));
assert.match(BILLING_RULE, /No emitís ni anulás/);
const billingPrompt = buildAgentInstructions({
  today: "jueves", actorName: null, skill: AGENT_SKILLS.facturacion, memoryBlock: null,
  billingContextText: "El usuario está en Facturación, mirando noviembre de 2026 (2026-11).",
});
assert.match(billingPrompt, /mirando noviembre de 2026/);
assert.doesNotMatch(billingPrompt, /No hay un presupuesto en contexto/);

// --- La entrada de draftInvoices: todo obligatorio y nullable.
assert.ok(draftInvoicesInputSchema.safeParse({ month: null, repeatPreviousMonth: true, changes: null, newInvoices: null }).success);
assert.ok(!draftInvoicesInputSchema.safeParse({ month: "2026-13", repeatPreviousMonth: null, changes: null, newInvoices: null }).success);

// --- Historial propio y contexto del mes.
assert.deepEqual(conversationListInput(BILLING_AGENT_CONVERSATIONS), { contextKind: "billing" });
assert.ok(agentConversationListSchema.safeParse(conversationListInput(BILLING_AGENT_CONVERSATIONS)).success);
assert.equal(pageContextLabel(null, "billing"), "Facturación");
const turn = { id: "conv_12345678", mode: "alto", skill: "facturacion", message: { id: "user_1_abcdef", role: "user", parts: [{ type: "text", text: "Hola" }] } };
assert.ok(agentChatRequestSchema.safeParse({ ...turn, context: { kind: "billing", month: "2026-11" } }).success);
assert.ok(!agentChatRequestSchema.safeParse({ ...turn, context: { kind: "billing", month: "noviembre" } }).success);
