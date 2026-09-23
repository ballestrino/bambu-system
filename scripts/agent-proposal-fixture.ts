import { applyBudgetChanges, runBudgetCalculation } from "../lib/agent/budget-calculation";
import type { ProposalBudget } from "../lib/agent/proposal-builders";
import { budgetChangesSchema } from "../schemas/agent-tools";
import { defaultBudgetValues, type BudgetFormValues } from "../schemas/BudgetSchema";

// Un presupuesto guardado como lo guarda createBudget: la opción con productos
// lleva el precio del formulario y la otra su propio precio final. Lo usan
// los checks de check:agent-proposals.
export const fixtureBase = applyBudgetChanges(
  { ...defaultBudgetValues, name: "Limpieza Norte" },
  {}
).values;

export const storeOption = (values: BudgetFormValues, hasProducts: boolean, sourcedJobs = 0) => ({
  ...values,
  has_products: hasProducts,
  incidence_contribution: values.incidence_enabled ? values.incidence_contribution : 0,
  company_contribution: values.company_enabled ? values.company_contribution : 0,
  personal_contribution: values.personal_enabled ? values.personal_contribution : 0,
  products_price: hasProducts ? values.products_price : 0,
  products_iva: hasProducts ? values.products_iva : 0,
  products_revenue_percent: hasProducts ? values.products_revenue_percent : 0,
  price: hasProducts ? values.price : runBudgetCalculation(values).withoutProducts.final,
  _count: { sourcedJobs },
});

export const budget: ProposalBudget = {
  id: "budget_1",
  slug: "ln-2026",
  name: "Limpieza Norte",
  description: null,
  userId: "user_1",
  updatedAt: new Date("2026-09-17T12:00:00.000Z"),
  budgetOptions: [storeOption(fixtureBase, false, 1), storeOption(fixtureBase, true, 2)],
  budgetCategory: [{ id: "cat_1" }, { id: "cat_2" }],
  officialBudget: null,
};

// Lo que manda el modelo cuando no cambia nada: todos los campos, en null.
export const noChanges = Object.fromEntries(
  Object.keys(budgetChangesSchema.shape).map((key) => [key, null])
) as { [K in keyof typeof budgetChangesSchema.shape]: null };

// Lo que vuelve de la base: JSON, sin Date ni undefined.
export const roundTrip = (value: unknown): unknown => JSON.parse(JSON.stringify(value));
