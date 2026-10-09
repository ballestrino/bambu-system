"use client";

import { Plus } from "lucide-react";

import { formatMinuteOfDay, formatMinuteRange } from "@/lib/ops/minute-ranges";
import type { ScheduleDay, ScheduleVisit } from "@/lib/ops/schedule-types";
import type { ScheduleCellState } from "@/components/ops/schedules/use-schedule-cells";
import { ScheduleVisitCard } from "@/components/ops/schedules/schedule-visit-card";
import type { ScheduleDragState } from "@/components/ops/schedules/use-schedule-drag";
import { cn } from "@/lib/utils";

export const ScheduleDayCell = ({
  cell,
  day,
  drag,
  employeeId,
  onCreate,
  onEditVisit,
  unassigned = false,
}: {
  cell: ScheduleCellState;
  day: ScheduleDay;
  drag: ScheduleDragState;
  employeeId: string | null;
  onCreate: (dateKey: string, employeeId: string | null) => void;
  onEditVisit: (visit: ScheduleVisit) => void;
  unassigned?: boolean;
}) => {
  const canDrop = drag.canDrop(day.dateKey, employeeId);
  const isOver = canDrop && drag.isOver(day.dateKey, employeeId);
  const showSlots = Boolean(drag.dragging) && cell.dropSlots.length > 0;

  return (
    <div
      className={cn(
        "group/cell flex h-full min-h-[104px] min-w-0 flex-col gap-1 p-1.5 transition-colors",
        cell.isUnavailable && "bg-ops-surface-muted/60",
        canDrop && "bg-ops-bamboo-soft/40",
        isOver && "bg-ops-bamboo-soft ring-1 ring-ops-bamboo ring-inset"
      )}
      {...drag.dayProps(day.dateKey, employeeId)}
    >
      {day.visits.map((visit) => (
        <ScheduleVisitCard
          handleProps={drag.handleProps({
            durationMinutes: visit.endMinute - visit.startMinute,
            employeeId,
            fromDateKey: day.dateKey,
            visitId: visit.id,
          })}
          isDragging={drag.isDragging(visit.id, day.dateKey, employeeId)}
          key={`${visit.id}-${day.dateKey}`}
          onEdit={() => onEditVisit(visit)}
          unassigned={unassigned}
          visit={visit}
          warnings={cell.warnings.get(visit.id)}
        />
      ))}

      {cell.isUnavailable && !day.visits.length ? (
        <p className="px-1 text-[11px] text-ops-text-muted/70 italic">No disponible</p>
      ) : null}

      {showSlots ? (
        <div className="flex flex-wrap gap-1">
          {cell.dropSlots.map((slot) => (
            <span
              className="rounded-md border border-dashed border-ops-bamboo bg-ops-surface px-1.5 py-0.5 text-[11px] font-medium text-ops-bamboo-strong"
              key={`${day.dateKey}-${slot.startMinute}`}
              title={`Soltar a las ${formatMinuteOfDay(slot.startMinute)} (libre ${formatMinuteRange(slot)})`}
              {...drag.slotProps(day.dateKey, employeeId, slot.startMinute)}
            >
              {formatMinuteOfDay(slot.startMinute)}
            </span>
          ))}
        </div>
      ) : null}

      <button
        aria-label={`Agregar visita el ${day.longLabel}`}
        className={cn(
          "mt-auto flex h-6 items-center justify-center gap-1 rounded-[7px] border border-dashed border-ops-border text-[11px] text-ops-text-muted/70 transition-colors hover:border-ops-bamboo hover:text-ops-bamboo-strong",
          day.visits.length && "opacity-0 group-hover/cell:opacity-100 focus-visible:opacity-100"
        )}
        onClick={() => onCreate(day.dateKey, employeeId)}
        type="button"
      >
        <Plus className="size-[11px]" />
        Visita
      </button>
    </div>
  );
};
