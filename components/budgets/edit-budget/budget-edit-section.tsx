"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BudgetEditSectionProps = {
  changed: boolean;
  children: ReactNode;
  onToggle: () => void;
  open: boolean;
  summary: string;
  title: string;
};

// Sección de la edición: cerrada muestra un resumen de una línea; un punto
// ámbar marca las que tienen cambios sin guardar.
export const BudgetEditSection = ({ changed, children, onToggle, open, summary, title }: BudgetEditSectionProps) => (
  <section className="flex flex-col gap-4 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface px-5 py-4">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h2 className="flex shrink-0 items-center gap-2 text-base font-semibold text-ops-text sm:w-[170px]">
        {title}
        {changed ? <span aria-label="Con cambios" className="size-[7px] rounded-full bg-ops-amber" role="img" /> : null}
      </h2>
      <span className={cn("min-w-0 flex-[1_1_240px] truncate text-[13.5px] text-ops-text-muted", open && "invisible")}>{summary}</span>
      <button
        aria-expanded={open}
        className="h-9 shrink-0 rounded-[9px] bg-ops-surface-muted px-3 text-[13px] font-semibold text-ops-text hover:bg-ops-border/60"
        onClick={onToggle}
        type="button"
      >
        {open ? "Cerrar" : "Editar"}
      </button>
    </div>
    {open ? children : null}
  </section>
);
