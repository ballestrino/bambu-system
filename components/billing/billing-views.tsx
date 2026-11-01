"use client";

import type { BillingView } from "@/lib/billing/billing-list-filters";
import { cn } from "@/lib/utils";

const VIEWS: { id: BillingView; label: string }[] = [
  { id: "draft", label: "Borrador" },
  { id: "issued", label: "Emitidas" },
  { id: "archived", label: "Archivadas" },
];

// Vistas Borrador, Emitidas y Archivadas (48) con cuántas muestran con los
// filtros puestos: subrayadas en escritorio y un conmutador en el teléfono.
export const BillingViews = ({
  counts,
  onChange,
  value,
}: {
  counts: Record<BillingView, number>;
  onChange: (view: BillingView) => void;
  value: BillingView;
}) => (
  <div
    aria-label="Vistas"
    className="grid grid-cols-3 gap-1 rounded-xl bg-ops-surface-muted p-1 md:flex md:rounded-none md:border-b md:border-ops-border md:bg-transparent md:p-0"
    role="tablist"
  >
    {VIEWS.map((view) => {
      const active = view.id === value;
      return (
        <button
          aria-selected={active}
          className={cn(
            "flex h-10 items-center justify-center gap-1.5 rounded-[9px] px-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none md:-mb-px md:h-11 md:gap-2 md:rounded-none md:border-b-2 md:px-3.5 md:text-[15px]",
            active
              ? "bg-ops-surface font-semibold text-ops-text shadow-sm md:border-ops-bamboo-strong md:bg-transparent md:shadow-none"
              : "font-medium text-ops-text-muted md:border-transparent hover:text-ops-text"
          )}
          key={view.id}
          onClick={() => onChange(view.id)}
          role="tab"
          type="button"
        >
          {view.label}
          <span className="rounded-full bg-ops-surface-muted px-[7px] py-0.5 text-xs font-semibold tabular-nums text-ops-text">
            {counts[view.id]}
          </span>
        </button>
      );
    })}
  </div>
);
