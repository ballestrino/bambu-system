"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  isBeyondGenerationHorizon,
  getScheduleWeek,
  parseScheduleWeekParam,
  shiftScheduleWeekKey,
} from "@/lib/ops/schedule-week";
import { formatWeekRange } from "@/lib/ops/visit-calendar";

const arrow =
  "flex size-8 items-center justify-center rounded-lg border border-ops-border hover:bg-ops-surface-muted disabled:opacity-40";

export const ScheduleWeekNav = ({
  onWeekChange,
  weekEndKey,
  weekStart,
}: {
  onWeekChange: (weekStart: string) => void;
  weekEndKey: string;
  weekStart: string;
}) => {
  const currentKey = getScheduleWeek(new Date()).startKey;
  const nextKey = shiftScheduleWeekKey(weekStart, 1);
  const isNextBlocked = isBeyondGenerationHorizon(
    getScheduleWeek(parseScheduleWeekParam(nextKey)).start
  );

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        <button
          aria-label="Semana anterior"
          className={arrow}
          onClick={() => onWeekChange(shiftScheduleWeekKey(weekStart, -1))}
          type="button"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          aria-label="Semana siguiente"
          className={arrow}
          disabled={isNextBlocked}
          onClick={() => onWeekChange(nextKey)}
          title={
            isNextBlocked
              ? "Las visitas recurrentes se generan hasta tres meses adelante"
              : undefined
          }
          type="button"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <span className="text-base font-semibold whitespace-nowrap text-ops-text">
        {formatWeekRange(weekStart, weekEndKey)}
      </span>
      {weekStart === currentKey ? null : (
        <button
          className="h-7 rounded-full bg-ops-bamboo-soft px-2.5 text-xs font-semibold whitespace-nowrap text-ops-bamboo-strong"
          onClick={() => onWeekChange(currentKey)}
          type="button"
        >
          Esta semana
        </button>
      )}
    </div>
  );
};
