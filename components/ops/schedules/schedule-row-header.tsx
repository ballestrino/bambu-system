"use client";

import { Pin } from "lucide-react";

import { formatHours, plural } from "@/lib/ops/visit-day";
import type { ScheduleRow } from "@/components/ops/schedules/schedule-grid";
import { ScheduleRowOverlaps } from "@/components/ops/schedules/schedule-row-overlaps";
import { VisitAvatar, VisitLoadBar } from "@/components/ops/visits/visit-bits";
import { cn } from "@/lib/utils";

// Columna fija de cada fila (3a): avatar, nombre, pin para comparar, visitas
// y horas de la semana, barra de carga sobre 30 h y cruces.
export const ScheduleRowHeader = ({
  onTogglePin,
  pinned,
  row,
}: {
  onTogglePin?: () => void;
  pinned: boolean;
  row: ScheduleRow;
}) => (
  <div className="flex flex-col gap-1.5 py-2.5 pr-2.5 pl-3.5">
    <div className="flex items-center gap-2">
      <VisitAvatar name={row.name} unassigned={!row.employeeId} />
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ops-text">{row.name}</span>
      {row.employeeId && onTogglePin ? (
        <button
          aria-label={pinned ? `Dejar de fijar a ${row.name}` : `Fijar a ${row.name} para comparar`}
          aria-pressed={pinned}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
            pinned ? "bg-ops-bamboo-strong text-white dark:text-ops-canvas" : "text-ops-text-muted/60 hover:bg-ops-surface-muted"
          )}
          onClick={onTogglePin}
          title="Fijar para comparar"
          type="button"
        >
          <Pin className="size-3.5" />
        </button>
      ) : null}
    </div>
    <span className="text-xs text-ops-text-muted">
      {plural(row.totalVisits, "visita")} · {formatHours(row.minutes)}
    </span>
    {row.employeeId ? <VisitLoadBar max={30} minutes={row.minutes} /> : null}
    <ScheduleRowOverlaps count={row.overlapCount} />
  </div>
);
