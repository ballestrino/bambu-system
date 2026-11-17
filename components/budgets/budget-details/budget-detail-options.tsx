"use client";

import { BudgetCompositionBar } from "@/components/budgets/common/budget-composition-bar";
import type { DetailOption } from "@/components/budgets/budget-details/budget-detail-model";
import { formatBudgetDecimal, formatBudgetMoney } from "@/components/budgets/create-budget/budget-summary-model";
import { BudgetSummaryRows } from "@/components/budgets/create-budget/budget-summary-rows";
import { CreatorSegmented } from "@/components/budgets/create-budget/creator-ui";

export type IvaView = "without" | "with";

const IVA_VIEWS: { label: string; value: IvaView }[] = [
  { label: "Sin IVA", value: "without" },
  { label: "Con IVA", value: "with" },
];

const OPTION_COPY = {
  base: { badge: "1", title: "Sin productos" },
  products: { badge: "2", title: "Con productos" },
} as const;

const OptionCard = ({ option, withIva }: { option: DetailOption; withIva: boolean }) => {
  const copy = OPTION_COPY[option.key];
  const caption =
    option.key === "products"
      ? `Servicio + ${formatBudgetMoney(option.productsCost)} en productos`
      : "Solo el servicio";

  return (
    <article className="flex flex-col gap-4 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[10px] bg-ops-bamboo-soft text-[13px] font-bold text-ops-bamboo-strong">
            {copy.badge}
          </span>
          <h3 className="text-base font-semibold text-ops-text">{copy.title}</h3>
        </div>
        <span className="text-[12.5px] text-ops-text-muted">{caption}</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-ops-canvas p-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[12.5px] text-ops-text-muted">{withIva ? "Precio mensual con IVA" : "Precio mensual sin IVA"}</span>
          <span className="text-[32px] leading-[1.1] font-semibold tracking-tight tabular-nums text-ops-text">
            {formatBudgetMoney(option.price)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[12.5px] text-ops-text-muted">Precio hora</span>
          <span className="text-[17px] font-semibold tabular-nums text-ops-text">$ {formatBudgetDecimal(option.hourly)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-medium tracking-[0.04em] text-ops-text-muted uppercase">Qué paga el precio</span>
        <BudgetCompositionBar segments={option.segments} />
      </div>
      <BudgetSummaryRows rows={option.rows} />
    </article>
  );
};

type BudgetDetailOptionsProps = {
  options: DetailOption[];
  ivaView: IvaView;
  onIvaViewChange: (view: IvaView) => void;
};

// Las opciones del presupuesto lado a lado, con la composición de cada precio.
export const BudgetDetailOptions = ({ options, ivaView, onIvaViewChange }: BudgetDetailOptionsProps) => (
  <section className="flex flex-col gap-3.5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-semibold text-ops-text">Opciones del presupuesto</h2>
        <p className="text-[13.5px] text-ops-text-muted">
          {options.length > 1 ? "El mismo servicio, solo o con productos. Precios por mes." : "Precio por mes del servicio."}
        </p>
      </div>
      <CreatorSegmented label="Mostrar precios" onChange={onIvaViewChange} options={IVA_VIEWS} value={ivaView} />
    </div>
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
      {options.map((option) => (
        <OptionCard key={option.key} option={option} withIva={ivaView === "with"} />
      ))}
    </div>
  </section>
);
