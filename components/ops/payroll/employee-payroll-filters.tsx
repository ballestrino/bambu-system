"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  OpsDateFilterInput,
  OpsFilterChips,
  OpsFilterField,
  opsSurface,
  type OpsFilterChip,
} from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const EmployeePayrollFilters = ({
  activePreset,
  endDate,
  monthLabel,
  onClear,
  onEndDateChange,
  onNextMonth,
  onPresetCurrentMonth,
  onPresetPreviousMonth,
  onPreviousMonth,
  onStartDateChange,
  paymentCount,
  startDate,
}: {
  activePreset: "current-month" | "previous-month" | null;
  endDate: string;
  monthLabel: string;
  onClear: () => void;
  onEndDateChange: (value: string) => void;
  onNextMonth: () => void;
  onPresetCurrentMonth: () => void;
  onPresetPreviousMonth: () => void;
  onPreviousMonth: () => void;
  onStartDateChange: (value: string) => void;
  paymentCount: number;
  startDate: string;
}) => {
  const chips = [
    activePreset === "previous-month"
      ? { label: "Mes anterior", onRemove: onPresetCurrentMonth }
      : null,
    !activePreset && startDate && endDate
      ? { label: `Periodo: ${startDate} a ${endDate}`, onRemove: onPresetCurrentMonth }
      : null,
  ].filter(Boolean) as OpsFilterChip[];

  const presetButtonClass = (preset: typeof activePreset) =>
    activePreset === preset ? "bg-[#244C2D] text-white hover:bg-[#244C2D]/90" : "";

  return (
    <div className="space-y-3">
      <div className={opsSurface.toolbar}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="grid gap-3 sm:grid-cols-2">
            <OpsFilterField label="Periodo desde">
              <OpsDateFilterInput
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
              />
            </OpsFilterField>
            <OpsFilterField label="Periodo hasta">
              <OpsDateFilterInput
                value={endDate}
                onChange={(event) => onEndDateChange(event.target.value)}
              />
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
                <div className="flex items-center gap-2 rounded-full border border-[#53985E]/15 bg-white px-2 py-1 shadow-sm shadow-[#244C2D]/5 dark:bg-[#1A211A]">
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
                  {paymentCount} pago(s)
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
