import { formatVisits } from "@/components/budgets/budget-details/budget-detail-model";
import { formatBudgetMoney, formatBudgetNumber } from "@/components/budgets/create-budget/budget-summary-model";
import { readBudgetExtras } from "@/lib/budget-extras";
import { cn } from "@/lib/utils";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

export const detailPanelClass =
  "flex flex-col gap-3.5 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-5";

const VISIT_TYPE_LABELS: Record<string, string> = { week: "Semanal", month: "Mensual", days: "Por día" };

const Fact = ({ label, children, first }: { label: string; children: React.ReactNode; first?: boolean }) => (
  <div className={cn("flex min-h-12 items-center gap-3 px-3.5 py-2", !first && "border-t border-ops-border")}>
    <dt className="w-[140px] flex-none text-[13.5px] text-ops-text-muted">{label}</dt>
    <dd className="min-w-0 text-sm font-medium tabular-nums text-ops-text">{children}</dd>
  </div>
);

// Los datos con los que se calculó el presupuesto, tal como se cargaron.
export const BudgetDetailService = ({ values, productsValues }: { values: BudgetFormValues; productsValues: BudgetFormValues | null }) => {
  const extras = readBudgetExtras(values.extras);
  const visits = Number(values.visits) || 0;
  const productGain = productsValues ? Number(productsValues.products_revenue_percent) || 0 : null;

  return (
    <section className={detailPanelClass}>
      <h2 className="text-[17px] font-semibold text-ops-text">Datos del servicio</h2>
      <dl className="flex flex-col rounded-xl bg-ops-canvas">
        <Fact first label="Frecuencia">
          {VISIT_TYPE_LABELS[values.visit_type] ?? "Visitas"} · {formatVisits(visits, values.visit_type)}
        </Fact>
        <Fact label="Horas por visita">{formatBudgetNumber(Number(values.hours_per_visit) || 0)} hs</Fact>
        <Fact label="Empleados">{Number(values.employees) || 0}</Fact>
        <Fact label="Hora nominal">{formatBudgetMoney(Number(values.nominal_hour) || 0)}</Fact>
        <Fact label="Transporte">{formatBudgetMoney(Number(values.transportation_cost) || 0)} por mes</Fact>
        <Fact label="Extras">
          {extras.length
            ? extras.map((extra) => `${extra.name} · ${formatBudgetMoney(Number(extra.amount) || 0)}`).join(", ")
            : "Sin extras"}
        </Fact>
        <Fact label="Ganancia">
          {formatBudgetNumber(Number(values.revenue_percent) || 0)}% servicio
          {productGain !== null ? ` · ${formatBudgetNumber(productGain)}% productos` : null}
        </Fact>
      </dl>
    </section>
  );
};
