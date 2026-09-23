import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Invariantes de las reglas de precio del agente (feature 44) que se ven en el
// código fuente. Lo usa check:agent-pricing. Un checkout con core.autocrlf
// deja CRLF: se normaliza para que las regex con \n valgan igual.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

// El texto de una declaración hasta la siguiente: una línea que está en otra
// función del archivo no cuenta.
const declaration = (text: string, start: string, end: string) => {
  const from = text.indexOf(start);
  assert.ok(from >= 0, start);
  const to = text.indexOf(end, from + start.length);
  return text.slice(from, to < 0 ? undefined : to);
};

// --- calculateBudget and the create and update proposals go through the same
// price rules; solveForTargetPrice estimates a new budget but never rounds.
const calculations = read("lib/agent/tools/calculations.ts");
assert.match(calculations, /const \{ values, changedFields, rounding \} = applyAgentChanges\(base, input\.changes \?\? \{\}\);/);
assert.match(calculations, /applyAgentChanges\(base, \{ \.\.\.input\.changes, roundPrice: false \}\)/);
assert.match(calculations, /changedFields,\n\s+rounding,\n/);
assert.doesNotMatch(calculations, /applyBudgetChanges/);
const builders = read("lib/agent/proposal-builders.ts");
assert.equal(builders.match(/applyAgentChanges\(/g)?.length, 2);
assert.doesNotMatch(builders, /applyBudgetChanges/);
// The editor of feature 43 saves what was typed.
assert.match(read("actions/agent/save-budget.ts"), /base: \{ source: "edited", values \}/);
// The products estimate is rounded where it is made.
assert.match(
  read("lib/agent/budget-calculation.ts"),
  /if \(estimateProducts\) next\.products_price = roundProductsPrice\(estimates\.products_price\);/
);

// --- Looking for an equal budget: admin, the four service fields (and the
// products option when asked), the most recent first, one more than shown;
// its stored prices are citable.
const finder = declaration(read("data/agent/budgets.ts"), "export const findAgentBudgetsByService", "export const");
[
  "await requireAdminSession();",
  "visit_type: service.visit_type,",
  "visits: service.visits,",
  "hours_per_visit: service.hours_per_visit,",
  "employees: service.employees,",
  "...(service.withProducts ? { has_products: true } : {}),",
  'orderBy: [{ updatedAt: "desc" }, { id: "asc" }],',
  "take: MATCHING_BUDGETS_LIMIT + 1,",
].forEach((text) => assert.ok(finder.includes(text), `findAgentBudgetsByService: ${text}`));
// The tool reads with the service of its input and grounds the stored prices
// it shows (tested in agent-matching-checks.ts).
const matchingTool = declaration(read("lib/agent/tools/budgets.ts"), "findMatchingBudgets: tool({", ": tool({");
assert.match(matchingTool, /toMatchingBudgets\(await findAgentBudgetsByService\(serviceFromInput\(input\)\)\)/);
assert.match(matchingTool, /addToolGrounding\(ctx\.grounding, matches\.grounding\);/);
assert.match(matchingTool, /kind: "matchingBudgets" as const, \.\.\.matches/);
// Creating warns when the same service is already saved.
const proposalTools = read("lib/agent/tools/proposals.ts");
assert.match(proposalTools, /return saveProposal\(ctx, toolCallId, await withSameServiceWarning\(built\)\);/);
assert.match(
  declaration(proposalTools, "const withSameServiceWarning", "const slugTaken"),
  /sameServiceWarning\(await findAgentBudgetsByService\(serviceFromValues\(built\.payload\.values\)\)\)/
);

// --- Room for the quote-request flow (6 steps) plus a retry.
assert.match(read("lib/agent/run.ts"), /const MAX_STEPS = 8;/);

// --- Cards: the rounding note and the list of equal budgets.
assert.match(read("components/agent/cards/agent-budget-totals-card.tsx"), /const rounding = "rounding" in data \? data\.rounding : null;/);
assert.match(read("components/agent/cards/agent-list-card.tsx"), /matchingBudgets: \{/);

// --- Size and harness state.
[
  "lib/agent/agent-pricing.ts",
  "lib/agent/matching-budgets.ts",
  "lib/agent/price-rounding.ts",
  "lib/agent/budget-calculation.ts",
  "lib/agent/tools/budgets.ts",
  "lib/agent/tools/proposals.ts",
  "lib/agent/proposal-builders.ts",
  "lib/agent/proposal-summary.ts",
  "data/agent/budgets.ts",
  "components/agent/cards/agent-list-card.tsx",
  "components/agent/cards/agent-budget-totals-card.tsx",
  "scripts/check-agent-pricing.ts",
  "scripts/agent-matching-checks.ts",
].forEach((path) => assert.ok(read(path).trimEnd().split("\n").length <= 200, `${path} supera las 200 líneas`));
const features = JSON.parse(read("feature_list.json")).features as { id: number; name: string }[];
assert.equal(features.find((feature) => feature.id === 44)?.name, "agent_pricing_rules");
