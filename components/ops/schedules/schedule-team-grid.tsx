"use client";

import Link from "next/link";

import type { ScheduleEmployee, WeeklySchedule } from "@/lib/ops/schedule-types";
import { ScheduleVisitCard } from "@/components/ops/schedules/schedule-visit-card";
import { opsSurface } from "@/components/ops/shared";
import { cn } from "@/lib/utils";

const gridColumns = "grid-cols-[168px_repeat(7,minmax(132px,1fr))]";

const EmployeeRow = ({
  employee,
  onSelect,
}: {
  employee: ScheduleEmployee;
  onSelect: (employeeId: string) => void;
}) => (
  <div className={cn("grid border-t border-ops-border", gridColumns)}>
    <div className="sticky left-0 z-10 space-y-1 border-r border-ops-border bg-ops-surface p-2">
      <button
        className="text-left text-sm font-semibold text-ops-text hover:underline"
        onClick={() => onSelect(employee.id)}
        type="button"
      >
        {employee.name}
      </button>
      <p className="text-xs text-muted-foreground">
        {employee.totalVisits} visita{employee.totalVisits === 1 ? "" : "s"}
      </p>
    </div>
    {employee.days.map((day) => (
      <div
        className="min-w-0 space-y-1 border-r border-ops-border p-1.5 last:border-r-0"
        key={`${employee.id}-${day.dateKey}`}
      >
        {day.visits.length ? (
          day.visits.map((visit) => (
            <ScheduleVisitCard compact key={visit.id} visit={visit} />
          ))
        ) : (
          <p className="px-1 text-xs text-muted-foreground/60">-</p>
        )}
      </div>
    ))}
  </div>
);

export const ScheduleTeamGrid = ({
  onSelectEmployee,
  schedule,
}: {
  onSelectEmployee: (employeeId: string) => void;
  schedule: WeeklySchedule;
}) => (
  <div className={cn(opsSurface.panel, "hidden overflow-x-auto lg:block")}>
    <div className="min-w-[1100px]">
      <div className={cn("grid bg-ops-surface-muted", gridColumns)}>
        <div className="sticky left-0 z-10 border-r border-ops-border bg-ops-surface-muted p-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Empleada
        </div>
        {schedule.employees[0]?.days.map((day) => (
          <div
            className="border-r border-ops-border p-2 last:border-r-0"
            key={day.dateKey}
          >
            <p className="text-xs font-semibold text-ops-text">{day.weekdayLabel}</p>
            <p className="text-xs text-muted-foreground">{day.dayLabel}</p>
          </div>
        ))}
      </div>
      {schedule.employees.map((employee) => (
        <EmployeeRow employee={employee} key={employee.id} onSelect={onSelectEmployee} />
      ))}
    </div>
  </div>
);

export const ScheduleUnassignedNotice = ({ schedule }: { schedule: WeeklySchedule }) => {
  const total = schedule.unassigned.reduce((sum, day) => sum + day.visits.length, 0);

  if (!total) {
    return null;
  }

  return (
    <div className={cn(opsSurface.panelSoft, "flex flex-wrap items-center gap-2 p-3")}>
      <p className="text-sm text-ops-text">
        {total} visita{total === 1 ? "" : "s"} de esta semana sin empleada asignada.
      </p>
      <Link
        className="text-sm font-medium text-ops-bamboo-strong underline"
        href="/dashboard/calendar"
      >
        Asignar en Visitas
      </Link>
    </div>
  );
};
