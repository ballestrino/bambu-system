import assert from "node:assert/strict";

import { buildComparisonMarkdown } from "../components/agent/cards/comparison-copy";
import { DEFAULT_COMPARISON_FIELDS } from "../components/agent/cards/comparison-fields";
import { parseComparisonPreference } from "../components/agent/cards/comparison-preference";
import { applyBudgetChanges, runBudgetCalculation } from "../lib/agent/budget-calculation";
import { buildComparisonColumn, pickComparisonOption } from "../lib/agent/budget-comparison";
import { calculationProfit } from "../lib/agent/budget-profit";
import { AGENT_SKILLS, resolveSkillToolNames } from "../lib/agent/skills";
import { COMPARISON_RULE, buildAgentInstructions } from "../lib/agent/system-prompt";
import { compareBudgetsInputSchema } from "../schemas/agent-comparison";
import { defaultBudgetValues } from "../schemas/BudgetSchema";

// Feature 71: la tabla comparativa de precios.

// --- Each column is the calculateBudget calculation, with profit and the
// profit share of the net price.
const column = (label: string, changes: Parameters<typeof applyBudgetChanges>[1], source = "defaults" as const) => {
  const { values, changedFields } = applyBudgetChanges(defaultBudgetValues, changes);
  const calculation = runBudgetCalculation(values);
  return {
    calculation,
    column: buildComparisonColumn({
      label,
      base: { source, name: "Presupuesto nuevo", slug: null },
      values,
      calculation,
      changedFields,
    }),
  };
};
const low = column("Margen 20 %", { revenue_percent: 20 });
const high = column("Margen | 40 %", { revenue_percent: 40, products_price: 0 });
const profit = calculationProfit(low.calculation);
assert.equal(low.column.withoutProducts.net, low.calculation.withoutProducts.net);
assert.equal(low.column.withoutProducts.profit, profit.withoutProducts);
assert.equal(low.column.withProducts?.profit, profit.withProducts);
assert.equal(low.column.contributions, low.calculation.contributions);
assert.equal(
  low.column.withoutProducts.profitPercent,
  Math.round((profit.withoutProducts / low.calculation.withoutProducts.net) * 1000) / 10
);
assert.deepEqual(low.column.changedFields, ["revenue_percent"]);
assert.ok(high.column.withoutProducts.profit > low.column.withoutProducts.profit);
// Without products, the "with products" view falls back to the service prices.
assert.equal(high.column.withProducts, null);
assert.equal(pickComparisonOption(high.column, "with"), high.column.withoutProducts);
assert.equal(pickComparisonOption(low.column, "with"), low.column.withProducts);

// --- The copy is the visible table in Markdown, pipes escaped, with where
// each scenario comes from.
const markdown = buildComparisonMarkdown({
  title: "Oficina Centro",
  columns: [low.column, high.column],
  fields: ["profit", "net"],
  option: "with",
  date: new Date(2026, 10, 25),
});
assert.ok(markdown.startsWith("# Oficina Centro\n"));
assert.ok(markdown.includes("Fecha: 25/11/2026 · Precios con productos"));
assert.ok(markdown.includes("| Campo | Margen 20 % | Margen \\| 40 % |"));
assert.ok(markdown.includes("| --- | ---: | ---: |"));
const lines = markdown.split("\n");
// The table order, not the order in which fields were checked.
assert.ok(lines.findIndex((line) => line.startsWith("| **Precio sin IVA**")) <
  lines.findIndex((line) => line.startsWith("| **Ganancia mensual**")));
assert.ok(!markdown.includes("Aportes"));
assert.ok(markdown.includes("presupuesto nuevo, cambiando margen del servicio, productos. No lleva productos."));

// --- A stored preference is read without trusting its shape.
assert.deepEqual(parseComparisonPreference(null).fields, [...DEFAULT_COMPARISON_FIELDS]);
assert.deepEqual(parseComparisonPreference("{oops").option, "without");
assert.deepEqual(
  parseComparisonPreference(JSON.stringify({ fields: ["contributions", "gone"], option: "with" })),
  { fields: ["contributions"], option: "with" }
);
assert.deepEqual(parseComparisonPreference(JSON.stringify({ fields: [] })).fields, [...DEFAULT_COMPARISON_FIELDS]);

// --- Input: 2 to 8 scenarios; null changes compare the base as is.
const scenario = { label: "A", budgetSlug: null, fromDefaults: true, changes: null };
assert.ok(compareBudgetsInputSchema.safeParse({ title: null, scenarios: [scenario, scenario] }).success);
assert.ok(!compareBudgetsInputSchema.safeParse({ title: null, scenarios: [scenario] }).success);
assert.ok(!compareBudgetsInputSchema.safeParse({ title: null, scenarios: Array(9).fill(scenario) }).success);

// --- Available where prices are worked on, with its rule in the prompt.
(["general", "presupuestos", "consejos"] as const).forEach((id) => {
  assert.ok(resolveSkillToolNames(AGENT_SKILLS[id]).includes("compareBudgets"), id);
  assert.ok(
    buildAgentInstructions({ today: "hoy", actorName: null, skill: AGENT_SKILLS[id], budgetContextText: null, memoryBlock: null })
      .includes(COMPARISON_RULE),
    id
  );
});
assert.ok(!resolveSkillToolNames(AGENT_SKILLS.facturacion).includes("compareBudgets"));
