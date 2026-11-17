import type {
  DetailContribution,
  DetailContributions,
  DetailContributionTone,
} from "@/components/budgets/budget-details/budget-detail-model";
import { detailPanelClass } from "@/components/budgets/budget-details/budget-detail-service";
import { formatBudgetMoney } from "@/components/budgets/create-budget/budget-summary-model";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<DetailContributionTone, string> = {
  included: "bg-ops-surface-muted text-ops-text-muted",
  added: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  off: "border border-ops-border text-ops-text-muted",
};

const ContributionRow = ({ row, first }: { row: DetailContribution; first: boolean }) => (
  <div className={cn("flex min-h-[52px] items-center gap-3 px-3.5 py-1.5", !first && "border-t border-ops-border")}>
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="text-sm font-medium text-ops-text">{row.label}</span>
      <span className="text-[12.5px] text-ops-text-muted">{row.hint}</span>
    </div>
    <span className={cn("inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold whitespace-nowrap", TONE_CLASSES[row.tone])}>
      {row.badge}
    </span>
    <span className="w-[84px] text-right text-sm font-semibold tabular-nums text-ops-text">{formatBudgetMoney(row.amount)}</span>
  </div>
);

// Aportes y cargas: los personales van dentro de la hora y el resto se suma al costo.
export const BudgetDetailContributions = ({ data }: { data: DetailContributions }) => (
  <section className={detailPanelClass}>
    <h2 className="text-[17px] font-semibold text-ops-text">Aportes y cargas</h2>
    <div className="flex flex-col rounded-xl bg-ops-canvas">
      {data.rows.map((row, index) => (
        <ContributionRow first={index === 0} key={row.key} row={row} />
      ))}
      <div className="flex min-h-12 items-center justify-between gap-3 border-t border-ops-border px-3.5">
        <span className="text-[13.5px] font-semibold text-ops-text">Costo extra por cargas</span>
        <span className="text-sm font-bold tabular-nums text-ops-text">{formatBudgetMoney(data.total)}</span>
      </div>
    </div>
  </section>
);
