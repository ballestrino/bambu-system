import assert from "node:assert/strict";

import { buildReviewInstructions, buildReviewPrompt, validateReviewSuggestions, type ReviewRow } from "../lib/billing/draft-review";
import { draftInvoiceEditSchema } from "../schemas/billing";

// Feature 52: la revisión del borrador con IA sugiere; lo que vuelve del
// modelo se valida contra el borrador antes de mostrarlo.
const rows: ReviewRow[] = [
  {
    adenda: "Servicio mensual correspondiente al mes de septiembre\n\nGodoy 4548", cfeLabel: "e-Ticket", id: "a",
    lines: [{ concepto: "Limpieza mantenimiento", subtotal: 8500 }], monthsBilled: 5, name: "Daniela hogar",
    sourceAdenda: "Servicio mensual correspondiente al mes de septiembre\n\nGodoy 4548", sourceConcepts: ["Limpieza mantenimiento"],
  },
  {
    adenda: "Final de obra realizado en Luis de la torre 892", cfeLabel: "e-Ticket", id: "b",
    lines: [{ concepto: "Final de obra", subtotal: 9700 }], monthsBilled: 1, name: "Consumidor final", sourceAdenda: null, sourceConcepts: [],
  },
];

const out = validateReviewSuggestions(rows, {
  suggestions: [
    { invoiceId: "a", kind: "adenda", lineIndex: null, proposed: "Servicio mensual correspondiente al mes de octubre\n\nGodoy 4548", reason: "Es el servicio de octubre." },
    // Repetida: se descarta.
    { invoiceId: "a", kind: "adenda", lineIndex: null, proposed: "Otra", reason: "x" },
    // Cambia un número (la dirección): se descarta.
    { invoiceId: "a", kind: "concepto", lineIndex: 0, proposed: "Limpieza mantenimiento 4549", reason: "x" },
    // Igual al actual: se descarta.
    { invoiceId: "b", kind: "concepto", lineIndex: 0, proposed: "Final de obra", reason: "x" },
    // Línea que no existe y factura que no está: se descartan.
    { invoiceId: "b", kind: "concepto", lineIndex: 3, proposed: "Algo", reason: "x" },
    { invoiceId: "zzz", kind: "remove", lineIndex: null, proposed: null, reason: "x" },
    { invoiceId: "b", kind: "remove", lineIndex: null, proposed: null, reason: "Final de obra: es puntual." },
    { invoiceId: "b", kind: "note", lineIndex: null, proposed: null, reason: "  " },
  ],
});
assert.deepEqual(out.map((item) => [item.invoiceId, item.kind]), [["a", "adenda"], ["b", "remove"]]);
assert.equal(out[0].current, rows[0].adenda);
assert.equal(out[0].name, "Daniela hogar");
assert.equal(out[1].proposed, null);

// Un año nuevo en el texto sí se acepta (diciembre → enero).
const yearRow: ReviewRow = { ...rows[0], adenda: "Servicio de diciembre 2026", id: "y" };
assert.equal(validateReviewSuggestions([yearRow], {
  suggestions: [{ invoiceId: "y", kind: "adenda", lineIndex: null, proposed: "Servicio de enero 2027", reason: "Mes" }],
}).length, 1);

// El prompt lleva el mes del servicio y los datos de cada factura.
assert.match(buildReviewInstructions("noviembre 2026", "octubre 2026"), /cobra el servicio de octubre 2026/);
assert.match(buildReviewPrompt(rows), /"monthsBilled": 1/);

// La adenda se puede cambiar desde el borrador (o quitar con null).
assert.equal(draftInvoiceEditSchema.safeParse({ invoiceId: "a", updatedAt: "2026-11-02T10:00:00.000Z", adenda: "Nueva" }).success, true);
assert.equal(draftInvoiceEditSchema.safeParse({ invoiceId: "a", updatedAt: "2026-11-02T10:00:00.000Z", adenda: null }).success, true);
assert.equal(draftInvoiceEditSchema.safeParse({ invoiceId: "a", updatedAt: "2026-11-02T10:00:00.000Z" }).success, false);

// Cada sugerencia trae con qué reconocer la factura.
assert.equal(out[1].detail, "Final de obra");
assert.equal(out[1].subtotal, 9700);
