"use client";

import type { ScheduleEmployee, WeeklySchedule } from "@/lib/ops/schedule-types";
import { ScheduleVisitCard } from "@/components/ops/schedules/schedule-visit-card";
import { opsSurface } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EmployeeCard = ({
  employee,
  onSelect,
}: {
  employee: ScheduleEmployee;
  onSelect: (employeeId: string) => void;
}) => {
  const busyDays = employee.days.filter((day) => day.visits.length);

  return (
    <div className={cn(opsSurface.panel, "min-w-0 space-y-3 p-3")}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-ops-text">
            {employee.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {employee.totalVisits} visita{employee.totalVisits === 1 ? "" : "s"} ·{" "}
            {busyDays.length} día{busyDays.length === 1 ? "" : "s"} con trabajo
          </p>
        </div>
        <Button onClick={() => onSelect(employee.id)} size="sm" type="button" variant="outline">
          Ver semana
        </Button>
      </div>
      {busyDays.length ? (
        <div className="space-y-2">
          {busyDays.map((day) => (
            <div className="min-w-0 space-y-1" key={day.dateKey}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ops-bamboo-strong">
                {day.weekdayLabel} {day.dayLabel}
              </p>
              {day.visits.map((visit) => (
                <ScheduleVisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sin visitas esta semana.</p>
      )}
    </div>
  );
};

export const ScheduleTeamList = ({
  onSelectEmployee,
  schedule,
}: {
  onSelectEmployee: (employeeId: string) => void;
  schedule: WeeklySchedule;
}) => (
  <div className="space-y-3 lg:hidden">
    {schedule.employees.map((employee) => (
      <EmployeeCard employee={employee} key={employee.id} onSelect={onSelectEmployee} />
    ))}
  </div>
);
