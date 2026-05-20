"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  OpsDateFilterInput,
  OpsFilterChips,
  OpsFilterField,
  opsSurface,
  opsFilterControlClass,
  type OpsFilterChip,
} from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EmployeeOption = {
  id: string;
  name: string;
};

export const JobOccurrenceFilters = ({
  activePreset,
  employeeId,
  employeeOptions,
  endDate,
  monthLabel,
  onClear,
  onEmployeeIdChange,
  onEndDateChange,
  onNextMonth,
  onPresetCurrentMonth,
  onPresetLastWeek,
  onPresetPreviousMonth,
  onPreviousMonth,
  onStartDateChange,
  startDate,
  totalVisible,
}: {
  activePreset: "current-month" | "last-week" | "previous-month" | null;
  employeeId: string;
  employeeOptions: EmployeeOption[];
  endDate: string;
  monthLabel: string;
  onClear: () => void;
  onEmployeeIdChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onNextMonth: () => void;
  onPresetCurrentMonth: () => void;
  onPresetLastWeek: () => void;
  onPresetPreviousMonth: () => void;
  onPreviousMonth: () => void;
  onStartDateChange: (value: string) => void;
  startDate: string;
  totalVisible: number;
}) => {
  const selectedEmployee = employeeOptions.find((employee) => employee.id === employeeId);
  const chips = [
    activePreset && activePreset !== "current-month"
      ? {
          label:
            activePreset === "last-week" ? "Ultima semana" : "Mes anterior",
          onRemove: onPresetCurrentMonth,
        }
      : null,
    !activePreset && startDate && endDate
      ? { label: `Periodo: ${startDate} a ${endDate}`, onRemove: onPresetCurrentMonth }
      : null,
    selectedEmployee
      ? { label: `Equipo: ${selectedEmployee.name}`, onRemove: () => onEmployeeIdChange("ALL") }
      : null,
  ].filter(Boolean) as OpsFilterChip[];

  const presetButtonClass = (preset: typeof activePreset) =>
    activePreset === preset ? "bg-[#244C2D] text-white hover:bg-[#244C2D]/90" : "";

  return (
    <div className="space-y-3">
      <div className={opsSurface.toolbar}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <OpsFilterField label="Desde">
            <OpsDateFilterInput
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
            />
          </OpsFilterField>
          <OpsFilterField label="Hasta">
            <OpsDateFilterInput
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
            />
          </OpsFilterField>
          <OpsFilterField label="Equipo">
            <Select value={employeeId} onValueChange={onEmployeeIdChange}>
              <SelectTrigger className={opsFilterControlClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {employeeOptions.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OpsFilterField>
          </div>

          <div className="grid gap-4 md:grid-cols-[auto_auto] md:items-end xl:justify-items-end">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Periodos
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={presetButtonClass("last-week")}
                  onClick={onPresetLastWeek}
                >
                  Ultima semana
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={presetButtonClass("current-month")}
                  onClick={onPresetCurrentMonth}
                >
                  Mes actual
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={presetButtonClass("previous-month")}
                  onClick={onPresetPreviousMonth}
                >
                  Mes anterior
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Navegacion mensual
              </Label>
              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <div className="flex items-center gap-2 rounded-full border border-[#53985E]/15 bg-white px-2 py-1 shadow-sm shadow-[#244C2D]/5 dark:bg-[#132016]">
                  <Button type="button" size="icon-sm" variant="ghost" onClick={onPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-32 text-center text-sm font-medium capitalize">
                    {monthLabel}
                  </span>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={onNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {totalVisible} visita(s)
                </span>
                <Button type="button" size="sm" variant="ghost" onClick={onClear}>
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <OpsFilterChips chips={chips} onClear={onClear} />
    </div>
  );
};
