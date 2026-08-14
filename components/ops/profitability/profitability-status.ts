import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  OctagonAlert,
  ShieldQuestion,
} from "lucide-react";

import type { ProfitabilitySeverity } from "@/lib/ops/profitability";

export const profitabilityStatus = {
  HEALTHY: {
    className: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
    icon: CheckCircle2,
    label: "En objetivo",
  },
  LOW_PROFIT: {
    className: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
    icon: AlertTriangle,
    label: "Ganancia baja",
  },
  LOSS: {
    className: "border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200",
    icon: CircleAlert,
    label: "Con pérdida",
  },
  CRITICAL_LOSS: {
    className: "border-red-500 bg-red-100 text-red-950 dark:border-red-400/60 dark:bg-red-500/25 dark:text-red-100",
    icon: OctagonAlert,
    label: "Pérdida crítica",
  },
  INCOMPLETE: {
    className: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
    icon: ShieldQuestion,
    label: "Datos incompletos",
  },
  NO_ACTIVITY: {
    className: "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
    icon: CircleDashed,
    label: "Sin actividad",
  },
} satisfies Record<ProfitabilitySeverity, {
  className: string;
  icon: typeof CheckCircle2;
  label: string;
}>;

export const profitabilityNeedsAttention = (severity: ProfitabilitySeverity) =>
  ["LOW_PROFIT", "LOSS", "CRITICAL_LOSS", "INCOMPLETE"].includes(severity);

export const formatProfitabilityMoney = (amount: number) =>
  new Intl.NumberFormat("es-UY", {
    currency: "UYU",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
