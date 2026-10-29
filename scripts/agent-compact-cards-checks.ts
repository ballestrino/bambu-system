import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { runBudgetCalculation, type BudgetOptionRow } from "../lib/agent/budget-calculation";
import { calculationProfit, officialOptionProfit, storedOptionProfit } from "../lib/agent/budget-profit";
import { getStoredPrices } from "../lib/agent/proposal-summary";
import { defaultBudgetValues } from "../schemas/BudgetSchema";

// Feature 33: la ganancia exacta en las tarjetas, las listas plegadas y Abrir
// en el Sheet del chat. Lo usa check:agent-sheet.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

// --- Profit: a calculation's is its service revenue (plus the products one);
// a stored option at the calculated price gives the same, and a higher hand-
// written price adds the difference.
const values = { ...defaultBudgetValues, visits: 2, hours_per_visit: 4, products_price: 1000, products_revenue_percent: 15 };
const calculation = runBudgetCalculation(values);
const profit = calculationProfit(calculation);
assert.equal(profit.withoutProducts, calculation.serviceRevenue);
assert.equal(profit.withProducts, Math.round((calculation.serviceRevenue + calculation.productsRevenue) * 100) / 100);
assert.equal(calculationProfit(runBudgetCalculation({ ...values, products_price: 0 })).withProducts, null);

const option = (hasProducts: boolean, price: number): BudgetOptionRow => ({ ...values, has_products: hasProducts, price });
const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.02, `${actual} ≈ ${expected}`);
near(storedOptionProfit(option(false, calculation.withoutProducts.final), calculation.withoutProducts.net), profit.withoutProducts);
near(storedOptionProfit(option(true, calculation.withProducts!.final), calculation.withProducts!.net), profit.withProducts!);
near(storedOptionProfit(option(false, 0), calculation.withoutProducts.net + 500), profit.withoutProducts + 500);
assert.equal(officialOptionProfit({ hasProducts: true, netPrice: 20000, calculatedServiceCostBasis: 12000, productsCost: 1500 }), 6500);
assert.equal(officialOptionProfit({ hasProducts: false, netPrice: 20000, calculatedServiceCostBasis: 12000, productsCost: 1500 }), 8000);

// Stored prices carry the profit only when the read brought the inputs.
assert.equal(getStoredPrices({ budgetOptions: [{ has_products: false, price: 12200, iva: 22 }] })[0].profit, null);
const stored = getStoredPrices({ budgetOptions: [option(false, calculation.withoutProducts.final)] })[0];
near(stored.profit!, profit.withoutProducts);

// --- Source: the matching read brings whole options, profits stay out of
// the grounding, lists start collapsed and Abrir opens the chat's sheet.
assert.match(read("data/agent/budgets.ts"), /budgetOptions: true,/);
assert.doesNotMatch(read("lib/agent/budget-profit.ts"), /addToolGrounding|from "@\/lib\/agent\/grounding"/);
assert.match(read("components/agent/cards/agent-card.tsx"), /<details className=\{cn\("group\/card", frame\)\}>/);
assert.match(read("components/agent/cards/agent-list-card.tsx"), /<AgentCard\s+collapsed/);
assert.match(read("components/agent/cards/agent-email-message-card.tsx"), /<AgentCard\s+collapsed/);
const totals = read("components/agent/cards/agent-budget-totals-card.tsx");
assert.match(totals, /<AgentOpenBudgetButton slug=\{slug\} \/>/);
assert.match(totals, /Ganancia \{formatMoney\(profit\.withoutProducts\)\}/);
assert.doesNotMatch(totals, /CardOpenLink|getBudgetUrl/);
assert.doesNotMatch(read("components/agent/cards/agent-list-card.tsx"), /getBudgetUrl/);
const chat = read("components/agent/agent-chat.tsx");
assert.match(chat, /openSavedBudget: setSavedBudgetSlug/);
assert.match(chat, /<AgentSavedBudgetSheet slug=\{savedBudgetSlug\}/);
assert.match(read("actions/agent/saved-budget.ts"), /await requireAdminSession\(\);/);
assert.match(read("lib/agent/system-prompt.ts"), /no repitas en el texto lo que muestran/);
