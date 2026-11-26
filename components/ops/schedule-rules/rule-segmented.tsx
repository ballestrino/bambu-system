"use client";

import { cn } from "@/lib/utils";

// Selector de pocas opciones (frecuencia, sentido de la limpieza).
export const RuleSegmented = <T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
  value: T;
}) => (
  <div
    aria-label={label}
    className="grid gap-1 rounded-[10px] bg-ops-surface-muted p-1"
    role="group"
    style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
  >
    {options.map((option) => (
      <button
        aria-pressed={option.value === value}
        className={cn(
          "min-h-10 rounded-lg px-2 text-[13px] font-semibold transition-colors",
          option.value === value ? "bg-ops-surface text-ops-text shadow-sm" : "text-ops-text-muted hover:text-ops-text"
        )}
        key={option.value}
        onClick={() => onChange(option.value)}
        type="button"
      >
        {option.label}
      </button>
    ))}
  </div>
);
