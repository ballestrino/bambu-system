"use client";

import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";

import {
  isBeyondGenerationHorizon,
  getScheduleWeek,
  parseScheduleWeekParam,
  shiftScheduleWeekKey,
} from "@/lib/ops/schedule-week";
import { Button } from "@/components/ui/button";

export const ScheduleWeekNav = ({
  onWeekChange,
  weekLabel,
  weekStart,
}: {
  onWeekChange: (weekStart: string) => void;
  weekLabel: string;
  weekStart: string;
}) => {
  const currentKey = getScheduleWeek(new Date()).startKey;
  const nextKey = shiftScheduleWeekKey(weekStart, 1);
  const isNextBlocked = isBeyondGenerationHorizon(
    getScheduleWeek(parseScheduleWeekParam(nextKey)).start
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          aria-label="Semana anterior"
          onClick={() => onWeekChange(shiftScheduleWeekKey(weekStart, -1))}
          size="icon"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Semana siguiente"
          disabled={isNextBlocked}
          onClick={() => onWeekChange(nextKey)}
          size="icon"
          title={
            isNextBlocked
              ? "Las visitas recurrentes se generan hasta tres meses adelante"
              : undefined
          }
          type="button"
          variant="outline"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="min-w-0 text-sm font-medium text-ops-text">{weekLabel}</p>
      {weekStart === currentKey ? null : (
        <Button
          onClick={() => onWeekChange(currentKey)}
          size="sm"
          type="button"
          variant="outline"
        >
          <CalendarCheck className="h-4 w-4" />
          Esta semana
        </Button>
      )}
    </div>
  );
};
