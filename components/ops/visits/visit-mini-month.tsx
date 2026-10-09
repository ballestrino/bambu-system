"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { formatMonthLabel, getMonthGrid, VISIT_WEEKDAY_LETTERS } from "@/lib/ops/visit-calendar";
import type { VisitDayTotals } from "@/lib/ops/visit-day";
import { VisitDotLegend } from "@/components/ops/visits/visit-bits";
import { getDayDotClass } from "@/components/ops/visits/visit-day-dot";
import { cn } from "@/lib/utils";

const monthStartKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}-01`;

// Mes con puntos por dia. "lg" es la version tactil de la hoja del celular.
export const VisitMiniMonth = ({
  dayKey,
  month,
  onPick,
  onShiftMonth = onPick,
  size = "sm",
  todayKey,
  totals,
}: {
  dayKey: string;
  month: { month: number; year: number };
  onPick: (dayKey: string) => void;
  // Las flechas del mes van al 1 del mes vecino; la hoja del celular no se
  // cierra con eso, solo al elegir un dia.
  onShiftMonth?: (dayKey: string) => void;
  size?: "lg" | "sm";
  todayKey: string | null;
  totals: Map<string, VisitDayTotals>;
}) => {
  const large = size === "lg";
  const shift = (delta: number) => {
    const date = new Date(month.year, month.month - 1 + delta, 1);
    onShiftMonth(monthStartKey(date.getFullYear(), date.getMonth() + 1));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={cn("font-semibold text-ops-text", large ? "text-xl" : "text-sm")}>
          {formatMonthLabel(month.year, month.month)}
        </span>
        <div className="flex">
          {[-1, 1].map((delta) => (
            <button
              aria-label={delta < 0 ? "Mes anterior" : "Mes siguiente"}
              className={cn(
                "flex items-center justify-center rounded-md text-ops-bamboo-strong hover:bg-ops-surface-muted",
                large ? "size-11" : "size-7"
              )}
              key={delta}
              onClick={() => shift(delta)}
              type="button"
            >
              {delta < 0 ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          ))}
        </div>
      </div>
      <div className={cn("grid grid-cols-7 text-center font-semibold text-ops-text-muted", large ? "text-xs" : "text-[11px]")}>
        {VISIT_WEEKDAY_LETTERS.map((letter, index) => (
          <span key={index}>{letter}</span>
        ))}
      </div>
      <div className={cn("grid grid-cols-7", large ? "gap-y-1" : "gap-y-0.5")}>
        {getMonthGrid(month.year, month.month).map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const selected = day.dayKey === dayKey;
          const today = day.dayKey === todayKey;

          return (
            <button
              aria-current={today ? "date" : undefined}
              aria-label={`${day.day}`}
              aria-pressed={selected}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-lg tabular-nums transition-colors",
                large ? "mx-[3px] h-12 text-base" : "mx-0.5 h-8 text-[12.5px]",
                selected
                  ? "bg-ops-bamboo-strong font-bold text-white dark:text-ops-canvas"
                  : "hover:bg-ops-surface-muted",
                !selected && today && "font-bold text-ops-bamboo-strong",
                !selected && !today && (day.weekdayNumber === 7 ? "text-ops-text-muted/70" : "text-ops-text")
              )}
              key={day.dayKey}
              onClick={() => onPick(day.dayKey)}
              type="button"
            >
              {day.day}
              <span
                className={cn(
                  "size-1 rounded-full",
                  selected
                    ? totals.get(day.dayKey)?.total ? "bg-white dark:bg-ops-canvas" : "bg-transparent"
                    : getDayDotClass(totals.get(day.dayKey))
                )}
              />
            </button>
          );
        })}
      </div>
      <VisitDotLegend className={large ? "pt-1.5 text-[12.5px]" : "pt-0.5"} />
    </div>
  );
};
