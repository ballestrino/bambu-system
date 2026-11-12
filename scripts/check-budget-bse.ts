import assert from "node:assert/strict";

import { applyAgentChanges } from "../lib/agent/agent-pricing";
import { budgetOptionToFormValues, describeBudgetInputs, runBudgetCalculation } from "../lib/agent/budget-calculation";
import { valuesFromInputs } from "../lib/agent/budget-draft";
import { describeChanges } from "../lib/agent/proposal-summary";
import { applyBseKeepingPrice } from "../lib/budget-bse";
import { calculateBudgetTotals } from "../lib/budget-calculations";
import { buildBudgetOptionRows } from "../lib/budget-option-rows";
import { formatBudgetForAI } from "../lib/format-budget";
import { budgetChangesSchema } from "../schemas/agent-tools";
import { BSE_DEFAULT_PERCENT, BudgetSchema, defaultBudgetValues, type BudgetFormValues } from "../schemas/BudgetSchema";

// BSE (feature 54): % del sueldo nominal, null en los presupuestos de antes.
const finalPrice = (values: BudgetFormValues) =>
  Number(calculateBudgetTotals(values).totalFinalWithProducts.toFixed(2));
const old: BudgetFormValues = { ...defaultBudgetValues, name: "Viejo", bse_contribution: null, products_price: 1500, revenue_percent: 45 };

// --- Sin BSE (null) el cálculo es el de siempre; con 5% suma a las cargas y al costo.
const withoutBse = calculateBudgetTotals(old);
const withBse = calculateBudgetTotals({ ...old, bse_contribution: 5 });
assert.equal(withoutBse.bseVal, 0);
assert.equal(calculateBudgetTotals({ ...old, bse_contribution: 0 }).costBasisNoProducts, withoutBse.costBasisNoProducts);
assert.ok(Math.abs(withBse.bseVal - withoutBse.laborCost * 0.05) < 1e-9);
// Sobre el sueldo nominal: los aportes personales apagados bajan la mano de obra, no el BSE.
const personalOff = calculateBudgetTotals({ ...old, personal_enabled: false, bse_contribution: 5 });
assert.ok(personalOff.laborCost < withBse.laborCost);
assert.ok(Math.abs(personalOff.bseVal - withBse.bseVal) < 1e-9);
assert.ok(Math.abs(withBse.bseVal - withBse.totalHours * old.nominal_hour * 0.05) < 1e-9);
assert.ok(Math.abs(withBse.totalContribsExtra - withoutBse.totalContribsExtra - withBse.bseVal) < 1e-9);
assert.ok(Math.abs(withBse.costBasisNoProducts - withoutBse.costBasisNoProducts - withBse.bseVal) < 1e-9);
assert.equal(defaultBudgetValues.bse_contribution, BSE_DEFAULT_PERCENT);
assert.equal(BSE_DEFAULT_PERCENT, 5.2);

// --- El schema acepta null (presupuesto viejo) y un objeto sin el campo queda en null.
assert.equal(BudgetSchema.parse({ ...old, bse_contribution: null }).bse_contribution, null);
const withoutField: Partial<BudgetFormValues> = { ...old };
delete withoutField.bse_contribution;
assert.equal(BudgetSchema.parse(withoutField).bse_contribution, null);

// --- Calcular BSE: pone el 5,2% por defecto, baja solo el margen y el precio queda igual al centavo.
for (const sample of [
  old,
  { ...old, hours_per_visit: 3.5, visits: 3, employees: 2, revenue_percent: 37.5 },
  { ...old, visit_type: "days" as const, visits: 7, nominal_hour: 243.17, revenue_percent: 61.123456 },
  { ...old, extras: [{ name: "Camión", amount: 2500 }], personal_enabled: false, revenue_percent: 30 },
]) {
  const result = applyBseKeepingPrice(sample);
  assert.ok(result.ok);
  assert.equal(result.values.bse_contribution, BSE_DEFAULT_PERCENT);
  assert.ok(result.revenuePercentTo < result.revenuePercentFrom);
  assert.equal(finalPrice(result.values), finalPrice(sample));
  const before = calculateBudgetTotals(sample);
  const after = calculateBudgetTotals(result.values);
  assert.ok(Math.abs(after.priceNoTaxService - before.priceNoTaxService) < 1e-6);
  assert.ok(Math.abs(before.revenueAmountService - after.revenueAmountService - after.bseVal) < 1e-6);
  assert.equal(after.priceNoTaxProducts, before.priceNoTaxProducts);
}

// --- No se calcula dos veces, sin costo, ni si la ganancia no alcanza.
assert.deepEqual(
  [
    applyBseKeepingPrice({ ...old, bse_contribution: 5 }),
    applyBseKeepingPrice({ ...old, hours_per_visit: 0, transportation_cost: 0 }),
    applyBseKeepingPrice({ ...old, revenue_percent: 0.5 }),
  ].map((result) => (result.ok ? "ok" : result.reason)),
  ["already_set", "no_cost", "not_enough_profit"]
);

// --- Crear y editar guardan el BSE tal cual en las dos opciones (null sigue null).
const rows = buildBudgetOptionRows({ ...old, price: finalPrice(old) });
assert.deepEqual(rows.map((row) => [row.has_products, row.bse_contribution]), [[true, null], [false, null]]);
assert.deepEqual(buildBudgetOptionRows({ ...old, products_price: 0 }).map((row) => row.has_products), [false]);
const oldTotals = calculateBudgetTotals(old);
assert.equal(rows[1].price, oldTotals.priceNoTaxService + oldTotals.priceNoTaxService * (old.iva / 100));
assert.equal(rows[0].profit, oldTotals.revenueAmountService + oldTotals.revenueAmountProducts);
assert.equal(buildBudgetOptionRows({ ...old, bse_contribution: 5, company_enabled: false })[0].company_contribution, 0);

// --- Una opción guardada sin el campo o con null se lee sin BSE; sin opciones, el default.
const option = { ...old, has_products: true, extras: [] };
assert.equal(budgetOptionToFormValues({ name: "A", description: null, budgetOptions: [option] }).bse_contribution, null);
assert.equal(budgetOptionToFormValues({ name: "A", description: null, budgetOptions: [] }).bse_contribution, BSE_DEFAULT_PERCENT);

// --- El agente ve extras y BSE, y los puede cambiar.
const inputs = describeBudgetInputs(old);
assert.equal(inputs.bsePercent, null);
assert.equal(valuesFromInputs(inputs, "A").bse_contribution, null);
assert.equal(valuesFromInputs({ ...inputs, bsePercent: undefined } as never, "A").bse_contribution, null);
const calc = runBudgetCalculation({ ...old, bse_contribution: 5, extras: [{ name: "Permiso", amount: 500 }] });
assert.equal(calc.extras, 500);
assert.ok(calc.bse > 0);
const parsedChanges = budgetChangesSchema.parse({
  ...Object.fromEntries(Object.keys(budgetChangesSchema.shape).map((key) => [key, null])),
  extras: [{ name: "Camión", amount: 2000 }],
});
assert.deepEqual(parsedChanges.extras, [{ name: "Camión", amount: 2000 }]);

const base = { source: "budget", values: old };
const bse = applyAgentChanges(base, { calculateBse: true });
assert.equal(bse.bseError, null);
assert.equal(bse.rounding, null);
assert.equal(bse.values.bse_contribution, BSE_DEFAULT_PERCENT);
assert.equal(bse.values.price, finalPrice(old));
assert.deepEqual([...bse.changedFields].sort(), ["bse_contribution", "revenue_percent"]);
assert.match(applyAgentChanges({ source: "budget", values: bse.values }, { calculateBse: true }).bseError ?? "", /ya tiene el BSE/);

const extras = applyAgentChanges(base, { extras: [{ name: "Camión", amount: 2000 }] });
assert.deepEqual(extras.changedFields.filter((field) => field !== "revenue_percent"), ["extras"]);
assert.ok(extras.values.price > old.price);
assert.deepEqual(applyAgentChanges(base, { extras: [] }).changedFields, []);
assert.deepEqual(applyAgentChanges(base, { bse_contribution: 3 }).values.bse_contribution, 3);

// --- La tarjeta describe extras y BSE como texto.
const changes = describeChanges(old, { ...bse.values, extras: [{ name: "Camión", amount: 2000 }] });
assert.deepEqual(
  changes.filter((change) => change.field !== "revenue_percent").map((change) => [change.field, change.before, change.after]),
  [["extras", "sin extras", "Camión · $ 2.000"], ["bse_contribution", "sin calcular", BSE_DEFAULT_PERCENT]]
);

// --- El contexto del presupuesto le cuenta al modelo los extras y el BSE.
const context = formatBudgetForAI({ ...old, extras: [{ name: "Permiso", amount: 500 }], name: "A" });
assert.match(context, /Permiso: \$500\.00/);
assert.match(context, /BSE: sin calcular/);
assert.match(formatBudgetForAI({ ...old, bse_contribution: 5, name: "A" }), /BSE: 5% del sueldo nominal/);

process.stdout.write("budget BSE checks passed\n");
