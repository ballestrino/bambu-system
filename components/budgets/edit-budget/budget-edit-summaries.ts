import {
  formatBudgetMoney,
  formatBudgetNumber,
} from "@/components/budgets/create-budget/budget-summary-model";
import type { CreatorStepId } from "@/components/budgets/create-budget/creator-steps";
import { sumBudgetExtras } from "@/lib/budget-extras";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type Values = Partial<Record<keyof BudgetFormValues, unknown>>;

const FREQUENCY: Record<string, string> = { days: "Por día", month: "Mensual", week: "Semanal" };

const contribution = (label: string, enabled: unknown, percent: unknown) =>
  enabled ? `${label} ${formatBudgetNumber(Number(percent) || 0, 3)}%` : `${label} apagado`;

// Una línea por sección cerrada: lo que está guardado o escrito, sin abrirla.
export const summarizeSection = (step: CreatorStepId, values: Values, slug: string) => {
  switch (step) {
    case "detalle":
      return `${String(values.name ?? "").trim() || "Sin nombre"} · /${slug}`;
    case "equipo": {
      const people = Number(values.employees) || 1;
      return [
        FREQUENCY[String(values.visit_type)] ?? "",
        `${formatBudgetNumber(Number(values.visits) || 0)} visitas`,
        `${formatBudgetNumber(Number(values.hours_per_visit) || 0)} hs`,
        `${people} ${people === 1 ? "persona" : "personas"}`,
        formatBudgetMoney(Number(values.nominal_hour) || 0),
      ].join(" · ");
    }
    case "costos": {
      const extras = Array.isArray(values.extras) ? values.extras.filter((extra) => Number(extra?.amount) > 0) : [];
      const parts = [`Transporte ${formatBudgetMoney(Number(values.transportation_cost) || 0)}`];
      if (extras.length) parts.push(`${extras.length} ${extras.length === 1 ? "extra" : "extras"} ${formatBudgetMoney(sumBudgetExtras(extras))}`);
      parts.push(Number(values.products_price) > 0 ? `productos ${formatBudgetMoney(Number(values.products_price))}` : "sin productos");
      return parts.join(" · ");
    }
    case "precio":
      return `Ganancia ${formatBudgetNumber(Number(values.revenue_percent) || 0)}% · IVA ${formatBudgetNumber(Number(values.iva) || 0)}%`;
    case "aportes":
      return [
        contribution("Personales", values.personal_enabled, values.personal_contribution),
        contribution("patronales", values.company_enabled, values.company_contribution),
        contribution("aguinaldo", values.incidence_enabled, values.incidence_contribution),
      ].join(" · ");
  }
};
