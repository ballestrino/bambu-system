import {
  CHANGEABLE_FIELDS,
  getCalculationAmounts,
  getStoredOptionAmounts,
  type BudgetCalculation,
  type BudgetOptionRow,
} from "@/lib/agent/budget-calculation";
import type { ProposalChange, ProposalSummary, StoredOptionPrice } from "@/lib/agent/proposals";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Piezas del resumen que muestra la tarjeta de una propuesta: qué cambia,
// los precios guardados y los avisos. Puro.
export type ProposalBudget = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  userId: string;
  updatedAt: Date;
  budgetOptions: (BudgetOptionRow & { _count?: { sourcedJobs: number } })[];
  budgetCategory: { id: string }[];
  officialBudget: { id: string; status: string; currentVersion: number } | null;
};

export const FIELD_LABELS: Record<"name" | "description" | (typeof CHANGEABLE_FIELDS)[number], string> = {
  name: "Nombre",
  description: "Descripción",
  visits: "Visitas",
  visit_type: "Frecuencia",
  hours_per_visit: "Horas por visita",
  employees: "Empleadas",
  nominal_hour: "Hora nominal",
  revenue_percent: "Margen del servicio",
  products_price: "Productos",
  products_revenue_percent: "Margen de productos",
  transportation_cost: "Transporte",
  iva: "IVA",
  incidence_enabled: "Incidencia",
  company_enabled: "Aportes patronales",
  personal_enabled: "Aportes personales",
  incidence_contribution: "Incidencia (%)",
  company_contribution: "Aportes patronales (%)",
  personal_contribution: "Aportes personales (%)",
};

const DIFF_FIELDS = ["name", "description", ...CHANGEABLE_FIELDS] as const;

// Una descripción vacía y una ausente son lo mismo.
const comparable = (value: string | number | boolean | undefined) =>
  value === undefined || value === "" ? null : value;

export const describeChanges = (before: BudgetFormValues, after: BudgetFormValues): ProposalChange[] =>
  DIFF_FIELDS.flatMap((field) => {
    const from = comparable(before[field]);
    const to = comparable(after[field]);
    return from === to ? [] : [{ field, label: FIELD_LABELS[field], before: from, after: to }];
  });

// Las opciones guardadas, sin productos primero: son los precios vigentes.
export const getStoredPrices = (budget: {
  budgetOptions: { has_products: boolean; price: number; iva: number }[];
}): StoredOptionPrice[] =>
  [...budget.budgetOptions]
    .sort((a, b) => Number(a.has_products) - Number(b.has_products))
    .map((option) => {
      const [net, iva, final] = getStoredOptionAmounts([option]);
      return { hasProducts: option.has_products, net, iva, final };
    });

// Los importes que una propuesta deja citar: exactamente los de su tarjeta
// (precios guardados, antes y después).
export const getSummaryAmounts = (summary: ProposalSummary) => [
  ...summary.stored.flatMap((option) => [option.net, option.iva, option.final]),
  ...(summary.before ? getCalculationAmounts(summary.before) : []),
  ...(summary.after ? getCalculationAmounts(summary.after) : []),
];

// Un precio guardado que no sale de sus propios insumos (constantes viejas).
export const hasPriceDrift = (budget: ProposalBudget, calculation: BudgetCalculation) =>
  budget.budgetOptions.some((option) => {
    const expected = option.has_products
      ? calculation.withProducts?.final
      : calculation.withoutProducts.final;
    return expected === undefined || Math.abs(Number(option.price) - expected) > 0.5;
  });

// updateBudget borra y recrea las opciones: un trabajo que apuntaba a una
// queda sin esa opción (SET NULL) y sigue con su copia de precios.
export const recreatedOptionsWarning = (budget: ProposalBudget) => {
  const linked = budget.budgetOptions.reduce(
    (total, option) => total + (option._count?.sourcedJobs ?? 0),
    0
  );
  if (!linked) return "Guardar recrea las opciones del presupuesto con ids nuevos.";
  const jobs =
    linked === 1
      ? "1 trabajo vinculado a una opción pierde ese vínculo y conserva"
      : `${linked} trabajos vinculados a una opción pierden ese vínculo y conservan`;
  return `Guardar recrea las opciones con ids nuevos: ${jobs} su copia de precios.`;
};

export const officialVersionWarning = ({ officialBudget: official }: ProposalBudget) =>
  official?.status === "ACTIVE"
    ? `Publica automáticamente la versión oficial ${official.currentVersion + 1} (hoy rige la ${official.currentVersion}): el precio de lista cambia al confirmar.`
    : null;

export const productsWarning = (before: BudgetFormValues, after: BudgetFormValues) => {
  if (before.products_price > 0 && after.products_price === 0) {
    return "Se elimina la opción con productos.";
  }
  if (before.products_price === 0 && after.products_price > 0) {
    return "Se agrega la opción con productos.";
  }
  return null;
};

export const onlyText = (warnings: (string | null)[]) =>
  warnings.filter((warning): warning is string => Boolean(warning));
