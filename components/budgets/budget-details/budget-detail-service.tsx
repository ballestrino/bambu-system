import type { DetailFact } from "@/components/budgets/budget-details/budget-detail-model";
import { cn } from "@/lib/utils";

export const detailPanelClass =
  "flex flex-col gap-3.5 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-5";

// Los datos con los que se calculó el presupuesto, tal como se cargaron.
export const BudgetDetailService = ({ facts }: { facts: DetailFact[] }) => (
  <section className={detailPanelClass}>
    <h2 className="text-[17px] font-semibold text-ops-text">Datos del servicio</h2>
    <dl className="flex flex-col rounded-xl bg-ops-canvas">
      {facts.map((fact, index) => (
        <div className={cn("flex min-h-12 items-center gap-3 px-3.5 py-2", index > 0 && "border-t border-ops-border")} key={fact.label}>
          <dt className="w-[140px] flex-none text-[13.5px] text-ops-text-muted">{fact.label}</dt>
          <dd className="min-w-0 text-sm font-medium tabular-nums text-ops-text">{fact.value}</dd>
        </div>
      ))}
    </dl>
  </section>
);
