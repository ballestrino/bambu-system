import {
  CircleDollarSign,
  HandCoins,
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import type { ComponentType } from "react";

export type FinanceSection =
  | "resumen"
  | "rentabilidad"
  | "cobros"
  | "costes"
  | "pagos";

type FinanceSectionItem = {
  id: FinanceSection;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

// The ids double as the legacy fragment names (#cobros, #costes, ...), so old
// bookmarks map onto ?seccion= without a translation table.
export const financeSections: readonly FinanceSectionItem[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "rentabilidad", label: "Rentabilidad", icon: TrendingUp },
  { id: "cobros", label: "Cobros", icon: CircleDollarSign },
  { id: "costes", label: "Costes", icon: ReceiptText },
  { id: "pagos", label: "Pagos", icon: HandCoins },
] as const;

export const DEFAULT_FINANCE_SECTION: FinanceSection = "resumen";

export const isFinanceSection = (value: unknown): value is FinanceSection =>
  financeSections.some((section) => section.id === value);

// Sections with two tables show one at a time. The view lives in ?vista= so a
// panel elsewhere (Resumen's "Ver todo") can open the right one; the first
// entry is the default.
export const financeSectionViews = {
  cobros: [
    { id: "cobros", label: "Cobros" },
    { id: "equipo", label: "Generado por empleada" },
  ],
  pagos: [
    { id: "empleadas", label: "Por empleada" },
    { id: "registrados", label: "Pagos registrados" },
  ],
} as const;

type FinanceViewSection = keyof typeof financeSectionViews;

export type FinanceSectionView<S extends FinanceViewSection> =
  (typeof financeSectionViews)[S][number]["id"];

export const resolveFinanceView = <S extends FinanceViewSection>(
  section: S,
  requested: string | null
): FinanceSectionView<S> => {
  const views: readonly { id: FinanceSectionView<S> }[] =
    financeSectionViews[section];
  return views.find((view) => view.id === requested)?.id ?? views[0].id;
};

export type FinanceSectionSelect = (
  section: FinanceSection,
  options?: { view?: string }
) => void;

// Which queries each section actually needs. If a section renders a component
// that receives X, X must be true here: a disabled query resolves to [], which
// renders as an empty list, not as an error.
//   - FinancialPaymentsTable / PaymentDialog need jobs.
//   - FinancialGeneratedPayTable reads names off occurrences, not employees.
//   - PayrollDialog / FinancialPayrollTable need employees, not jobs.
//   - CostDialog / CostsFilters need categories, employees and jobs, which is
//     why Resumen loads them too: its quick actions open those same dialogs.
// The month money queries (cobros, costes, pagos, ajustes) are never gated: they
// feed every section's summary and the PDF export, which runs from any tab.
export const financeSectionQueries = {
  resumen: {
    categories: true,
    employees: true,
    jobs: true,
    occurrences: true,
    profitability: true,
    trend: true,
  },
  rentabilidad: {
    categories: false,
    employees: false,
    jobs: false,
    occurrences: false,
    profitability: true,
    trend: false,
  },
  cobros: {
    categories: false,
    employees: false,
    jobs: true,
    occurrences: true,
    profitability: false,
    trend: false,
  },
  costes: {
    categories: true,
    employees: true,
    jobs: true,
    occurrences: false,
    profitability: false,
    trend: false,
  },
  pagos: {
    categories: false,
    employees: true,
    jobs: false,
    occurrences: true,
    profitability: false,
    trend: false,
  },
} as const satisfies Record<FinanceSection, Record<string, boolean>>;
