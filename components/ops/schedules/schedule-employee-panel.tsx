"use client";

import { ArrowLeft, CalendarOff } from "lucide-react";

import type { ScheduleEmployee, WeeklySchedule } from "@/lib/ops/schedule-types";
import { ScheduleEmployeeExportButton } from "@/components/ops/schedules/schedule-export-buttons";
import { ScheduleVisitCard } from "@/components/ops/schedules/schedule-visit-card";
import { OpsSection, opsSurface } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ScheduleEmployeePanel = ({
  employee,
  onBack,
  schedule,
}: {
  employee: ScheduleEmployee;
  onBack: () => void;
  schedule: WeeklySchedule;
}) => (
  <OpsSection
    actions={
      <div className="flex flex-wrap gap-2">
        <Button onClick={onBack} size="sm" type="button" variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Todo el equipo
        </Button>
        <ScheduleEmployeeExportButton employee={employee} schedule={schedule} />
      </div>
    }
    description={`${schedule.weekLabel} · ${employee.totalVisits} visita${
      employee.totalVisits === 1 ? "" : "s"
    }. Esto es lo que sale en el PDF.`}
    title={employee.name}
  >
    <div className="space-y-3">
      {employee.days.map((day) => (
        <div className={cn(opsSurface.panel, "min-w-0 p-3")} key={day.dateKey}>
          <div className="mb-2 flex flex-wrap items-baseline gap-2">
            <p className="text-sm font-semibold text-ops-bamboo-strong">
              {day.longLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              {day.visits.length
                ? `${day.visits.length} visita${day.visits.length === 1 ? "" : "s"}`
                : "Libre"}
            </p>
          </div>
          {day.visits.length ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {day.visits.map((visit) => (
                <ScheduleVisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarOff className="h-4 w-4" />
              Sin visitas asignadas
            </p>
          )}
        </div>
      ))}
    </div>
  </OpsSection>
);
