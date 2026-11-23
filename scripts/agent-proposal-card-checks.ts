import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  changesLine,
  clashLabel,
  confirmLabel,
  countClashes,
  expiryText,
  proposalEyebrow,
  proposalFigure,
  receiptText,
  requestAgainText,
} from "../components/agent/cards/proposal-copy";
import { formatMoney } from "../components/agent/format";
import { runBudgetCalculation } from "../lib/agent/budget-calculation";
import type { ProposalSummary } from "../lib/agent/proposals";
import { fixtureBase } from "./agent-proposal-fixture";

// Tarjetas de propuesta de la feature 69: lo que dicen y la cifra de la línea
// plegada (puro), y dónde la UI usa la preferencia, la barra y la selección.
// Lo usa check:agent-proposals.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

const empty: ProposalSummary = {
  title: "",
  name: "Oficina Pocitos",
  slug: null,
  changes: [],
  inputs: null,
  before: null,
  after: null,
  stored: [],
  warnings: [],
};
const calc = runBudgetCalculation(fixtureBase);
const cheaper = runBudgetCalculation({ ...fixtureBase, revenue_percent: fixtureBase.revenue_percent - 5 });

// --- The header and the button say what will happen.
assert.equal(proposalEyebrow("CREATE_BUDGET", empty), "Crear presupuesto");
assert.equal(proposalEyebrow("SAVE_MEMORY", { title: "Recordar (Cliente)" }), "Recordar · Cliente");
assert.equal(confirmLabel("CREATE_BUDGET", null), "Crear presupuesto");
assert.equal(confirmLabel("UPDATE_BUDGET", null), "Guardar cambios");
assert.equal(confirmLabel("CREATE_VISITS", 4), "Agendar 4 visitas");
assert.equal(confirmLabel("CREATE_VISITS", 1), "Agendar 1 visita");
assert.equal(confirmLabel("CREATE_VISITS", 0), "Agendar");
assert.equal(confirmLabel("SAVE_MEMORY", null), "Recordar");

// --- The key figure of a folded card: the price, before → after, the visits.
const created = { ...empty, after: calc };
assert.equal(proposalFigure("CREATE_BUDGET", created, null), `${formatMoney(calc.withoutProducts.net)} + IVA`);
const updated = { ...empty, before: calc, after: cheaper };
assert.equal(
  proposalFigure("UPDATE_BUDGET", updated, null),
  `${formatMoney(calc.withoutProducts.net)} → ${formatMoney(cheaper.withoutProducts.net)} + IVA`
);
const batch = {
  ...empty,
  items: [
    { label: "mar 1 dic", detail: null },
    { label: "jue 3 dic", detail: "Se cruza con Estudio Benítez" },
    { label: "mar 8 dic", detail: null },
    { label: "jue 10 dic", detail: null },
  ],
};
assert.equal(proposalFigure("CREATE_VISITS", batch, 4), "4 visitas");
assert.equal(proposalFigure("CREATE_VISITS", batch, 3), "3 de 4 visitas");
const stored = { ...empty, stored: [{ hasProducts: true, net: 200, iva: 44, final: 244 }, { hasProducts: false, net: 100, iva: 22, final: 122 }] };
assert.equal(proposalFigure("DUPLICATE_BUDGET", stored, null), `${formatMoney(100)} + IVA`);

// --- Clashes count only the checked visits; the marker says how many.
assert.equal(countClashes(batch, null), 1);
assert.equal(countClashes(batch, [true, false, true, true]), 0);
assert.deepEqual([clashLabel(1), clashLabel(2)], ["1 se cruza", "2 se cruzan"]);

// --- Up to two changes go in the subtitle; more go in the rows.
const one = { ...empty, changes: [{ field: "revenue_percent", label: "Margen", before: 45, after: 40 }] };
assert.equal(changesLine(one), "Margen 45 % → 40 %");
assert.equal(changesLine({ ...empty, changes: [...one.changes, ...one.changes, ...one.changes] }), null);

// --- Receipts: what happened and where; a batch says how many went in.
assert.deepEqual(receiptText("CREATE_BUDGET", "CONFIRMED", created, null), {
  title: "Presupuesto creado",
  detail: `Oficina Pocitos · ${formatMoney(calc.withoutProducts.net)} + IVA`,
});
const result = { label: "", url: "", budgetId: null, slug: null, officialBudgetId: null, officialVersion: null, visitIndexes: [0, 2, 3] };
assert.deepEqual(receiptText("CREATE_VISITS", "CONFIRMED", batch, result), {
  title: "3 visitas agendadas",
  detail: "Oficina Pocitos · 1 sin agendar",
});
assert.deepEqual(receiptText("SAVE_MEMORY", "REJECTED", empty, null), { title: "Rechazada", detail: "Oficina Pocitos · no se guardó nada" });
assert.equal(receiptText("CREATE_BUDGET", "PENDING", empty, null), null);
assert.match(requestAgainText({ title: "Duplicar “Consorcio Sur”" }, "EXPIRED"), /^Proponé de nuevo: Duplicar “Consorcio Sur”\. La anterior venció/);

// --- Expiry in words, in the viewer's time.
const now = new Date(2026, 10, 20, 9, 0);
assert.equal(expiryText(new Date(2026, 10, 20, 17, 40).toISOString(), now), "Vence hoy a las 17:40");
assert.equal(expiryText(new Date(2026, 10, 21, 11, 42).toISOString(), now), "Vence mañana a las 11:42");

// --- Where the UI uses them: the fold follows the browser preference (unfolded
// by default), the chevron overrides it per card, and resolved ones fold.
const flags = read("components/agent/agent-browser-flags.ts");
assert.match(flags, /foldProposals: \{ key: "bambu\.agent\.foldProposals", fallback: false \}/);
assert.match(read("components/agent/hooks/use-proposal-fold.ts"), /override\?\.phase === phase \? override\.open : active \? !foldPending : false/);
const card = read("components/agent/cards/agent-proposal-card.tsx");
assert.match(card, /id=\{proposalCardId\(data\.proposalId\)\}/);
assert.match(card, /<FoldMarker clashes=\{countClashes\(summary, visits\.checked\)\} warnings=\{summary\.warnings\.length\} onUnfold=\{fold\.unfold\} \/>/);
assert.match(card, /confirmProposal\(data\.proposalId, visits\.visitIndexes\)/);
assert.match(read("components/agent/agent-page-header.tsx"), /footer=\{<AgentFoldProposalsItem \/>\}/);
// The pending bar counts only live PENDING proposals and confirms with the
// confirm-all flow, each batch with the visits checked in its card.
const bar = read("components/agent/agent-pending-bar.tsx");
assert.match(bar, /messages\.flatMap\(\(message\) => pendingProposalsOf\(message, proposals\)\)/);
assert.match(bar, /confirmProposals\(confirmable\.map\(\(item\) => item\.id\)\)/);
assert.match(read("components/agent/confirm-all.ts"), /if \(!live \|\| live\.unknownOutcome \|\| live\.status !== "PENDING"\) return \[\];/);
assert.match(read("components/agent/agent-chat.tsx"), /visitIndexes: selectedVisitIndexes\(/);
assert.match(read("components/agent/hooks/use-agent-proposal-mutations.ts"), /await confirm\.mutateAsync\(item\)\.catch\(\(\) => null\);/);
// The history counts live pending proposals per conversation.
assert.match(read("data/agent/proposals.ts"), /status: "PENDING", expiresAt: \{ gt: now \}/);
assert.match(read("actions/agent/conversations.ts"), /pendingProposals: pending\[conversation\.id\] \?\? 0,/);

[
  "components/agent/cards/agent-proposal-card.tsx", "components/agent/cards/agent-proposal-parts.tsx",
  "components/agent/cards/agent-proposal-lines.tsx", "components/agent/cards/agent-proposal-prices.tsx",
  "components/agent/cards/agent-proposal-receipt.tsx", "components/agent/cards/proposal-copy.ts",
  "components/agent/agent-pending-bar.tsx", "components/agent/hooks/use-visit-selection.ts",
].forEach((path) => assert.ok(read(path).trimEnd().split("\n").length <= 200, `${path} supera las 200 líneas`));
