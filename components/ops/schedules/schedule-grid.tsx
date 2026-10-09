"use client";

import { countOverlapPairs } from "@/lib/ops/schedule-conflicts";
import type { ScheduleDay, ScheduleEmployee, ScheduleVisit } from "@/lib/ops/schedule-types";
import { plural } from "@/lib/ops/visit-day";
import { ScheduleDayCell } from "@/components/ops/schedules/schedule-day-cell";
import { ScheduleRowHeader } from "@/components/ops/schedules/schedule-row-header";
import type { ScheduleCellReader } from "@/components/ops/schedules/use-schedule-cells";
import type { ScheduleDragState } from "@/components/ops/schedules/use-schedule-drag";
import { cn } from "@/lib/utils";

export type ScheduleHandlers = {
  drag: ScheduleDragState;
  getCellState: ScheduleCellReader;
  onCreate: (dateKey: string, employeeId: string | null) => void;
  onEditVisit: (visit: ScheduleVisit) => void;
};

export type ScheduleRow = {
  days: ScheduleDay[];
  employee?: ScheduleEmployee;
  employeeId: string | null;
  minutes: number;
  name: string;
  overlapCount: number;
  totalVisits: number;
};

const sumMinutes = (days: ScheduleDay[]) =>
  days.reduce(
    (total, day) => total + day.visits.reduce((sum, visit) => sum + visit.endMinute - visit.startMinute, 0),
    0
  );

export const toScheduleRow = (
  employee: { days: ScheduleDay[]; id: string | null; name: string; source?: ScheduleEmployee },
  visibleWeekdays: number[]
): ScheduleRow => {
  const days = employee.days.filter((day) => visibleWeekdays.includes(day.weekdayNumber));

  return {
    days,
    employee: employee.source,
    employeeId: employee.id,
    minutes: sumMinutes(days),
    name: employee.name,
    overlapCount: employee.id ? countOverlapPairs(days) : 0,
    totalVisits: days.reduce((total, day) => total + day.visits.length, 0),
  };
};

// Cronograma semanal de escritorio (3a): filas por empleada, "Sin asignar"
// primero, dias en columnas. Con la comparacion activa las fijadas suben y un
// borde grueso las separa del resto.
export const ScheduleGrid = ({
  compare,
  handlers,
  onTogglePin,
  pins,
  rows,
  todayKey,
}: {
  compare: boolean;
  handlers: ScheduleHandlers;
  onTogglePin: (employeeId: string) => void;
  pins: string[];
  rows: ScheduleRow[];
  todayKey: string;
}) => {
  const days = rows[0]?.days ?? [];
  const gridStyle = { gridTemplateColumns: `220px repeat(${days.length}, minmax(172px, 1fr))` };
  const isPinned = (row: ScheduleRow) => Boolean(row.employeeId && pins.includes(row.employeeId));
  const ordered = compare ? [...rows.filter(isPinned), ...rows.filter((row) => !isPinned(row))] : rows;
  const pinnedCount = compare ? ordered.filter(isPinned).length : 0;
  // Una visita compartida aparece en dos filas pero cuenta una vez.
  const dayCount = (index: number) =>
    new Set(rows.flatMap((row) => row.days[index]?.visits.map((visit) => visit.id) ?? [])).size;

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div style={{ minWidth: 220 + days.length * 172 }}>
        <div className="sticky top-0 z-[3] grid border-b border-ops-border bg-ops-canvas dark:bg-ops-surface-muted" style={gridStyle}>
          <div className="sticky left-0 z-[1] border-r border-ops-border bg-ops-canvas px-3.5 py-2.5 text-[11px] font-semibold tracking-wide text-ops-text-muted uppercase dark:bg-ops-surface-muted">
            Empleada
          </div>
          {days.map((day, index) => (
            <div
              className={cn("flex items-baseline gap-1.5 border-r border-ops-surface-muted px-3 py-2", day.dateKey === todayKey && "bg-ops-bamboo-soft")}
              key={day.dateKey}
            >
              <span className={cn("text-[13px] font-semibold whitespace-nowrap", day.dateKey === todayKey ? "text-ops-bamboo-strong" : "text-ops-text")}>
                {day.weekdayLabel.slice(0, 3)} {Number(day.dateKey.slice(8))}
              </span>
              <span className="text-[11.5px] whitespace-nowrap text-ops-text-muted">
                {dayCount(index) ? plural(dayCount(index), "visita") : "—"}
              </span>
            </div>
          ))}
        </div>
        {ordered.map((row, index) => {
          const pinned = isPinned(row);
          const rowTone = !row.employeeId ? "bg-amber-50/40 dark:bg-amber-500/5" : compare && pinned ? "bg-ops-bamboo-soft/40" : "bg-ops-surface";

          return (
            <div
              className={cn(
                "grid",
                index === 0 ? null : compare && index === pinnedCount ? "border-t-[3px] border-ops-border" : "border-t border-ops-surface-muted",
                rowTone
              )}
              key={row.employeeId ?? "unassigned"}
              style={gridStyle}
            >
              {/* Fondo opaco debajo del tono de la fila: la columna queda fija
                  y las visitas pasan por detras al desplazar. */}
              <div className="sticky left-0 z-[2] border-r border-ops-border bg-ops-surface">
                <div className={cn("h-full", rowTone)}>
                  <ScheduleRowHeader
                    onTogglePin={row.employeeId ? () => onTogglePin(row.employeeId!) : undefined}
                    pinned={pinned}
                    row={row}
                  />
                </div>
              </div>
              {row.days.map((day) => (
                <div
                  className={cn("min-w-0 border-r border-ops-surface-muted", day.dateKey === todayKey && "bg-ops-bamboo/5")}
                  key={`${row.employeeId ?? "unassigned"}-${day.dateKey}`}
                >
                  <ScheduleDayCell
                    cell={handlers.getCellState(row.employeeId, day.dateKey)}
                    day={day}
                    drag={handlers.drag}
                    employeeId={row.employeeId}
                    onCreate={handlers.onCreate}
                    onEditVisit={handlers.onEditVisit}
                    unassigned={!row.employeeId}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
