import type { BudgetSummaryRow } from "@/components/budgets/create-budget/budget-summary-model";
import { cn } from "@/lib/utils";

// Desglose del precio: lo usan el resumen de escritorio y la hoja del celular.
export const BudgetSummaryRows = ({ className, rows }: { className?: string; rows: BudgetSummaryRow[] }) => (
  <dl className={cn("flex flex-col", className)}>
    {rows.map((row) => (
      <div
        className={cn(
          "flex items-baseline justify-between gap-3 py-2 text-[13.5px] text-ops-text",
          (row.tone === "total" || row.tone === "final") && "border-t border-ops-border font-semibold",
          row.tone === "final" && "text-[15px]",
          row.tone === "gain" && "text-ops-bamboo-strong"
        )}
        key={row.key}
      >
        <dt className="min-w-0">
          {row.label}
          {row.hint ? <span className="ml-1 font-normal text-ops-text-muted">{row.hint}</span> : null}
        </dt>
        <dd className="whitespace-nowrap tabular-nums">{row.value}</dd>
      </div>
    ))}
  </dl>
);
