import type { BudgetCalculation } from "@/lib/agent/budget-calculation";
import { calculationProfit } from "@/lib/agent/budget-profit";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Una columna de la tabla comparativa (feature 71): los números de un
// cálculo ya hecho, ordenados para compararlos. Puro, con prueba.

export type ComparisonBase = {
  source: "context" | "form" | "budget" | "defaults";
  name: string;
  slug: string | null;
};

// El % de ganancia es sobre el precio sin IVA; el margen del presupuesto es
// sobre el costo. Con un decimal: es para comparar, no para cotizar.
const profitPercent = (profit: number, net: number) =>
  net > 0 ? Math.round((profit / net) * 1000) / 10 : null;

const option = (prices: BudgetCalculation["withoutProducts"], profit: number, cost: number) => ({
  net: prices.net,
  final: prices.final,
  hourlyNet: prices.hourlyNet,
  cost,
  profit,
  profitPercent: profitPercent(profit, prices.net),
});

export type ComparisonOption = ReturnType<typeof option>;

export const buildComparisonColumn = ({
  label,
  base,
  values,
  calculation,
  changedFields,
}: {
  label: string;
  base: ComparisonBase;
  values: BudgetFormValues;
  calculation: BudgetCalculation;
  changedFields: readonly string[];
}) => {
  const profit = calculationProfit(calculation);
  const productsCost = Math.round((calculation.serviceCost + calculation.products) * 100) / 100;
  return {
    label,
    base,
    changedFields: [...changedFields],
    visits: values.visits,
    visitType: values.visit_type,
    hoursPerVisit: values.hours_per_visit,
    employees: values.employees,
    totalHours: calculation.totalHours,
    laborCost: calculation.laborCost,
    contributions: calculation.contributions,
    transport: calculation.transport,
    extras: calculation.extras,
    products: calculation.products,
    revenuePercent: calculation.revenuePercent,
    withoutProducts: option(calculation.withoutProducts, profit.withoutProducts, calculation.serviceCost),
    // Sin productos, la opción con productos es la misma que sin.
    withProducts: calculation.withProducts
      ? option(calculation.withProducts, profit.withProducts ?? 0, productsCost)
      : null,
  };
};

export type ComparisonColumn = ReturnType<typeof buildComparisonColumn>;

export type ComparisonPriceOption = "without" | "with";

export const pickComparisonOption = (column: ComparisonColumn, priceOption: ComparisonPriceOption) =>
  (priceOption === "with" && column.withProducts) || column.withoutProducts;
