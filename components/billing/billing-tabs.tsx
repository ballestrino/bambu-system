"use client";

import { cn } from "@/lib/utils";

export type BillingTab = "draft" | "issued";

// Pestañas "Borrador N/M" y "Emitidas N": subrayadas en escritorio y un
// conmutador en el teléfono.
export const BillingTabs = ({
  draftLabel,
  issuedCount,
  onChange,
  value,
}: {
  draftLabel: string;
  issuedCount: number;
  onChange: (tab: BillingTab) => void;
  value: BillingTab;
}) => {
  const tabs = [
    { count: draftLabel, id: "draft" as const, label: "Borrador" },
    { count: String(issuedCount), id: "issued" as const, label: "Emitidas" },
  ];
  return (
    <div
      aria-label="Vistas"
      className="grid grid-cols-2 gap-1 rounded-xl bg-ops-surface-muted p-1 md:flex md:rounded-none md:border-b md:border-ops-border md:bg-transparent md:p-0"
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            aria-selected={active}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-[9px] px-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none md:-mb-px md:h-11 md:rounded-none md:border-b-2 md:text-[15px]",
              active
                ? "bg-ops-surface font-semibold text-ops-text shadow-sm md:border-ops-bamboo-strong md:bg-transparent md:shadow-none"
                : "font-medium text-ops-text-muted md:border-transparent hover:text-ops-text"
            )}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
            <span className="rounded-full bg-ops-surface-muted px-[7px] py-0.5 text-xs font-semibold tabular-nums text-ops-text md:bg-ops-surface-muted">
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
