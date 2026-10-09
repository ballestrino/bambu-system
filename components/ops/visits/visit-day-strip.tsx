"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { getWeekDays, shiftDayKey } from "@/lib/ops/visit-calendar";
import { plural, type VisitDayTotals } from "@/lib/ops/visit-day";
import { getDayDotClass } from "@/components/ops/visits/visit-day-dot";
import { VisitMiniMonth } from "@/components/ops/visits/visit-mini-month";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type StripProps = {
  dayKey: string;
  month: { month: number; year: number };
  onPick: (dayKey: string) => void;
  todayKey: string | null;
  totals: Map<string, VisitDayTotals>;
};

const arrowClass =
  "flex shrink-0 items-center justify-center text-ops-text-muted transition-colors hover:text-ops-bamboo-strong";

// Tira de 7 dias del escritorio (3a): tarjetas con la cuenta del dia, flechas
// de semana y el mes en un popover.
export const VisitDayStrip = ({ dayKey, month, onPick, todayKey, totals }: StripProps) => (
  <div className="flex items-center gap-2.5">
    <button
      aria-label="Semana anterior"
      className={cn(arrowClass, "h-[72px] w-9 rounded-xl border border-ops-border bg-ops-surface")}
      onClick={() => onPick(shiftDayKey(dayKey, -7))}
      type="button"
    >
      <ChevronLeft className="size-4" />
    </button>
    <div className="grid flex-1 grid-cols-7 gap-2">
      {getWeekDays(dayKey).map((day) => {
        const selected = day.dayKey === dayKey;
        const dayTotals = totals.get(day.dayKey);

        return (
          <button
            aria-pressed={selected}
            className={cn(
              "flex h-[72px] min-w-0 flex-col justify-center gap-0.5 rounded-xl border px-3 text-left transition-colors",
              selected
                ? "border-ops-bamboo-strong bg-ops-bamboo-strong text-white dark:text-ops-canvas"
                : "border-ops-border bg-ops-surface hover:border-ops-bamboo/60"
            )}
            key={day.dayKey}
            onClick={() => onPick(day.dayKey)}
            type="button"
          >
            <span className="flex items-baseline gap-1.5">
              <span className={cn("text-xs font-semibold", selected ? "opacity-80" : "text-ops-text-muted")}>
                {day.shortWeekday}
              </span>
              <span
                className={cn(
                  "text-xl font-semibold tabular-nums",
                  !selected && (day.dayKey === todayKey ? "text-ops-bamboo-strong" : day.weekdayNumber === 7 ? "text-ops-text-muted/70" : "text-ops-text")
                )}
              >
                {day.day}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className={cn("truncate text-xs", selected ? "opacity-80" : "text-ops-text-muted")}>
                {dayTotals?.total ? plural(dayTotals.total, "visita") : "Sin visitas"}
              </span>
              {dayTotals?.attention ? <span className="size-[7px] shrink-0 rounded-full bg-amber-400" /> : null}
            </span>
          </button>
        );
      })}
    </div>
    <button
      aria-label="Semana siguiente"
      className={cn(arrowClass, "h-[72px] w-9 rounded-xl border border-ops-border bg-ops-surface")}
      onClick={() => onPick(shiftDayKey(dayKey, 7))}
      type="button"
    >
      <ChevronRight className="size-4" />
    </button>
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex h-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-ops-border bg-ops-surface px-3 text-xs font-semibold text-ops-bamboo-strong hover:bg-ops-surface-muted"
          type="button"
        >
          <CalendarDays className="size-[18px]" />
          Mes
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-[var(--ops-radius-panel)] border-ops-border p-3.5">
        <VisitMiniMonth dayKey={dayKey} month={month} onPick={onPick} todayKey={todayKey} totals={totals} />
      </PopoverContent>
    </Popover>
  </div>
);

// Version del celular (2a): una sola pildora con letra, numero y punto.
export const VisitWeekPills = ({ dayKey, onPick, totals }: StripProps) => (
  <div className="flex items-center gap-0.5 px-1">
    <button aria-label="Semana anterior" className={cn(arrowClass, "h-14 w-8")} onClick={() => onPick(shiftDayKey(dayKey, -7))} type="button">
      <ChevronLeft className="size-[18px]" />
    </button>
    <div className="grid flex-1 grid-cols-7 gap-[3px] rounded-2xl border border-ops-border bg-ops-surface p-[3px]">
      {getWeekDays(dayKey).map((day) => {
        const selected = day.dayKey === dayKey;
        const dayTotals = totals.get(day.dayKey);

        return (
          <button
            aria-label={`${day.shortWeekday} ${day.day}`}
            aria-pressed={selected}
            className={cn(
              "flex h-[50px] flex-col items-center justify-center gap-0.5 rounded-xl",
              selected ? "bg-ops-bamboo-strong text-white dark:text-ops-canvas" : "text-ops-text"
            )}
            key={day.dayKey}
            onClick={() => onPick(day.dayKey)}
            type="button"
          >
            <span className={cn("text-[11px] font-semibold", selected ? "opacity-80" : "text-ops-text-muted")}>{day.weekdayLetter}</span>
            <span className="text-base font-semibold tabular-nums">{day.day}</span>
            <span
              className={cn(
                "size-[5px] rounded-full",
                selected ? (dayTotals?.total ? "bg-white dark:bg-ops-canvas" : "bg-transparent") : getDayDotClass(dayTotals)
              )}
            />
          </button>
        );
      })}
    </div>
    <button aria-label="Semana siguiente" className={cn(arrowClass, "h-14 w-8")} onClick={() => onPick(shiftDayKey(dayKey, 7))} type="button">
      <ChevronRight className="size-[18px]" />
    </button>
  </div>
);
