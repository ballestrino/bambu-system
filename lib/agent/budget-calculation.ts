import {
  calculateBudgetTotals,
  calculateEstimates,
  calculateRevenuePercentForHourlyTarget,
  calculateRevenuePercentForServiceTarget,
} from "@/lib/budget-calculations";
import { roundProductsPrice } from "@/lib/agent/price-rounding";
import { roundMoney } from "@/lib/agent/tool-result";
import { defaultBudgetValues, type BudgetFormValues } from "@/schemas/BudgetSchema";
import type { AgentBudgetChanges } from "@/schemas/agent-tools";

// Cálculos del agente sobre las funciones del formulario. Puro: nunca
// persiste, así "¿y si…?" no toca ningún presupuesto.
export type BudgetOptionRow = Omit<BudgetFormValues,
  "name" | "description" | "categoryIds" | "incidence_enabled" | "company_enabled" | "personal_enabled"
> & { has_products: boolean };

type BudgetRow = {
  name: string;
  description: string | null;
  budgetOptions: BudgetOptionRow[];
  budgetCategory?: { id: string }[];
};

// calculateBudgetTotals toma un IVA 0 como 22 (`Number(iva) || 22`). El agente
// parte siempre del IVA que de verdad usa el cálculo, así sus insumos, sus
// totales y lo que propone guardar dicen lo mismo.
export const withEffectiveIva = (values: BudgetFormValues): BudgetFormValues =>
  Number(values.iva) > 0 ? values : { ...values, iva: defaultBudgetValues.iva };

// Igual que el formulario de edición: la opción con productos si existe, y un
// aporte guardado en 0 es un aporte deshabilitado. El IVA, el efectivo.
export const budgetOptionToFormValues = (budget: BudgetRow): BudgetFormValues => {
  const option =
    budget.budgetOptions.find((item) => item.has_products) ?? budget.budgetOptions[0];
  const base = option ?? defaultBudgetValues;
  return withEffectiveIva({
    ...defaultBudgetValues,
    visits: base.visits,
    visit_type: base.visit_type,
    hours_per_visit: base.hours_per_visit,
    nominal_hour: base.nominal_hour,
    nominal_salary: base.nominal_salary,
    employees: base.employees,
    incidence_contribution: base.incidence_contribution,
    company_contribution: base.company_contribution,
    personal_contribution: base.personal_contribution,
    transportation_cost: base.transportation_cost,
    products_price: base.products_price,
    products_iva: base.products_iva,
    products_revenue_percent: base.products_revenue_percent,
    revenue_percent: base.revenue_percent,
    price: base.price,
    iva: base.iva,
    name: budget.name,
    description: budget.description ?? undefined,
    categoryIds: budget.budgetCategory?.map((category) => category.id) ?? [],
    incidence_enabled: Number(base.incidence_contribution) > 0,
    company_enabled: Number(base.company_contribution) > 0,
    personal_enabled: Number(base.personal_contribution) > 0,
  });
};

// El precio por hora es una referencia: va redondeado a pesos (reglas de precio del agente).
const priceOption = (net: number, iva: number, final: number, hourlyNet: number) => ({
  net: roundMoney(net),
  iva: roundMoney(iva),
  final: roundMoney(final),
  hourlyNet: Math.round(hourlyNet),
});

export type BudgetCalculation = ReturnType<typeof runBudgetCalculation>;

export const runBudgetCalculation = (values: BudgetFormValues) => {
  const totals = calculateBudgetTotals(values);
  return {
    totalHours: Math.round(totals.totalHours * 100) / 100,
    laborCost: roundMoney(totals.laborCost),
    contributions: roundMoney(totals.totalContribsExtra),
    transport: roundMoney(totals.transport),
    products: roundMoney(totals.products),
    serviceCost: roundMoney(totals.costBasisNoProducts),
    serviceRevenue: roundMoney(totals.revenueAmountService),
    productsRevenue: roundMoney(totals.revenueAmountProducts),
    revenuePercent: Number(values.revenue_percent) || 0,
    ivaPercent: Number(values.iva) || 22,
    withoutProducts: priceOption(
      totals.priceNoTaxService,
      totals.ivaAmountService,
      totals.finalPriceService,
      totals.hourlyPriceNoTaxService
    ),
    withProducts:
      totals.products > 0
        ? priceOption(
            totals.totalPreTaxWithProducts,
            totals.totalIvaWithProducts,
            totals.totalFinalWithProducts,
            totals.hourlyPriceNoTaxWithProducts
          )
        : null,
  };
};

// Los importes que un cálculo permite citar.
export const getCalculationAmounts = (calculation: BudgetCalculation) =>
  [calculation.withoutProducts, calculation.withProducts].flatMap((option) =>
    option ? [option.net, option.iva, option.final, option.hourlyNet] : []
  );

// Los importes de una opción guardada con la misma aritmética que
// formatBudgetForAI: el precio guardado es el final, con IVA.
export const getStoredOptionAmounts = (options: { price: number; iva: number }[]) =>
  options.flatMap(({ price, iva }) => {
    const final = Number(price) || 0;
    const net = final / (1 + (Number(iva) || 0) / 100);
    return [net, final - net, final].map((amount) => Number(amount.toFixed(2)));
  });

const CONTRIBUTIONS = [
  ["incidence_enabled", "incidence_contribution"],
  ["company_enabled", "company_contribution"],
  ["personal_enabled", "personal_contribution"],
] as const;

// Los insumos que ven el modelo y la UI, aportes incluidos: un campo que no se
// muestra es un campo que el modelo termina adivinando.
export const describeBudgetInputs = (values: BudgetFormValues) => ({
  visits: values.visits,
  visitType: values.visit_type,
  hoursPerVisit: values.hours_per_visit,
  employees: values.employees,
  nominalHour: values.nominal_hour,
  revenuePercent: values.revenue_percent,
  productsPrice: values.products_price,
  productsRevenuePercent: values.products_revenue_percent,
  transportationCost: values.transportation_cost,
  ivaPercent: values.iva,
  contributions: {
    incidence: values.incidence_enabled ? values.incidence_contribution : 0,
    company: values.company_enabled ? values.company_contribution : 0,
    personal: values.personal_enabled ? values.personal_contribution : 0,
  },
});

export const CHANGEABLE_FIELDS = [
  "visits", "visit_type", "hours_per_visit", "employees", "nominal_hour", "revenue_percent",
  "products_price", "products_revenue_percent", "transportation_cost", "iva",
  "incidence_enabled", "company_enabled", "personal_enabled",
  "incidence_contribution", "company_contribution", "personal_contribution",
] as const;

// Aplica cambios como el formulario, que recalcula solo el precio final. Un
// aporte habilitado con 0 % toma el default y el estimado de productos va en
// múltiplos de $ 500 (roundPrice es de agent-pricing.ts). changedFields
// compara con la base: un valor igual no cuenta y uno pisado queda a la vista.
export const applyBudgetChanges = (values: BudgetFormValues, changes: AgentBudgetChanges) => {
  const { estimateTransport, estimateProducts, ...fields } = changes;
  const next: BudgetFormValues = { ...values };
  Object.entries(fields).forEach(([key, value]) => {
    if (key !== "roundPrice" && value !== undefined && value !== null) (next as Record<string, unknown>)[key] = value;
  });
  CONTRIBUTIONS.forEach(([enabledKey, percentKey]) => {
    if (next[enabledKey] && !(Number(next[percentKey]) > 0)) {
      next[percentKey] = defaultBudgetValues[percentKey];
    }
  });
  const estimates = calculateEstimates(next);
  if (estimateTransport) next.transportation_cost = estimates.transportation_cost;
  if (estimateProducts) next.products_price = roundProductsPrice(estimates.products_price);
  next.price = Number(calculateBudgetTotals(next).totalFinalWithProducts.toFixed(2));

  const changedFields = CHANGEABLE_FIELDS.filter((key) => next[key] !== values[key]);
  return { values: next, changedFields };
};

// El margen de servicio que da un precio objetivo sin IVA y sin productos.
// Si el objetivo no cubre el costo, el margen queda en 0 y wasClamped avisa.
export const solveTargetPrice = (
  values: BudgetFormValues,
  target: { kind: "hourly" | "service"; amount: number }
) => {
  const totals = calculateBudgetTotals(values);
  const solve =
    target.kind === "hourly"
      ? calculateRevenuePercentForHourlyTarget
      : calculateRevenuePercentForServiceTarget;
  const result = solve(target.amount, totals.totalHours, totals.costBasisNoProducts);
  if (!result.canCalculate) return null;

  const solved = applyBudgetChanges(values, { revenue_percent: result.revenuePercent });
  return {
    revenuePercent: result.revenuePercent,
    wasClamped: result.wasClamped,
    minimumHourlyPrice: roundMoney(result.minimumHourlyPrice),
    minimumServicePrice: roundMoney(result.minimumServicePrice),
    values: solved.values,
  };
};
