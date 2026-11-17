import type { BudgetOption } from "@prisma/client";

import {
  buildBudgetSummary,
  type BudgetSummaryRow,
  type BudgetSummarySegment,
} from "@/components/budgets/create-budget/budget-summary-model";
import { budgetOptionToFormValues } from "@/lib/agent/budget-calculation";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Lo que dibujan las piezas del detalle. El generador lo arma con el cálculo
// del creador; el oficial, con los valores que guardó su versión.
export type DetailOption = {
  key: "base" | "products";
  rows: BudgetSummaryRow[];
  segments: BudgetSummarySegment[];
  price: number;
  hourly: number;
  productsCost: number;
  ivaPct: number;
  totalHours: number;
};

export type DetailStats = { visitsHint: string; people: number; nominalHour: number };

export type DetailFact = { label: string; value: string };

export type DetailContributionTone = "included" | "added" | "off";

export type DetailContribution = {
  key: string;
  label: string;
  hint: string;
  badge: string;
  tone: DetailContributionTone;
  amount: number;
};

export type DetailContributions = { rows: DetailContribution[]; total: number };

export type DetailBudget = {
  name: string;
  description: string | null;
  budgetOptions: BudgetOption[];
};

export const IVA_SEGMENT_CLASS = "bg-[#c4cbc1] dark:bg-[#4a5548]";

// Con IVA, el IVA es un tramo más y los porcentajes son sobre el precio con IVA.
export const withIvaSegment = (segments: BudgetSummarySegment[], ivaAmount: number, withIva: boolean) => {
  const parts = withIva
    ? [...segments, { amount: ivaAmount, colorClass: IVA_SEGMENT_CLASS, key: "iva", label: "IVA", pct: "" }]
    : segments;
  const total = parts.reduce((sum, part) => sum + part.amount, 0);
  return parts.map((part) => ({
    ...part,
    pct: total > 0 ? `${Math.round((part.amount / total) * 100)}%` : "0%",
  }));
};

// La opción sin productos y la con productos. Un presupuesto que solo guardó la
// de productos muestra igual el servicio solo, calculado desde ella.
export const pickBudgetOptions = (options: BudgetOption[]) => {
  const withProducts = options.find((option) => option.has_products && Number(option.products_price) > 0) ?? null;
  const base = options.find((option) => !option.has_products) ?? withProducts ?? options[0] ?? null;
  return { base, withProducts };
};

// Los mismos valores que carga el editor: aporte en 0 = deshabilitado, IVA efectivo.
export const detailOptionValues = (budget: DetailBudget, option: BudgetOption): BudgetFormValues =>
  budgetOptionToFormValues({ name: budget.name, description: budget.description, budgetOptions: [option] });

// El resumen del creador para una opción del generador.
export const buildDetailOption = (
  values: BudgetFormValues,
  key: DetailOption["key"],
  withIva: boolean
): DetailOption => {
  const summary = buildBudgetSummary(values, key === "products");
  const ivaFactor = summary.price > 0 ? summary.priceWithIva / summary.price : 1;

  return {
    key,
    rows: summary.rows,
    segments: withIvaSegment(summary.segments, summary.priceWithIva - summary.price, withIva),
    price: withIva ? summary.priceWithIva : summary.price,
    hourly: withIva ? summary.hourly * ivaFactor : summary.hourly,
    productsCost: Number(values.products_price) || 0,
    ivaPct: summary.ivaPct,
    totalHours: summary.totalHours,
  };
};

const VISIT_LABELS: Record<string, [string, string]> = {
  week: ["vez por semana", "veces por semana"],
  month: ["vez al mes", "veces al mes"],
  days: ["día al mes", "días al mes"],
};

export const formatVisits = (visits: number, visitType: string) => {
  const [one, many] = VISIT_LABELS[visitType] ?? VISIT_LABELS.week;
  return `${visits} ${visits === 1 ? one : many}`;
};

export const VISIT_TYPE_LABELS: Record<string, string> = { week: "Semanal", month: "Mensual", days: "Por día" };

export const formatDetailDate = (value: Date | string) =>
  new Date(value).toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" });
