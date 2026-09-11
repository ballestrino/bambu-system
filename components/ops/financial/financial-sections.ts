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

// Which queries each section actually needs. If a section renders a component
// that receives X, X must be true here: a disabled query resolves to [], which
// renders as an empty list, not as an error.
//   - PaymentsList / PaymentDialog need jobs.
//   - EmployeeGeneratedPayPanel reads names off occurrences, not employees.
//   - PayrollDialog / PayrollRowsPanel need employees, not jobs.
//   - CostDialog / CostsFilters need categories, employees and jobs.
// The month money queries (cobros, costes, pagos, ajustes) are never gated: they
// feed every section's summary and the PDF export, which runs from any tab.
export const financeSectionQueries = {
  resumen: {
    categories: false,
    employees: false,
    jobs: true,
    occurrences: true,
    profitability: true,
  },
  rentabilidad: {
    categories: false,
    employees: false,
    jobs: false,
    occurrences: false,
    profitability: true,
  },
  cobros: {
    categories: false,
    employees: false,
    jobs: true,
    occurrences: true,
    profitability: false,
  },
  costes: {
    categories: true,
    employees: true,
    jobs: true,
    occurrences: false,
    profitability: false,
  },
  pagos: {
    categories: false,
    employees: true,
    jobs: false,
    occurrences: true,
    profitability: false,
  },
} as const satisfies Record<FinanceSection, Record<string, boolean>>;
