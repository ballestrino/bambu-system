import type { BudgetOption } from "@prisma/client";

import {
  buildBudgetSummary,
  type BudgetSummary,
  type BudgetSummarySegment,
} from "@/components/budgets/create-budget/budget-summary-model";
import { budgetOptionToFormValues } from "@/lib/agent/budget-calculation";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

export type DetailBudget = {
  name: string;
  description: string | null;
  budgetOptions: BudgetOption[];
};

export type DetailOption = {
  key: "base" | "products";
  summary: BudgetSummary;
  segments: BudgetSummarySegment[];
  price: number;
  hourly: number;
  productsCost: number;
};

const IVA_SEGMENT_CLASS = "bg-[#c4cbc1] dark:bg-[#4a5548]";

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

// El resumen del creador para una opción. Con IVA, el IVA es un tramo más y los
// porcentajes son sobre el precio con IVA.
export const buildDetailOption = (
  values: BudgetFormValues,
  key: DetailOption["key"],
  withIva: boolean
): DetailOption => {
  const summary = buildBudgetSummary(values, key === "products");
  const price = withIva ? summary.priceWithIva : summary.price;
  const parts = withIva
    ? [...summary.segments, { amount: summary.priceWithIva - summary.price, colorClass: IVA_SEGMENT_CLASS, key: "iva", label: "IVA", pct: "" }]
    : summary.segments;
  const segments = parts.map((part) => ({
    ...part,
    pct: price > 0 ? `${Math.round((part.amount / price) * 100)}%` : "0%",
  }));
  const ivaFactor = summary.price > 0 ? summary.priceWithIva / summary.price : 1;

  return {
    key,
    summary,
    segments,
    price,
    hourly: withIva ? summary.hourly * ivaFactor : summary.hourly,
    productsCost: Number(values.products_price) || 0,
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

export const formatDetailDate = (value: Date | string) =>
  new Date(value).toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" });
