import type { LucideIcon } from "lucide-react";
import { CalendarDays, Clock, ReceiptText, Users } from "lucide-react";

import type { DetailOption, DetailStats } from "@/components/budgets/budget-details/budget-detail-model";
import {
  formatBudgetDecimal,
  formatBudgetMoney,
  formatBudgetNumber,
} from "@/components/budgets/create-budget/budget-summary-model";

const Stat = ({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint: string }) => (
  <div className="rounded-xl bg-ops-surface-muted p-3">
    <span className="flex items-center gap-2 text-xs font-medium tracking-[0.04em] text-ops-text-muted uppercase">
      <Icon className="size-4 text-ops-bamboo" />
      {label}
    </span>
    <span className="mt-2 block text-xl font-semibold tabular-nums text-ops-text">{value}</span>
    <span className="mt-1 block text-xs text-ops-text-muted">{hint}</span>
  </div>
);

// Los cuatro números del servicio solo: precio, precio hora, horas y equipo.
export const BudgetDetailStats = ({ base, stats, withIva }: { base: DetailOption; stats: DetailStats; withIva: boolean }) => (
  <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
    <Stat
      hint="servicio sin productos"
      icon={ReceiptText}
      label={withIva ? "Precio mensual con IVA" : "Precio mensual sin IVA"}
      value={formatBudgetMoney(base.price)}
    />
    <Stat
      hint={withIva ? `con IVA ${formatBudgetNumber(base.ivaPct)}%` : "sin IVA"}
      icon={Clock}
      label="Precio hora"
      value={`$ ${formatBudgetDecimal(base.hourly)}`}
    />
    <Stat hint={stats.visitsHint} icon={CalendarDays} label="Horas al mes" value={`${formatBudgetNumber(base.totalHours, 1)} hs`} />
    <Stat
      hint={`hora nominal ${formatBudgetMoney(stats.nominalHour)}`}
      icon={Users}
      label="Equipo"
      value={`${stats.people} ${stats.people === 1 ? "persona" : "personas"}`}
    />
  </div>
);
