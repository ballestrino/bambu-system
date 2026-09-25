import { getStoredOptionAmounts } from "@/lib/agent/budget-calculation";
import { getStoredPrices } from "@/lib/agent/proposal-summary";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Presupuestos guardados con el mismo servicio: lo que busca
// findMatchingBudgets y el aviso de la propuesta de crear. Puro: la lectura
// está en data/agent/budgets.ts.
export const MATCHING_BUDGETS_LIMIT = 10;

export type MatchingService = {
  visit_type: "days" | "week" | "month";
  visits: number;
  hours_per_visit: number;
  employees: number;
  withProducts: boolean;
};

// La entrada de la tool, con los nombres de searchOfficialBudgets: sin
// empleadas es 1, y solo hasProducts true pide la opción con productos.
export const serviceFromInput = (input: {
  frequency: MatchingService["visit_type"];
  visits: number;
  hoursPerVisit: number;
  employees: number | null;
  hasProducts: boolean | null;
}): MatchingService => ({
  visit_type: input.frequency,
  visits: input.visits,
  hours_per_visit: input.hoursPerVisit,
  employees: input.employees ?? 1,
  withProducts: input.hasProducts === true,
});

// El servicio de lo que una propuesta de crear va a guardar.
export const serviceFromValues = (values: BudgetFormValues): MatchingService => ({
  visit_type: values.visit_type,
  visits: values.visits,
  hours_per_visit: values.hours_per_visit,
  employees: values.employees,
  withProducts: values.products_price > 0,
});

type MatchingBudgetRow = {
  id: string;
  slug: string;
  name: string;
  updatedAt: Date;
  budgetOptions: { has_products: boolean; price: number; iva: number }[];
  officialBudget: { status: string; currentVersion: number } | null;
};

// La lectura trae uno de más para saber si hay más. Los precios guardados de
// los que se muestran se pueden citar: las opciones guardadas son la fuente.
export const toMatchingBudgets = (found: MatchingBudgetRow[]) => {
  const budgets = found.slice(0, MATCHING_BUDGETS_LIMIT);
  return {
    total: budgets.length,
    truncated: found.length > budgets.length,
    rows: budgets.map((budget) => ({
      id: budget.id,
      slug: budget.slug,
      name: budget.name,
      official: budget.officialBudget
        ? { status: budget.officialBudget.status, version: budget.officialBudget.currentVersion }
        : null,
      updatedAt: budget.updatedAt.toISOString(),
      prices: getStoredPrices(budget),
    })),
    grounding: { amounts: budgets.flatMap((budget) => getStoredOptionAmounts(budget.budgetOptions)) },
  };
};

// Crear uno nuevo cuando ya hay guardados con el mismo servicio: puede ser un
// duplicado. Si la lectura trajo el de más, hay más de los que se cuentan.
export const sameServiceWarning = (found: { name: string }[]) => {
  if (!found.length) return null;
  const listed = found.slice(0, MATCHING_BUDGETS_LIMIT);
  const shown = listed.slice(0, 3).map(({ name }) => `“${name}”`).join(", ");
  const rest = listed.length - 3;
  const more = found.length > listed.length ? " y más" : rest > 0 ? ` y ${rest} más` : "";
  return `Ya hay presupuestos guardados con el mismo servicio: ${shown}${more}. Revisá que no sea un duplicado.`;
};
