import type { LucideIcon } from "lucide-react";
import { CalendarDays, Clock, ReceiptText, Users } from "lucide-react";

import { formatVisits, type DetailOption } from "@/components/budgets/budget-details/budget-detail-model";
import {
  formatBudgetDecimal,
  formatBudgetMoney,
  formatBudgetNumber,
} from "@/components/budgets/create-budget/budget-summary-model";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

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
export const BudgetDetailStats = ({ base, values, withIva }: { base: DetailOption; values: BudgetFormValues; withIva: boolean }) => {
  const people = Number(values.employees) || 0;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
      <Stat
        hint="servicio sin productos"
        icon={ReceiptText}
        label={withIva ? "Precio mensual con IVA" : "Precio mensual sin IVA"}
        value={formatBudgetMoney(base.price)}
      />
      <Stat
        hint={withIva ? `con IVA ${formatBudgetNumber(base.summary.ivaPct)}%` : "sin IVA"}
        icon={Clock}
        label="Precio hora"
        value={`$ ${formatBudgetDecimal(base.hourly)}`}
      />
      <Stat
        hint={`${formatVisits(Number(values.visits) || 0, values.visit_type)} · ${formatBudgetNumber(Number(values.hours_per_visit) || 0)} hs`}
        icon={CalendarDays}
        label="Horas al mes"
        value={`${formatBudgetNumber(base.summary.totalHours, 1)} hs`}
      />
      <Stat
        hint={`hora nominal ${formatBudgetMoney(Number(values.nominal_hour) || 0)}`}
        icon={Users}
        label="Equipo"
        value={`${people} ${people === 1 ? "persona" : "personas"}`}
      />
    </div>
  );
};
