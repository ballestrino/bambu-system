import assert from "node:assert/strict";

import "./agent-budget-editor-source-checks";
import { applyBudgetChanges, describeBudgetInputs, runBudgetCalculation } from "../lib/agent/budget-calculation";
import {
  isBudgetLocked,
  isSavableBudgetPartType,
  REVISABLE_PROPOSAL_STATUSES,
  valuesFromInputs,
} from "../lib/agent/budget-draft";
import { buildCreateBudgetProposal } from "../lib/agent/proposal-builders";
import { AGENT_PROPOSAL_STATUSES, serializeProposal } from "../lib/agent/proposals";
import { hideFromModel } from "../lib/agent/tool-result";
import {
  agentBudgetEditorSchema,
  agentSaveBudgetSchema,
  proposalBudgetValuesSchema,
} from "../schemas/agent-proposals";
import { defaultBudgetValues, type BudgetFormValues } from "../schemas/BudgetSchema";

// A calculation's full values: what calculateBudget computes and stores.
const calculated = (changes: Parameters<typeof applyBudgetChanges>[1], name = "Oficina Centro") =>
  applyBudgetChanges({ ...defaultBudgetValues, name }, changes).values;

const custom = calculated({
  visits: 3, visit_type: "days", hours_per_visit: 2.5, employees: 2, revenue_percent: 38,
  products_price: 0, transportation_cost: 180, company_enabled: false,
});

// --- Outputs saved before values existed rebuild them from their inputs: the
// calculation (and the price the form would compute) come out the same.
[calculated({}), custom, calculated({ products_price: 900, products_revenue_percent: 20, iva: 10 })].forEach((values) => {
  const rebuilt = valuesFromInputs(describeBudgetInputs(values), values.name);
  assert.deepEqual(runBudgetCalculation(rebuilt), runBudgetCalculation(values), values.name);
  assert.equal(rebuilt.price, values.price);
  assert.equal(rebuilt.company_enabled, values.company_enabled);
});
assert.equal(valuesFromInputs(describeBudgetInputs(custom), "x").company_contribution, defaultBudgetValues.company_contribution);

// --- The model never sees values; everything else (and any error) goes as is.
const output = { ok: true, data: { card: "budget-totals", inputs: { visits: 2 }, grounding: { amounts: [1] }, values: custom } };
const seen = hideFromModel("values")({ output }) as { type: string; value: { ok: boolean; data: Record<string, unknown> } };
assert.equal(seen.type, "json");
assert.deepEqual(Object.keys(seen.value.data), ["card", "inputs", "grounding"]);
assert.ok("values" in output.data, "the UI output keeps values");
const failure = { ok: false, error: { code: "not_found", message: "No" } };
assert.deepEqual(hideFromModel("values")({ output: failure }).value, failure);

// --- The editor validates in Spanish and what it sends is what the server
// accepts: numbers typed as text are converted, the limits are the proposal's.
const typed = { ...custom, visits: "3", hours_per_visit: "2.5", employees: "2" } as unknown as BudgetFormValues;
const edited = agentBudgetEditorSchema.parse({ ...typed, name: "  Oficina Norte " });
assert.equal(edited.name, "Oficina Norte");
assert.equal(edited.visits, 3);
assert.ok(proposalBudgetValuesSchema.safeParse(edited).success);
const issue = (values: object) => agentBudgetEditorSchema.safeParse(values).error?.issues[0]?.message;
assert.equal(issue({ ...custom, name: "   " }), "Poné un nombre para guardarlo en el generador.");
assert.equal(issue({ ...custom, employees: 0 }), "Tiene que haber al menos una empleada.");
assert.equal(issue({ ...custom, employees: 1.5 }), "Las empleadas van sin decimales.");
assert.equal(issue({ ...custom, visits: 1.5 }), "Las visitas van sin decimales.");
assert.equal(issue({ ...custom, iva: 0 }), "El IVA tiene que ser mayor que 0.");
const save = { conversationId: "conv_12345678", toolCallId: "call_abc", values: edited };
assert.ok(agentSaveBudgetSchema.safeParse(save).success);
assert.equal(agentSaveBudgetSchema.safeParse({ ...save, conversationId: "../x" }).success, false);
assert.equal(agentSaveBudgetSchema.safeParse({ ...save, toolCallId: "" }).success, false);
assert.equal(agentSaveBudgetSchema.safeParse({ ...save, values: { ...edited, visits: "3" } }).success, false);

// --- Saving builds the same CREATE_BUDGET proposal the agent would: the
// values as edited, the totals of the card, no invented changes or notes.
// "edited" skips the agent's price rules (feature 44): no estimates, no
// rounding of what was typed by hand.
const built = buildCreateBudgetProposal({ base: { source: "edited", values: edited }, name: edited.name, description: null, changes: {} });
assert.ok(built.ok);
if (built.ok) {
  const saved = built.payload.values;
  assert.deepEqual(
    [saved.name, saved.visits, saved.visit_type, saved.hours_per_visit, saved.employees, saved.company_enabled],
    ["Oficina Norte", 3, "days", 2.5, 2, false]
  );
  assert.equal(saved.price, custom.price);
  assert.deepEqual(built.summary.after, runBudgetCalculation(edited));
  assert.deepEqual([built.summary.title, built.summary.slug], ["Crear “Oficina Norte”", "oficina-norte"]);
  assert.deepEqual([built.summary.changes, built.summary.warnings], [[], []]);
}
const refusal = (name: string) => {
  const result = buildCreateBudgetProposal({ base: { source: "edited", values: edited }, name, description: null, changes: {} });
  return result.ok ? null : result.code;
};
assert.equal(refusal(" "), "missing_name");
assert.equal(refusal("¡¡!!"), "invalid_name");

// --- Only the agent's calculations and create proposals are saved from the
// chat; a saved or executing one is read-only, the rest can be revised.
["tool-calculateBudget", "tool-solveForTargetPrice", "tool-proposeCreateBudget"].forEach((type) => assert.ok(isSavableBudgetPartType(type), type));
["tool-proposeUpdateBudget", "tool-getBudget", "tool-proposeDuplicateBudget", "text"].forEach((type) => assert.ok(!isSavableBudgetPartType(type), type));
assert.deepEqual(AGENT_PROPOSAL_STATUSES.filter((status) => isBudgetLocked(status)), ["EXECUTING", "CONFIRMED"]);
assert.deepEqual(
  [...REVISABLE_PROPOSAL_STATUSES].sort(),
  AGENT_PROPOSAL_STATUSES.filter((status) => !isBudgetLocked(status)).sort()
);
assert.equal(isBudgetLocked(undefined), false);

// --- The proposal DTO carries the values of a create proposal only.
const at = new Date("2026-09-21T12:00:00.000Z");
const row = {
  id: "prop_1", kind: "CREATE_BUDGET" as const, status: "PENDING" as const, payload: { values: edited },
  summary: {}, result: null, error: null, toolCallId: "call_abc", conversationId: "conv_1",
  expiresAt: new Date(at.getTime() + 86_400_000), resolvedAt: null, createdAt: at, updatedAt: at,
};
assert.deepEqual(serializeProposal(row, at).values, edited);
assert.equal(serializeProposal({ ...row, kind: "UPDATE_BUDGET" }, at).values, null);
assert.equal(serializeProposal({ ...row, payload: undefined }, at).values, null);

console.log("Agent budget editor checks passed");
