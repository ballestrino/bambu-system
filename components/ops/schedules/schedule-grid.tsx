"use client";

import { countOverlapPairs } from "@/lib/ops/schedule-conflicts";
import type {
  ScheduleDay,
  ScheduleEmployee,
  ScheduleVisit,
  WeeklySchedule,
} from "@/lib/ops/schedule-types";
import { ScheduleDayCell } from "@/components/ops/schedules/schedule-day-cell";
import { ScheduleRowOverlaps } from "@/components/ops/schedules/schedule-row-overlaps";
import type { ScheduleCellReader } from "@/components/ops/schedules/use-schedule-cells";
import type { ScheduleDragState } from "@/components/ops/schedules/use-schedule-drag";
import { ScheduleEmployeeExportButton } from "@/components/ops/schedules/schedule-export-buttons";
import { opsSurface } from "@/components/ops/shared";
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
  name: string;
  overlapCount: number;
  totalVisits: number;
};

export const toScheduleRow = (
  employee: ScheduleEmployee,
  visibleWeekdays: number[]
): ScheduleRow => {
  const days = employee.days.filter((day) => visibleWeekdays.includes(day.weekdayNumber));

  return {
    days,
    employee,
    employeeId: employee.id,
    name: employee.name,
    overlapCount: countOverlapPairs(days),
    totalVisits: days.reduce((total, day) => total + day.visits.length, 0),
  };
};

export const ScheduleGrid = ({
  handlers,
  rows,
  schedule,
  visibleWeekdays,
}: {
  handlers: ScheduleHandlers;
  rows: ScheduleRow[];
  schedule?: WeeklySchedule;
  visibleWeekdays?: number[];
}) => {
  const columns = rows[0]?.days.length ?? 0;
  const gridStyle = {
    gridTemplateColumns: `168px repeat(${columns}, minmax(150px, 1fr))`,
  };

  return (
    <div className={cn(opsSurface.panel, "hidden overflow-x-auto lg:block")}>
      <div style={{ minWidth: `${168 + columns * 150}px` }}>
        <div className="grid bg-ops-surface-muted" style={gridStyle}>
          <div className="sticky left-0 z-10 border-r border-ops-border bg-ops-surface-muted p-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Empleada
          </div>
          {rows[0]?.days.map((day) => (
            <div className="border-r border-ops-border p-2 last:border-r-0" key={day.dateKey}>
              <p className="text-xs font-semibold text-ops-text">{day.weekdayLabel}</p>
              <p className="text-xs text-muted-foreground">{day.dayLabel}</p>
            </div>
          ))}
        </div>
        {rows.map((row) => (
          <div
            className="grid border-t border-ops-border"
            key={row.employeeId ?? "unassigned"}
            style={gridStyle}
          >
            <div className="sticky left-0 z-10 space-y-1 border-r border-ops-border bg-ops-surface p-2">
              <p className="break-words text-sm font-semibold text-ops-text">{row.name}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {row.totalVisits} visita{row.totalVisits === 1 ? "" : "s"}
                </p>
                {row.employee && schedule ? (
                  <ScheduleEmployeeExportButton
                    employee={row.employee}
                    schedule={schedule}
                    visibleWeekdays={visibleWeekdays}
                  />
                ) : null}
              </div>
              <ScheduleRowOverlaps count={row.overlapCount} />
            </div>
            {row.days.map((day) => (
              <div
                className="min-w-0 border-r border-ops-border last:border-r-0"
                key={`${row.employeeId ?? "unassigned"}-${day.dateKey}`}
              >
                <ScheduleDayCell
                  cell={handlers.getCellState(row.employeeId, day.dateKey)}
                  compact
                  day={day}
                  drag={handlers.drag}
                  employeeId={row.employeeId}
                  onCreate={handlers.onCreate}
                  onEditVisit={handlers.onEditVisit}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ScheduleList = ({
  handlers,
  rows,
  schedule,
  visibleWeekdays,
}: {
  handlers: ScheduleHandlers;
  rows: ScheduleRow[];
  schedule?: WeeklySchedule;
  visibleWeekdays?: number[];
}) => (
  <div className="space-y-3 lg:hidden">
    {rows.map((row) => (
      <div className={cn(opsSurface.panel, "min-w-0 p-3")} key={row.employeeId ?? "unassigned"}>
        <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="break-words text-sm font-semibold text-ops-text">{row.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.totalVisits} visita{row.totalVisits === 1 ? "" : "s"} en la semana
            </p>
            <ScheduleRowOverlaps count={row.overlapCount} />
          </div>
          {row.employee && schedule ? (
            <ScheduleEmployeeExportButton
              employee={row.employee}
              schedule={schedule}
              visibleWeekdays={visibleWeekdays}
            />
          ) : null}
        </div>
        <div className="space-y-2">
          {row.days.map((day) => (
            <div className="min-w-0" key={`${row.employeeId ?? "unassigned"}-${day.dateKey}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ops-bamboo-strong">
                {day.weekdayLabel} {day.dayLabel}
              </p>
              <ScheduleDayCell
                cell={handlers.getCellState(row.employeeId, day.dateKey)}
                day={day}
                drag={handlers.drag}
                employeeId={row.employeeId}
                onCreate={handlers.onCreate}
                onEditVisit={handlers.onEditVisit}
              />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
