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
