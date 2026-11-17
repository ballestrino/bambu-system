import {
  formatVisits,
  VISIT_TYPE_LABELS,
  type DetailContributions,
  type DetailFact,
  type DetailStats,
} from "@/components/budgets/budget-details/budget-detail-model";
import { formatBudgetMoney, formatBudgetNumber } from "@/components/budgets/create-budget/budget-summary-model";
import { hasBse } from "@/lib/budget-bse";
import { calculateBudgetTotals } from "@/lib/budget-calculations";
import { readBudgetExtras } from "@/lib/budget-extras";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Números, datos y aportes del generador, desde los valores que carga el editor.

export const percentLabel = (value: unknown) => `${formatBudgetNumber(Number(value) || 0, 3)}%`;

export const statsFromValues = (values: BudgetFormValues): DetailStats => ({
  visitsHint: `${formatVisits(Number(values.visits) || 0, values.visit_type)} · ${formatBudgetNumber(Number(values.hours_per_visit) || 0)} hs`,
  people: Number(values.employees) || 0,
  nominalHour: Number(values.nominal_hour) || 0,
});

export const serviceFactsFromValues = (values: BudgetFormValues, productsValues: BudgetFormValues | null): DetailFact[] => {
  const extras = readBudgetExtras(values.extras);
  const productGain = productsValues ? ` · ${formatBudgetNumber(Number(productsValues.products_revenue_percent) || 0)}% productos` : "";

  return [
    { label: "Frecuencia", value: `${VISIT_TYPE_LABELS[values.visit_type] ?? "Visitas"} · ${formatVisits(Number(values.visits) || 0, values.visit_type)}` },
    { label: "Horas por visita", value: `${formatBudgetNumber(Number(values.hours_per_visit) || 0)} hs` },
    { label: "Empleados", value: String(Number(values.employees) || 0) },
    { label: "Hora nominal", value: formatBudgetMoney(Number(values.nominal_hour) || 0) },
    { label: "Transporte", value: `${formatBudgetMoney(Number(values.transportation_cost) || 0)} por mes` },
    {
      label: "Extras",
      value: extras.length
        ? extras.map((extra) => `${extra.name} · ${formatBudgetMoney(Number(extra.amount) || 0)}`).join(", ")
        : "Sin extras",
    },
    { label: "Ganancia", value: `${formatBudgetNumber(Number(values.revenue_percent) || 0)}% servicio${productGain}` },
  ];
};

// Los personales van dentro de la hora y el resto se suma al costo.
export const contributionsFromValues = (values: BudgetFormValues): DetailContributions => {
  const totals = calculateBudgetTotals(values);
  const bseSet = hasBse(values.bse_contribution);

  return {
    total: totals.totalContribsExtra,
    rows: [
      {
        key: "personal",
        label: "Aportes personales",
        hint: `${percentLabel(values.personal_contribution)} · ${values.personal_enabled ? "incluidos en la hora" : "se descuentan de la hora"}`,
        badge: values.personal_enabled ? "Incluido" : "Descontado",
        tone: values.personal_enabled ? "included" : "off",
        amount: totals.personalVal,
      },
      {
        key: "company",
        label: "Aportes patronales",
        hint: percentLabel(values.company_contribution),
        badge: values.company_enabled ? "Se suma" : "No aplica",
        tone: values.company_enabled ? "added" : "off",
        amount: totals.companyVal,
      },
      {
        key: "incidence",
        label: "Aguinaldo y salario vacacional",
        hint: percentLabel(values.incidence_contribution),
        badge: values.incidence_enabled ? "Se suma" : "No aplica",
        tone: values.incidence_enabled ? "added" : "off",
        amount: totals.incidenceVal,
      },
      {
        key: "bse",
        label: "BSE",
        hint: bseSet ? `${percentLabel(values.bse_contribution)} del sueldo nominal` : "presupuesto anterior al BSE",
        badge: bseSet ? "Se suma" : "Sin calcular",
        tone: bseSet ? "added" : "off",
        amount: totals.bseVal,
      },
    ],
  };
};
