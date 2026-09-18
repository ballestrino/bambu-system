import assert from "node:assert/strict";

import "./agent-proposal-source-checks";
import {
  applyBudgetChanges,
  budgetOptionToFormValues,
  runBudgetCalculation,
} from "../lib/agent/budget-calculation";
import { buildCreateBudgetProposal, buildUpdateBudgetProposal } from "../lib/agent/proposal-builders";
import { AGENT_PROPOSAL_KINDS } from "../lib/agent/proposals";
import {
  buildDuplicateBudgetProposal,
  buildPublishOfficialBudgetProposal,
} from "../lib/agent/stored-budget-proposals";
import { slugifyBudgetName } from "../lib/budget-slug";
import { parseProposalPayload, proposalPayloadSchemas } from "../schemas/agent-proposals";
import { proposeUpdateBudgetInputSchema } from "../schemas/agent-tools";
import { defaultBudgetValues } from "../schemas/BudgetSchema";
import { budget, fixtureBase, noChanges, roundTrip, storeOption } from "./agent-proposal-fixture";
import "./agent-proposal-flow-checks";

// --- Update: the saved values are exactly what calculateBudget shows for the
// same base and changes, categories survive, and the card shows before/after.
const update = buildUpdateBudgetProposal({ budget, name: null, description: null, changes: { ...noChanges, revenue_percent: 40 } });
assert.ok(update.ok);
const expected = applyBudgetChanges(budgetOptionToFormValues(budget), { revenue_percent: 40 }).values;
assert.deepEqual(runBudgetCalculation(update.payload.values), runBudgetCalculation(expected));
assert.deepEqual(update.payload.values.categoryIds, ["cat_1", "cat_2"]);
assert.deepEqual(update.summary.changes.map((change) => change.field), ["revenue_percent"]);
assert.deepEqual(update.summary.before, runBudgetCalculation(fixtureBase));
assert.equal(update.summary.after?.revenuePercent, 40);
assert.deepEqual(
  [update.payload.newSlug, update.payload.baseUpdatedAt, update.payload.officialBudgetId],
  ["ln-2026", budget.updatedAt.toISOString(), null]
);
assert.ok(update.grounding.includes(update.summary.after?.withoutProducts.final ?? -1));
// Option recreation is always announced; linked jobs are counted.
assert.match(update.summary.warnings[0], /recrea las opciones con ids nuevos: 3 trabajos vinculados/);
assert.ok(!update.summary.warnings.some((warning) => /versión oficial/.test(warning)));

// --- A linked, active official budget gets version N+1 on save: the card says so.
const official = { ...budget, officialBudget: { id: "off_1", status: "ACTIVE", currentVersion: 3 } };
const officialUpdate = buildUpdateBudgetProposal({ budget: official, name: null, description: null, changes: { revenue_percent: 40 } });
assert.ok(officialUpdate.ok);
assert.equal(officialUpdate.payload.officialBudgetId, "off_1");
assert.ok(officialUpdate.summary.warnings.some((warning) => warning.includes("versión oficial 4 (hoy rige la 3)")));

// --- The slug only changes with the name, with the same rule as createBudget.
// The input is what the model sends (every field, null when unchanged),
// spread into the builder the way the tool does.
const renameInput = proposeUpdateBudgetInputSchema.parse({
  budgetSlug: null, name: "Limpieza Norte Centro", description: null, changes: noChanges,
});
const renamed = buildUpdateBudgetProposal({ budget, ...renameInput });
assert.ok(renamed.ok);
assert.equal(renamed.payload.newSlug, "limpieza-norte-centro");
assert.ok(renamed.summary.warnings.some((warning) => warning.includes("/dashboard/budgets/budget/limpieza-norte-centro")));
assert.equal(slugifyBudgetName("  Óptima  Limpieza__2 "), "ptima-limpieza-2");

// --- Nothing to save, removed products and stale stored prices.
const same = buildUpdateBudgetProposal({ budget, name: "Limpieza Norte", description: "", changes: { revenue_percent: fixtureBase.revenue_percent } });
assert.deepEqual(same.ok ? null : same.code, "no_changes");
const withoutProducts = buildUpdateBudgetProposal({ budget, name: null, description: null, changes: { products_price: 0 } });
assert.ok(withoutProducts.ok && withoutProducts.summary.warnings.includes("Se elimina la opción con productos."));
const drifted = { ...budget, budgetOptions: [storeOption(fixtureBase, false), { ...storeOption(fixtureBase, true), price: 99_999 }] };
const driftUpdate = buildUpdateBudgetProposal({ budget: drifted, name: null, description: null, changes: { revenue_percent: 40 } });
assert.ok(driftUpdate.ok && driftUpdate.summary.warnings.some((warning) => /no salen del cálculo actual/.test(warning)));
assert.ok(!update.summary.warnings.some((warning) => /no salen del cálculo actual/.test(warning)));

// --- Create: from the unsaved form (its name when name is null) with the
// same numbers as calculateBudget; a name is mandatory and must slugify.
const formValues = { ...fixtureBase, name: "Oficina Centro", categoryIds: ["cat_9"] };
const create = buildCreateBudgetProposal({ base: { source: "form", values: formValues }, name: null, description: null, changes: { visits: 2 } });
assert.ok(create.ok);
assert.equal(create.summary.slug, "oficina-centro");
assert.deepEqual([create.payload.values.visits, create.payload.values.categoryIds], [2, ["cat_9"]]);
assert.deepEqual(create.summary.after, runBudgetCalculation(applyBudgetChanges(formValues, { visits: 2 }).values));
assert.match(create.summary.warnings[0], /formulario abierto no se guarda/);
const defaults = { source: "defaults" as const, values: defaultBudgetValues };
const unnamed = buildCreateBudgetProposal({ base: defaults, name: null, description: null, changes: {} });
assert.equal(unnamed.ok ? null : unnamed.code, "missing_name");
const symbols = buildCreateBudgetProposal({ base: defaults, name: "¿¡!?", description: null, changes: {} });
assert.equal(symbols.ok ? null : symbols.code, "invalid_name");
// Visits and employees are integers in BudgetOption: a fractional form value is refused.
const fractional = buildCreateBudgetProposal({ base: { source: "form", values: { ...formValues, visits: 1.5 } }, name: null, description: null, changes: {} });
assert.equal(fractional.ok ? null : fractional.code, "invalid_values");

// --- Duplicate needs the owner (duplicateBudget enforces it); publish needs
// an unlinked budget with options.
const notOwner = buildDuplicateBudgetProposal({ budget, actorId: "user_2" });
assert.equal(notOwner.ok ? null : notOwner.code, "not_owner");
const duplicate = buildDuplicateBudgetProposal({ budget, actorId: "user_1" });
assert.ok(duplicate.ok);
assert.equal(duplicate.summary.name, "Limpieza Norte (copia)");
assert.deepEqual(duplicate.summary.stored.map((option) => option.hasProducts), [false, true]);
const linked = buildPublishOfficialBudgetProposal({ budget: official });
assert.equal(linked.ok ? null : linked.code, "already_official");
const empty = buildPublishOfficialBudgetProposal({ budget: { ...budget, budgetOptions: [] } });
assert.equal(empty.ok ? null : empty.code, "no_options");
const publish = buildPublishOfficialBudgetProposal({ budget });
assert.ok(publish.ok && publish.summary.warnings.some((warning) => /precio de lista vigente/.test(warning)));

// --- Every kind has a payload schema, every built payload survives the JSON
// round trip through the database, and a mismatched payload is refused.
assert.deepEqual(Object.keys(proposalPayloadSchemas).sort(), [...AGENT_PROPOSAL_KINDS].sort());
[create, update, duplicate, publish].forEach((built) => {
  assert.ok(built.ok);
  assert.equal(parseProposalPayload(built.kind, roundTrip(built.payload))?.kind, built.kind);
});
assert.equal(parseProposalPayload("UPDATE_BUDGET", roundTrip(create.payload)), null);
assert.equal(parseProposalPayload("DUPLICATE_BUDGET", { budgetId: "budget_1", baseUpdatedAt: "ayer" }), null);
assert.equal(
  parseProposalPayload("CREATE_BUDGET", { values: { ...create.payload.values, employees: 0 } }),
  null
);

console.log("Agent proposal checks passed");
