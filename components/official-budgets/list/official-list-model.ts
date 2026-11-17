import { formatVisits } from "@/components/budgets/budget-details/budget-detail-model";
import {
  formatBudgetDecimal,
  formatBudgetMoney,
  formatBudgetNumber,
} from "@/components/budgets/create-budget/budget-summary-model";
import { pickOfficialOptions } from "@/components/official-budgets/official-budget-model";
import type { OfficialBudgetRowDto } from "@/components/official-budgets/types";

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" });

// Lo que muestra cada fila: los precios de la versión vigente, sin productos
// primero y con productos debajo.
export const buildOfficialRow = (budget: OfficialBudgetRowDto) => {
  const { base, products, first } = pickOfficialOptions(budget.options);
  const main = base ?? first;
  const people = main?.employees ?? 0;

  return {
    id: budget.id,
    name: budget.sourceBudgetName,
    href: `/dashboard/official-budgets/${budget.id}`,
    active: budget.status === "ACTIVE",
    linked: Boolean(budget.sourceBudget),
    service: main ? `${formatVisits(main.visits, main.visitType)} · ${formatBudgetNumber(main.hoursPerVisit)} hs` : "Sin opciones",
    people: `${people} ${people === 1 ? "persona" : "personas"}`,
    price: main ? formatBudgetMoney(main.netPrice) : "–",
    productsPrice: base && products ? formatBudgetMoney(products.netPrice) : null,
    hourly: main ? `$ ${formatBudgetDecimal(main.hourlyPrice)}` : "–",
    version: `v${budget.currentVersion}`,
    versionDate: shortDate(budget.versionPublishedAt),
  };
};

export type OfficialRow = ReturnType<typeof buildOfficialRow>;
