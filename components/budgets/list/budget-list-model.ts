import {
  formatBudgetDecimal,
  formatBudgetMoney,
  formatBudgetNumber,
} from "@/components/budgets/create-budget/budget-summary-model";
import type { GeneratorBudgetListItem } from "@/components/budgets/interfaces/generator-budget";
import { calculateEffectiveVisits } from "@/lib/budget-calculations";

type ListOption = GeneratorBudgetListItem["budgetOptions"][number];

const dateFormat = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short", year: "numeric" });

// El precio guardado es el final con IVA: la lista muestra el neto.
const netPrice = (option: ListOption) => option.price / (1 + (option.iva || 0) / 100);

const serviceLabel = (option: ListOption) => {
  if (option.visit_type === "week") {
    return `${formatBudgetNumber(option.visits)} ${option.visits === 1 ? "vez" : "veces"} por semana · ${formatBudgetNumber(option.hours_per_visit)} hs`;
  }
  if (option.visit_type === "month") return `${formatBudgetNumber(option.visits)} por mes · ${formatBudgetNumber(option.hours_per_visit)} hs`;
  return `${formatBudgetNumber(option.visits)} días al mes · ${formatBudgetNumber(option.hours_per_visit)} hs`;
};

export const buildBudgetRow = (budget: GeneratorBudgetListItem) => {
  // Un presupuesto recién guardado entra a la lista sin sus opciones hasta que
  // la lista se vuelve a leer.
  const options = budget.budgetOptions ?? [];
  const base = options.find((option) => !option.has_products) ?? options[0];
  const withProducts = options.find((option) => option.has_products);
  const hours = base ? calculateEffectiveVisits(base.visits, base.visit_type) * base.hours_per_visit * base.employees : 0;

  return {
    categories: budget.budgetCategory ?? [],
    description: budget.description,
    hourly: base && hours > 0 ? `$ ${formatBudgetDecimal(netPrice(base) / hours)}` : "—",
    id: budget.id,
    margin: base ? `${formatBudgetNumber(base.revenue_percent, 1)}%` : "—",
    name: budget.name,
    official: budget.officialBudget ?? null,
    people: base ? `${base.employees} ${base.employees === 1 ? "persona" : "personas"}` : "",
    price: base ? formatBudgetMoney(netPrice(base)) : "—",
    productsPrice: withProducts && withProducts !== base ? formatBudgetMoney(netPrice(withProducts)) : null,
    service: base ? serviceLabel(base) : "Sin opciones",
    slug: budget.slug,
    updated: dateFormat.format(new Date(budget.updatedAt)),
  };
};

export type BudgetRow = ReturnType<typeof buildBudgetRow>;
