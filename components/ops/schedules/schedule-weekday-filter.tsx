"use client";

import { cn } from "@/lib/utils";

export const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

const weekdayChips = [
  { label: "L", number: 1 },
  { label: "M", number: 2 },
  { label: "M", number: 3 },
  { label: "J", number: 4 },
  { label: "V", number: 5 },
  { label: "S", number: 6 },
  { label: "D", number: 7 },
] as const;

export const ScheduleWeekdayFilter = ({
  onChange,
  value,
}: {
  onChange: (weekdays: number[]) => void;
  value: number[];
}) => {
  const toggle = (weekday: number) => {
    const next = value.includes(weekday)
      ? value.filter((current) => current !== weekday)
      : [...value, weekday].sort((left, right) => left - right);

    // Ocultar los siete dias dejaria la grilla sin columnas.
    if (next.length) onChange(next);
  };

  return (
    <div className="flex items-center gap-[3px]" role="group" aria-label="Días visibles">
      {weekdayChips.map((chip) => {
        const isVisible = value.includes(chip.number);

        return (
          <button
            aria-label={`Día ${chip.number}`}
            aria-pressed={isVisible}
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-[11.5px] font-semibold transition-colors",
              isVisible
                ? "bg-ops-bamboo-strong text-white dark:text-ops-canvas"
                : "border border-ops-border text-ops-text-muted/70 line-through"
            )}
            key={chip.number}
            onClick={() => toggle(chip.number)}
            type="button"
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
};
