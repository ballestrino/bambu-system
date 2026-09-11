"use client";

import { CalendarOff, CalendarSearch, TriangleAlert } from "lucide-react";

import type { WeeklySchedule } from "@/lib/ops/schedule-types";
import { ScheduleTeamExportButton } from "@/components/ops/schedules/schedule-export-buttons";
import { ScheduleWeekdayFilter } from "@/components/ops/schedules/schedule-weekday-filter";
import { ScheduleWeekNav } from "@/components/ops/schedules/schedule-week-nav";
import { OpsFilterField, opsFilterControlClass, opsSurface } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { cn } from "@/lib/utils";

export const ScheduleToolbar = ({
  employeeOptions,
  onEmployeesChange,
  onOpenAvailability,
  onOpenGaps,
  onWeekChange,
  onWeekdaysChange,
  overlapCount,
  schedule,
  selectedEmployeeIds,
  visibleWeekdays,
  weekLabel,
  weekStart,
}: {
  employeeOptions: { id: string; name: string }[];
  onEmployeesChange: (employeeIds: string[]) => void;
  onOpenAvailability: () => void;
  onOpenGaps: () => void;
  onWeekChange: (weekStart: string) => void;
  onWeekdaysChange: (weekdays: number[]) => void;
  overlapCount: number;
  schedule?: WeeklySchedule;
  selectedEmployeeIds: string[];
  visibleWeekdays: number[];
  weekLabel: string;
  weekStart: string;
}) => (
  <div className={cn(opsSurface.toolbar, "space-y-3")}>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <ScheduleWeekNav
        onWeekChange={onWeekChange}
        weekLabel={weekLabel}
        weekStart={weekStart}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onOpenGaps} size="sm" type="button" variant="outline">
          <CalendarSearch className="h-4 w-4" />
          Buscar huecos
        </Button>
        <Button onClick={onOpenAvailability} size="sm" type="button" variant="outline">
          <CalendarOff className="h-4 w-4" />
          Disponibilidad
        </Button>
        {schedule ? (
          <ScheduleTeamExportButton schedule={schedule} visibleWeekdays={visibleWeekdays} />
        ) : null}
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_auto]">
      <OpsFilterField label="Empleadas">
        <SearchableMultiSelect
          aria-label="Filtrar por empleadas"
          className={opsFilterControlClass}
          onValueChange={onEmployeesChange}
          options={employeeOptions.map((employee) => ({
            label: employee.name,
            value: employee.id,
          }))}
          placeholder="Todo el equipo"
          searchPlaceholder="Buscar empleada..."
          summaryLabel={(count) => `${count} empleadas`}
          values={selectedEmployeeIds}
        />
      </OpsFilterField>
      <OpsFilterField label="Días visibles">
        <div className="flex min-h-11 items-center">
          <ScheduleWeekdayFilter onChange={onWeekdaysChange} value={visibleWeekdays} />
        </div>
      </OpsFilterField>
    </div>
    {overlapCount ? (
      <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
        <TriangleAlert aria-hidden className="h-3.5 w-3.5 shrink-0" />
        {overlapCount} cruce{overlapCount === 1 ? "" : "s"} de horario en la semana
      </p>
    ) : null}
  </div>
);
