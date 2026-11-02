import assert from "node:assert/strict";

import { buildRepeatDraft, type RepeatSource } from "../lib/billing/draft-repeat";
import { getReceiverName, isConsumerReceiver } from "../lib/billing/invoice-json";
import { cleanInvoiceLabel, getLabelHint, getReceiverDisplay } from "../lib/billing/invoice-label";
import { getReceiverKey, suggestJobs } from "../lib/billing/receiver-job";

// Feature 51: el título interno de un consumidor final.
const company = { tipo_documento: 2, documento: "219667740019", razon_social: "Edificio Fatima", nombre_fantasia: null,
  sucursal: { direccion: null, ciudad: null, departamento: null, pais: "UY" } };

// --- Nombre: el título solo cuenta sin razón social ni fantasía.
assert.equal(isConsumerReceiver(null), true);
assert.equal(isConsumerReceiver(company), false);
assert.equal(getReceiverName(null), "Consumidor final");
assert.equal(getReceiverName(null, "Daniela hogar"), "Daniela hogar");
assert.equal(getReceiverName(null, "  "), "Consumidor final");
assert.equal(getReceiverName(company, "Otro"), "Edificio Fatima");
assert.deepEqual(getReceiverDisplay(null, "Daniela hogar", "Servicio mensual\r\n\r\nGodoy 4548"), {
  consumer: true, label: "Daniela hogar", labelHint: "Godoy 4548", name: "Daniela hogar",
});

// --- Limpieza y pista: espacios de más, 60 caracteres, la dirección de la adenda.
assert.equal(cleanInvoiceLabel("  Daniela   hogar "), "Daniela hogar");
assert.equal(cleanInvoiceLabel(" "), null);
assert.equal(cleanInvoiceLabel("x".repeat(80))?.length, 60);
assert.equal(getLabelHint("Limpieza hogar 2 vez a la semana \r\n\r\nConstitución 2468"), "Constitución 2468");
assert.equal(getLabelHint("Servicio mensual - Godoy 4548"), "Godoy 4548");
assert.equal(getLabelHint("Servicio mensual correspondiente al mes de octubre"), null);
assert.equal(getLabelHint(null), null);

// --- Clave del vínculo: documento, nombre o título; sin nada, no se vincula.
assert.equal(getReceiverKey(null), null);
assert.equal(getReceiverKey(null, "Daniela  Hogar"), "titulo:daniela hogar");
assert.equal(getReceiverKey(null, "Dániela hogar!"), "titulo:daniela hogar");
assert.equal(getReceiverKey(company, "Daniela hogar"), "219667740019");
const jobs = [{ id: "j1", name: "Daniela", scheduleName: "Daniela hogar" }, { id: "j2", name: "Torre Norte", scheduleName: null }];
assert.equal(suggestJobs(null, jobs, 3, "Daniela hogar")[0]?.job.id, "j1");
assert.equal(suggestJobs(null, jobs, 3).length, 0);

// --- Repetir el mes copia el título.
const source: RepeatSource = {
  adenda: null, billerId: 1, cfeType: 101, currency: "UYU", dueDate: null, id: "src", issueDate: new Date(Date.UTC(2026, 10, 3)),
  items: [{ cantidad: 1, codigo: null, concepto: "Servicio de hogar", descripcion: null, indicador_facturacion: 16, precio: 6000, unidad_medida: null }],
  label: "Daniela hogar", paymentForm: 2, receiver: null, receiverDocument: null, status: "ACCEPTED",
};
const context = { annulledBy: new Map(), billedInTarget: new Map(), from: new Date(Date.UTC(2026, 10, 1)), to: new Date(Date.UTC(2026, 11, 1)) };
assert.equal(buildRepeatDraft([source], context)[0]?.label, "Daniela hogar");
assert.equal(buildRepeatDraft([{ ...source, label: undefined }], context)[0]?.label, null);
