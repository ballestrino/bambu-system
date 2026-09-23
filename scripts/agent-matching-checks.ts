import assert from "node:assert/strict";

import { getStoredOptionAmounts } from "../lib/agent/budget-calculation";
import {
  MATCHING_BUDGETS_LIMIT,
  sameServiceWarning,
  serviceFromInput,
  serviceFromValues,
  toMatchingBudgets,
} from "../lib/agent/matching-budgets";
import { PRICE_RULE } from "../lib/agent/system-prompt";
import { defaultBudgetValues } from "../schemas/BudgetSchema";

// Presupuestos iguales (feature 44): la búsqueda que sale de la entrada, las
// filas con sus precios citables y el aviso de crear. Lo usa
// check:agent-pricing.

// --- The tool input: no employees is 1, and only hasProducts true asks for the
// products option.
const input = { frequency: "week" as const, visits: 2, hoursPerVisit: 4, employees: null, hasProducts: null };
const service = { visit_type: "week", visits: 2, hours_per_visit: 4, employees: 1, withProducts: false };
assert.deepEqual(serviceFromInput(input), service);
assert.deepEqual(serviceFromInput({ ...input, employees: 3, hasProducts: true }), { ...service, employees: 3, withProducts: true });
assert.equal(serviceFromInput({ ...input, hasProducts: false }).withProducts, false);
// A create proposal looks for its own service, with products if it has them.
assert.deepEqual(serviceFromValues({ ...defaultBudgetValues, visits: 3, employees: 2 }), { ...service, visits: 3, employees: 2, withProducts: true });
assert.equal(serviceFromValues({ ...defaultBudgetValues, products_price: 0 }).withProducts, false);

// --- The read brings one more than shown: the rows, their stored prices and
// the citable amounts are those of the ones shown.
const row = (index: number) => ({
  id: `budget_${index}`,
  slug: `oficina-${index}`,
  name: `Oficina ${index}`,
  updatedAt: new Date(Date.UTC(2026, 8, 20 - index)),
  budgetOptions: [{ has_products: true, price: 12200 + index, iva: 22 }, { has_products: false, price: 11000 + index, iva: 22 }],
  officialBudget: index === 0 ? { status: "ACTIVE", currentVersion: 3 } : null,
});
const found = Array.from({ length: MATCHING_BUDGETS_LIMIT + 1 }, (_, index) => row(index));
const matches = toMatchingBudgets(found);
assert.deepEqual([matches.total, matches.truncated, matches.rows.length], [MATCHING_BUDGETS_LIMIT, true, MATCHING_BUDGETS_LIMIT]);
assert.deepEqual(
  matches.grounding.amounts,
  found.slice(0, MATCHING_BUDGETS_LIMIT).flatMap((budget) => getStoredOptionAmounts(budget.budgetOptions))
);
assert.ok(!matches.grounding.amounts.includes(11000 + MATCHING_BUDGETS_LIMIT), "the extra one is not citable");
assert.deepEqual(matches.rows[0].official, { status: "ACTIVE", version: 3 });
assert.deepEqual(matches.rows[0].prices.map((price) => [price.hasProducts, price.final]), [[false, 11000], [true, 12200]]);
assert.equal(toMatchingBudgets(found.slice(0, 2)).truncated, false);

// --- The create card warns; when the read brought the extra one, there are
// more than it can count.
assert.equal(sameServiceWarning([]), null);
assert.match(sameServiceWarning([{ name: "Oficina Centro" }]) ?? "", /mismo servicio: “Oficina Centro”\. Revisá que no sea un duplicado\./);
assert.match(sameServiceWarning(found.slice(0, 5)) ?? "", /“Oficina 0”, “Oficina 1”, “Oficina 2” y 2 más\./);
assert.match(sameServiceWarning(found.slice(0, MATCHING_BUDGETS_LIMIT)) ?? "", / y 7 más\./);
assert.match(sameServiceWarning(found) ?? "", /“Oficina 2” y más\. Revisá/);

// --- The mandatory price rule names an equal saved budget as a source.
assert.match(PRICE_RULE, /uno guardado igual \(findMatchingBudgets\)/);
