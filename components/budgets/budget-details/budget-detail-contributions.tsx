import { detailPanelClass } from "@/components/budgets/budget-details/budget-detail-service";
import { formatBudgetMoney, formatBudgetNumber } from "@/components/budgets/create-budget/budget-summary-model";
import { hasBse } from "@/lib/budget-bse";
import { calculateBudgetTotals } from "@/lib/budget-calculations";
import { cn } from "@/lib/utils";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type Tone = "included" | "added" | "off";

const TONE_CLASSES: Record<Tone, string> = {
  included: "bg-ops-surface-muted text-ops-text-muted",
  added: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  off: "border border-ops-border text-ops-text-muted",
};

type ContributionRowProps = { label: string; hint: string; badge: string; tone: Tone; amount: number; first?: boolean };

const ContributionRow = ({ label, hint, badge, tone, amount, first }: ContributionRowProps) => (
  <div className={cn("flex min-h-[52px] items-center gap-3 px-3.5 py-1.5", !first && "border-t border-ops-border")}>
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="text-sm font-medium text-ops-text">{label}</span>
      <span className="text-[12.5px] text-ops-text-muted">{hint}</span>
    </div>
    <span className={cn("inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold whitespace-nowrap", TONE_CLASSES[tone])}>
      {badge}
    </span>
    <span className="w-[84px] text-right text-sm font-semibold tabular-nums text-ops-text">{formatBudgetMoney(amount)}</span>
  </div>
);

const pct = (value: unknown) => `${formatBudgetNumber(Number(value) || 0, 3)}%`;

// Aportes y cargas del servicio: los personales van dentro de la hora y el
// resto se suma al costo, igual que en el cálculo.
export const BudgetDetailContributions = ({ values }: { values: BudgetFormValues }) => {
  const totals = calculateBudgetTotals(values);
  const bseSet = hasBse(values.bse_contribution);

  return (
    <section className={detailPanelClass}>
      <h2 className="text-[17px] font-semibold text-ops-text">Aportes y cargas</h2>
      <div className="flex flex-col rounded-xl bg-ops-canvas">
        <ContributionRow
          amount={totals.personalVal}
          badge={values.personal_enabled ? "Incluido" : "Descontado"}
          first
          hint={`${pct(values.personal_contribution)} · ${values.personal_enabled ? "incluidos en la hora" : "se descuentan de la hora"}`}
          label="Aportes personales"
          tone={values.personal_enabled ? "included" : "off"}
        />
        <ContributionRow
          amount={totals.companyVal}
          badge={values.company_enabled ? "Se suma" : "No aplica"}
          hint={pct(values.company_contribution)}
          label="Aportes patronales"
          tone={values.company_enabled ? "added" : "off"}
        />
        <ContributionRow
          amount={totals.incidenceVal}
          badge={values.incidence_enabled ? "Se suma" : "No aplica"}
          hint={pct(values.incidence_contribution)}
          label="Aguinaldo y salario vacacional"
          tone={values.incidence_enabled ? "added" : "off"}
        />
        <ContributionRow
          amount={totals.bseVal}
          badge={bseSet ? "Se suma" : "Sin calcular"}
          hint={bseSet ? `${pct(values.bse_contribution)} del sueldo nominal` : "presupuesto anterior al BSE"}
          label="BSE"
          tone={bseSet ? "added" : "off"}
        />
        <div className="flex min-h-12 items-center justify-between gap-3 border-t border-ops-border px-3.5">
          <span className="text-[13.5px] font-semibold text-ops-text">Costo extra por cargas</span>
          <span className="text-sm font-bold tabular-nums text-ops-text">{formatBudgetMoney(totals.totalContribsExtra)}</span>
        </div>
      </div>
    </section>
  );
};
