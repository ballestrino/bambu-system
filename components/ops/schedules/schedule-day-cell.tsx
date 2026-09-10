"use client";

import { Plus } from "lucide-react";

import type { ScheduleDay, ScheduleVisit } from "@/lib/ops/schedule-types";
import { ScheduleVisitCard } from "@/components/ops/schedules/schedule-visit-card";
import type { ScheduleDragState } from "@/components/ops/schedules/use-schedule-drag";
import { cn } from "@/lib/utils";

export const ScheduleDayCell = ({
  compact = false,
  day,
  drag,
  employeeId,
  onCreate,
  onEditVisit,
}: {
  compact?: boolean;
  day: ScheduleDay;
  drag: ScheduleDragState;
  employeeId: string | null;
  onCreate: (dateKey: string, employeeId: string | null) => void;
  onEditVisit: (visit: ScheduleVisit) => void;
}) => {
  const canDrop = Boolean(drag.dragging) && drag.dragging?.fromDateKey !== day.dateKey;
  const isOver = canDrop && drag.overDateKey === day.dateKey;

  return (
    <div
      className={cn(
        "group/cell flex min-h-24 min-w-0 flex-col gap-1 p-1.5 transition-colors",
        canDrop && "bg-ops-bamboo-soft/40",
        isOver && "bg-ops-bamboo-soft ring-1 ring-inset ring-ops-bamboo"
      )}
      {...drag.dayProps(day.dateKey)}
    >
      {day.visits.map((visit) => (
        <ScheduleVisitCard
          handleProps={drag.handleProps({
            employeeId,
            fromDateKey: day.dateKey,
            visitId: visit.id,
          })}
          isDragging={drag.isDragging(visit.id, day.dateKey)}
          key={`${visit.id}-${day.dateKey}`}
          onEdit={() => onEditVisit(visit)}
          showDetails={!compact}
          visit={visit}
        />
      ))}
      <button
        aria-label={`Agregar visita el ${day.longLabel}`}
        className={cn(
          "flex min-h-8 items-center justify-center gap-1 rounded-[var(--ops-radius-row)] border border-dashed border-ops-border text-[11px] text-muted-foreground transition-colors hover:border-ops-bamboo hover:text-ops-bamboo-strong",
          compact &&
            day.visits.length &&
            "opacity-0 focus-visible:opacity-100 group-hover/cell:opacity-100"
        )}
        onClick={() => onCreate(day.dateKey, employeeId)}
        type="button"
      >
        <Plus className="h-3 w-3" />
        Visita
      </button>
    </div>
  );
};
