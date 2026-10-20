"use client";

import { CalendarOff, CalendarPlus, CalendarSearch, Columns2, Pin, TriangleAlert } from "lucide-react";

import { monthPreset, untilMonthEndPreset, weekPreset } from "@/lib/ops/occurrence-generation-presets";
import type { WeeklySchedule } from "@/lib/ops/schedule-types";
import { GenerateOccurrencesDialog } from "@/components/ops/occurrences/generate-occurrences-dialog";
import { ScheduleExportMenu } from "@/components/ops/schedules/schedule-export-menu";
import { scheduleToolButton } from "@/components/ops/schedules/schedule-tool-button";
import { ScheduleWeekdayFilter } from "@/components/ops/schedules/schedule-weekday-filter";
import { ScheduleWeekNav } from "@/components/ops/schedules/schedule-week-nav";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { cn } from "@/lib/utils";

// Barra del cronograma (3a): semana, dias visibles y herramientas en una
// linea; abajo los avisos de la semana y, al comparar, quienes estan fijadas.
export const ScheduleToolbar = ({
  compare,
  compareText,
  employeeOptions,
  onEmployeesChange,
  onOpenAvailability,
  onOpenGaps,
  onToggleCompare,
  onWeekChange,
  onWeekdaysChange,
  occurrenceCount,
  overlapCount,
  schedule,
  selectedEmployeeIds,
  visibleWeekdays,
  weekStart,
}: {
  compare: boolean;
  compareText: string;
  employeeOptions: { id: string; name: string }[];
  onEmployeesChange: (employeeIds: string[]) => void;
  onOpenAvailability: () => void;
  onOpenGaps: () => void;
  onToggleCompare: () => void;
  onWeekChange: (weekStart: string) => void;
  onWeekdaysChange: (weekdays: number[]) => void;
  // Visits loaded for the week, or undefined while loading.
  occurrenceCount?: number;
  overlapCount: number;
  schedule: WeeklySchedule;
  selectedEmployeeIds: string[];
  visibleWeekdays: number[];
  weekStart: string;
}) => (
  <>
    <div className="flex flex-none flex-wrap items-center gap-3 border-b border-ops-border px-4 py-3">
      <ScheduleWeekNav onWeekChange={onWeekChange} weekEndKey={schedule.weekEndKey} weekStart={weekStart} />
      <ScheduleWeekdayFilter onChange={onWeekdaysChange} value={visibleWeekdays} />
      <span className="flex-1" />
      <SearchableMultiSelect
        aria-label="Filtrar por empleadas"
        className="h-[34px] w-44 rounded-[9px] border-ops-border text-[13px] shadow-none"
        onValueChange={onEmployeesChange}
        options={employeeOptions.map((employee) => ({ label: employee.name, value: employee.id }))}
        placeholder="Todo el equipo"
        searchPlaceholder="Buscar empleada..."
        summaryLabel={(count) => `${count} empleadas`}
        values={selectedEmployeeIds}
      />
      <button
        aria-pressed={compare}
        className={cn(scheduleToolButton, compare && "border-ops-bamboo bg-ops-bamboo-soft text-ops-bamboo-strong")}
        onClick={onToggleCompare}
        type="button"
      >
        <Columns2 className="size-[15px]" />
        Comparar fijadas
      </button>
      <button className={scheduleToolButton} onClick={onOpenGaps} type="button">
        <CalendarSearch className="size-[15px]" />
        Buscar huecos
      </button>
      <button className={scheduleToolButton} onClick={onOpenAvailability} type="button">
        <CalendarOff className="size-[15px]" />
        Disponibilidad
      </button>
      <GenerateOccurrencesDialog
        presets={[
          weekPreset(weekStart, "Esta semana"),
          monthPreset(weekStart, "Todo el mes"),
          untilMonthEndPreset(weekStart, "De la semana a fin de mes"),
        ]}
        scopeLabel="todos los trabajos"
        trigger={
          <button className={scheduleToolButton} type="button">
            <CalendarPlus className="size-[15px]" />
            Generar semana
          </button>
        }
      />
      <ScheduleExportMenu schedule={schedule} visibleWeekdays={visibleWeekdays} />
    </div>
    {compare ? (
      <div className="flex flex-none flex-wrap items-center gap-2.5 border-b border-ops-border bg-ops-bamboo-soft/40 px-4 py-2 text-[12.5px] text-ops-bamboo-strong">
        <Pin className="size-3.5" />
        <span className="font-semibold">{compareText}</span>
        <span className="text-ops-text-muted">Tocá el pin de una fila para cambiar a quién comparás.</span>
      </div>
    ) : null}
    {occurrenceCount === 0 || overlapCount ? (
      <div className="flex flex-none flex-wrap gap-x-4 gap-y-1 border-b border-ops-border px-4 py-2 text-xs">
        {occurrenceCount === 0 ? (
          <span className="flex items-center gap-1 text-ops-text-muted">
            <CalendarPlus aria-hidden className="size-3.5" />
            Esta semana no tiene visitas generadas. Usá &quot;Generar semana&quot; para crearlas.
          </span>
        ) : null}
        {overlapCount ? (
          <span className="flex items-center gap-1 text-amber-800 dark:text-amber-200">
            <TriangleAlert aria-hidden className="size-3.5" />
            {overlapCount} cruce{overlapCount === 1 ? "" : "s"} de horario en la semana
          </span>
        ) : null}
      </div>
    ) : null}
  </>
);
