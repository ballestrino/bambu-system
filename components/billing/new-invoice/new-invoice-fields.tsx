"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Piezas del formulario de factura (diseño B): tarjeta de sección, campo con
// etiqueta y ayuda, input y botones segmentados con role="radio".
export const sectionClass = "flex flex-col gap-4 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-4 md:p-5";

export const inputClass =
  "h-11 w-full min-w-0 rounded-[10px] border border-ops-border bg-ops-surface px-3 text-[15px] font-normal text-ops-text outline-none focus:border-ops-bamboo focus:ring-3 focus:ring-ops-bamboo/20 disabled:opacity-60";

export const SectionTitle = ({ aside, children, hint }: { aside?: ReactNode; children: ReactNode; hint?: string }) => (
  <div className="flex flex-wrap items-start justify-between gap-2">
    <div className="flex flex-col gap-0.5">
      <h2 className="text-[17px] font-semibold text-ops-text">{children}</h2>
      {hint ? <p className="text-[13px] text-ops-text-muted">{hint}</p> : null}
    </div>
    {aside}
  </div>
);

export const Field = ({ children, className, hint, label }: { children: ReactNode; className?: string; hint?: string; label: string }) => (
  <label className={cn("flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold text-ops-text", className)}>
    <span>
      {label} {hint ? <span className="font-normal text-ops-text-muted">{hint}</span> : null}
    </span>
    {children}
  </label>
);

export const SectionChip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex h-[22px] items-center rounded-md border border-ops-bamboo/30 bg-ops-bamboo-soft px-2 text-xs font-medium text-ops-bamboo-strong">
    {children}
  </span>
);

export const Segmented = <T extends string | number>({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
  value: T;
}) => (
  <div aria-label={label} className="flex flex-wrap gap-1 rounded-[11px] border border-ops-border bg-ops-surface-muted/60 p-1" role="radiogroup">
    {options.map((option) => (
      <button
        aria-checked={option.value === value}
        className={cn(
          "h-9 min-w-0 flex-1 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-60",
          option.value === value ? "bg-ops-surface text-ops-text shadow-sm ring-1 ring-ops-border" : "text-ops-text-muted hover:text-ops-text"
        )}
        disabled={disabled}
        key={String(option.value)}
        onClick={() => onChange(option.value)}
        role="radio"
        type="button"
      >
        {option.label}
      </button>
    ))}
  </div>
);

export const Checkbox = ({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) => (
  <label className="flex min-h-11 items-center gap-2.5 text-sm text-ops-text">
    <input
      checked={checked}
      className="size-[18px] accent-[var(--ops-bamboo)]"
      onChange={(event) => onChange(event.target.checked)}
      type="checkbox"
    />
    {label}
  </label>
);
