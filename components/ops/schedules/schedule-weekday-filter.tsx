"use client";

import { Button } from "@/components/ui/button";
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
    <div className="flex items-center gap-1" role="group" aria-label="Días visibles">
      {weekdayChips.map((chip) => {
        const isVisible = value.includes(chip.number);

        return (
          <Button
            aria-label={`Día ${chip.number}`}
            aria-pressed={isVisible}
            className={cn(
              "h-8 w-8 rounded-full p-0 text-xs font-semibold",
              !isVisible && "text-muted-foreground/60 line-through"
            )}
            key={chip.number}
            onClick={() => toggle(chip.number)}
            size="sm"
            type="button"
            variant={isVisible ? "default" : "outline"}
          >
            {chip.label}
          </Button>
        );
      })}
    </div>
  );
};
