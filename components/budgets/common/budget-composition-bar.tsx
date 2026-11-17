import type { BudgetSummarySegment } from "@/components/budgets/create-budget/budget-summary-model";

// Composición del precio: qué parte se lleva cada costo. La usan el resumen del
// creador y las opciones de la página del presupuesto.
export const BudgetCompositionBar = ({ segments }: { segments: BudgetSummarySegment[] }) =>
  segments.length ? (
    <div className="flex flex-col gap-2.5">
      <div
        aria-label={`Composición del precio: ${segments.map((segment) => `${segment.label} ${segment.pct}`).join(", ")}`}
        className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
        role="img"
      >
        {segments.map((segment) => (
          <span className={segment.colorClass} key={segment.key} style={{ flex: `${segment.amount} 1 0` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
        {segments.map((segment) => (
          <span className="inline-flex items-center gap-1.5 text-xs text-ops-text-muted" key={segment.key}>
            <span className={`size-2 rounded-[2px] ${segment.colorClass}`} />
            {segment.label} <span className="tabular-nums">{segment.pct}</span>
          </span>
        ))}
      </div>
    </div>
  ) : null;
