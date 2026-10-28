"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const longMonthFormat = new Intl.DateTimeFormat("es-UY", { month: "long" });
const shortMonthFormat = new Intl.DateTimeFormat("es-UY", { month: "short" });

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

// "Octubre 2026": `capitalize` de CSS mostraba "Octubre De 2026".
export const formatMonthLabel = (month: Date) =>
  `${capitalize(longMonthFormat.format(month))} ${month.getFullYear()}`;

const shortMonthLabels = Array.from({ length: 12 }, (_, index) =>
  capitalize(shortMonthFormat.format(new Date(2026, index, 1)).replace(".", ""))
);

const iconButton =
  "flex size-9 flex-none items-center justify-center rounded-[var(--ops-radius-control)] text-ops-text-muted transition-colors hover:bg-ops-surface-muted hover:text-ops-text focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none";

// Selector del mes operativo: flechas, y el mes abre una grilla de meses del año.
export const OpsMonthPicker = ({
  month,
  onChange,
  onNext,
  onPrevious,
  onReset,
}: {
  month: Date;
  onChange: (month: Date) => void;
  onNext: () => void;
  onPrevious: () => void;
  onReset: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(month.getFullYear());
  const today = new Date();
  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

  const pick = (monthIndex: number) => {
    onChange(new Date(viewYear, monthIndex, 1));
    setOpen(false);
  };

  return (
    <div className="flex w-full min-w-0 items-center gap-1 rounded-[var(--ops-radius-row)] border border-ops-border bg-ops-surface p-1 sm:w-auto">
      <button aria-label="Mes anterior" className={iconButton} onClick={onPrevious} type="button">
        <ChevronLeft className="size-4" />
      </button>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) setViewYear(month.getFullYear());
          setOpen(nextOpen);
        }}
      >
        <PopoverTrigger asChild>
          <button
            aria-label="Elegir mes operativo"
            className="flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-[var(--ops-radius-control)] px-3 text-sm font-semibold text-ops-text transition-colors hover:bg-ops-surface-muted focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none data-[state=open]:bg-ops-surface-muted sm:min-w-40 sm:flex-none"
            type="button"
          >
            <CalendarDays className="size-4 flex-none text-ops-bamboo-strong" />
            <span className="truncate tabular-nums">{formatMonthLabel(month)}</span>
            <ChevronDown className="size-3.5 flex-none text-ops-text-muted" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-64 rounded-[var(--ops-radius-panel)] border-ops-border bg-ops-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <button aria-label="Año anterior" className={iconButton} onClick={() => setViewYear((year) => year - 1)} type="button">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold text-ops-text tabular-nums">{viewYear}</span>
            <button aria-label="Año siguiente" className={iconButton} onClick={() => setViewYear((year) => year + 1)} type="button">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {shortMonthLabels.map((label, index) => {
              const selected = viewYear === month.getFullYear() && index === month.getMonth();
              const current = viewYear === today.getFullYear() && index === today.getMonth();
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "h-9 rounded-[var(--ops-radius-control)] text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none",
                    selected
                      ? "bg-ops-bamboo-strong text-white dark:text-ops-canvas"
                      : "text-ops-text hover:bg-ops-surface-muted",
                    current && !selected && "ring-1 ring-ops-bamboo/50 ring-inset"
                  )}
                  key={label}
                  onClick={() => pick(index)}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      <button aria-label="Mes siguiente" className={iconButton} onClick={onNext} type="button">
        <ChevronRight className="size-4" />
      </button>
      <button
        aria-label="Volver al mes actual"
        className={cn(iconButton, "disabled:pointer-events-none disabled:opacity-35")}
        disabled={isCurrentMonth}
        onClick={onReset}
        title="Volver al mes actual"
        type="button"
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  );
};
