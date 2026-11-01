import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { InvoiceStatus } from "@prisma/client";

import { getDraftTotals } from "../components/billing/billing-draft-model";
import {
  countActiveFilters,
  EMPTY_BILLING_FILTERS,
  filterDraftRows,
  filterIssuedRows,
  getFilterGroups,
  matchesQuery,
  matchesType,
  setBillingFilter,
  type BillingFilters,
} from "../lib/billing/billing-list-filters";
import type { DraftRow } from "../lib/billing/billing-month-view";

// Feature 48: vistas y filtros de Facturación (docs/billing.md).
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");
const f = (change: Partial<BillingFilters>): BillingFilters => ({ ...EMPTY_BILLING_FILTERS, ...change });

// --- Tipo: e-Factura (11x, también exportación), e-Ticket (10x) y notas.
assert.ok(matchesType(111, "efactura") && matchesType(121, "efactura") && !matchesType(101, "efactura"));
assert.ok(matchesType(101, "eticket") && !matchesType(111, "eticket") && !matchesType(102, "eticket"));
assert.ok(matchesType(102, "note") && matchesType(112, "note") && matchesType(113, "note") && !matchesType(111, "note"));

// --- Búsqueda: nombre sin tildes ni mayúsculas, o los dígitos del RUT.
const rio = { document: "219667740019", name: "Estudio Contable Ríos" };
assert.ok(matchesQuery(rio, "rios") && matchesQuery(rio, "  CONTABLE ") && matchesQuery(rio, ""));
assert.ok(matchesQuery(rio, "21.966") && matchesQuery(rio, "740019"));
assert.ok(!matchesQuery(rio, "21") && !matchesQuery(rio, "hotel") && !matchesQuery({ document: null, name: "X" }, "2196"));

// --- Panel: un valor por grupo, null es "Todos"; "Borrador" solo en el borrador.
assert.equal(setBillingFilter(f({}), "type", "eticket").type, "eticket");
assert.equal(setBillingFilter(f({ type: "eticket" }), "type", "efactura").type, "efactura");
assert.equal(setBillingFilter(f({ type: "eticket", dgi: "accepted" }), "type", null).type, null);
assert.equal(setBillingFilter(f({ type: "eticket", dgi: "accepted" }), "type", null).dgi, "accepted");
assert.deepEqual(getFilterGroups("draft").map((group) => group.key), ["type", "dgi", "mark"]);
assert.deepEqual(getFilterGroups("archived").map((group) => group.key), ["type", "dgi"]);
assert.equal(countActiveFilters(f({ mark: "checked", query: " ríos ", type: "note" }), "draft"), 3);
assert.equal(countActiveFilters(f({ mark: "checked", query: " " }), "issued"), 0);

// --- Emitidas: los filtros se combinan con la búsqueda.
const issued = (name: string, cfeType: number, status: InvoiceStatus, document: string | null = null) => ({ cfeType, document, name, status });
const rows = [
  issued("Hotel Costa", 111, "ACCEPTED", "214567890013"),
  issued("Farmacia Centro", 111, "REJECTED", "215678900014"),
  issued("Cliente Prueba", 101, "ACCEPTED"),
  issued("Hotel Costa", 112, "ISSUED", "214567890013"),
  issued("Hotel Sur", 111, "UNKNOWN"),
];
const names = (list: { name: string; cfeType: number }[]) => list.map((row) => `${row.name}/${row.cfeType}`);
assert.deepEqual(names(filterIssuedRows(rows, f({ type: "efactura", dgi: "accepted" }))), ["Hotel Costa/111"]);
assert.deepEqual(names(filterIssuedRows(rows, f({ query: "hotel", dgi: "pending" }))), ["Hotel Costa/112"]);
assert.deepEqual(names(filterIssuedRows(rows, f({ query: "2145678" }))), ["Hotel Costa/111", "Hotel Costa/112"]);
assert.deepEqual(names(filterIssuedRows(rows, f({ dgi: "unknown" }))), ["Hotel Sur/111"]);
assert.equal(filterIssuedRows(rows, f({ mark: "checked" })).length, rows.length, "marcadas no aplica a Emitidas");

// --- Borrador: marcadas o no, y "Emitir N" cuenta todo lo marcado aunque se filtre.
const draftRow = (name: string, cfeType: number, selected: boolean, total: number) =>
  ({ cfeType, document: null, name, selected, status: "DRAFT", total }) as unknown as DraftRow;
const draft = [draftRow("A", 111, true, 100), draftRow("B", 101, true, 50), draftRow("C", 111, false, 70)];
assert.deepEqual(filterDraftRows(draft, f({ mark: "unchecked" })).map((row) => row.name), ["C"]);
assert.deepEqual(filterDraftRows(draft, f({ mark: "checked", type: "eticket" })).map((row) => row.name), ["B"]);
assert.equal(filterDraftRows(draft, f({ dgi: "accepted" })).length, 0, "lo que no se emitió no tiene estado DGI");
assert.deepEqual(getDraftTotals(draft), { amount: 150, count: 2, eFactura: 1, eTicket: 1 });

// --- Fuente: la barra recibe el borrador entero; lo archivado solo va a Archivadas.
const draftView = read("components/billing/billing-draft.tsx");
assert.match(draftView, /<BillingIssueBar draft=\{draft\} view=\{view\} \/>/);
assert.doesNotMatch(draftView, /BillingIssueBar draft=\{\{/);
assert.match(read("components/billing/billing-issue-bar.tsx"), /getDraftTotals\(draft\.rows\)/);
const page = read("components/billing/billing-page.tsx");
assert.match(page, /rows=\{list\.view === "issued" \? list\.issued : list\.archived\}/);
assert.match(page, /rows=\{list\.draft\}/);
assert.match(read("data/billing/month.ts"), /issued: current\.filter\(\(invoice\) => !invoice\.archivedAt\)/);
assert.doesNotMatch(read("components/billing/billing-issued-list.tsx"), /Archivadas ·/);
// Sin chips: en escritorio un panel que se abre y cierra con "Filtros"; en el
// teléfono, la hoja inferior de Visitas con "Limpiar" y "Ver N".
const toolbar = read("components/billing/billing-toolbar.tsx");
assert.match(toolbar, /aria-expanded=\{open\}[\s\S]*\{open \? \(/);
assert.match(toolbar, /<VisitSheet[\s\S]*Ver \{counts\[view\]\}[\s\S]*size="lg"/);
