"use client";

import { useMemo, useState } from "react";
import { CalendarSearch, Plus } from "lucide-react";

import {
  formatDurationMinutes,
  formatMinuteOfDay,
  getRangeMinutes,
} from "@/lib/ops/minute-ranges";
import {
  DEFAULT_AVAILABILITY_WINDOW,
  type ScheduleAvailabilityRule,
} from "@/lib/ops/schedule-availability";
import {
  DEFAULT_GAP_MINUTES,
  findScheduleGaps,
  type ScheduleGap,
} from "@/lib/ops/schedule-gaps";
import type { WeeklySchedule } from "@/lib/ops/schedule-types";
import { SchedulePanelDialog } from "@/components/ops/schedules/schedule-panel-dialog";
import { OpsFormField, opsFormSelectTriggerClass } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ScheduleGapPick = {
  dateKey: string;
  employeeId: string;
  endMinute: number;
  startMinute: number;
};

const durationOptions = [60, 90, 120, 180, 240];

const groupGapsByDay = (gaps: ScheduleGap[]) =>
  gaps.reduce((days, gap) => {
    const current = days.get(gap.dateKey);
    if (current) {
      current.gaps.push(gap);
    } else {
      days.set(gap.dateKey, { gaps: [gap], label: gap.dayLabel });
    }

    return days;
  }, new Map<string, { gaps: ScheduleGap[]; label: string }>());

export const ScheduleGapFinder = ({
  onOpenChange,
  onPick,
  open,
  rules,
  schedule,
  visibleWeekdays,
}: {
  onOpenChange: (open: boolean) => void;
  onPick: (pick: ScheduleGapPick) => void;
  open: boolean;
  rules: ScheduleAvailabilityRule[];
  schedule: WeeklySchedule;
  visibleWeekdays: number[];
}) => {
  const [minimumMinutes, setMinimumMinutes] = useState(DEFAULT_GAP_MINUTES);
  const days = useMemo(
    () =>
      groupGapsByDay(
        findScheduleGaps({
          employees: schedule.employees,
          minimumMinutes,
          rules,
          weekdays: visibleWeekdays,
        })
      ),
    [minimumMinutes, rules, schedule, visibleWeekdays]
  );

  return (
    <SchedulePanelDialog
      description="Tramos libres dentro de la disponibilidad de cada empleada, sin las visitas ya agendadas."
      eyebrow="Cronograma"
      icon={CalendarSearch}
      onOpenChange={onOpenChange}
      open={open}
      title="Buscar huecos"
    >
      <div className="space-y-4">
        <OpsFormField
          description={`Sin disponibilidad cargada se usa la jornada por defecto (${formatMinuteOfDay(DEFAULT_AVAILABILITY_WINDOW.startMinute)} a ${formatMinuteOfDay(DEFAULT_AVAILABILITY_WINDOW.endMinute)}).`}
          label="Duración del servicio"
        >
          <Select
            onValueChange={(value) => setMinimumMinutes(Number(value))}
            value={String(minimumMinutes)}
          >
            <SelectTrigger className={opsFormSelectTriggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {formatDurationMinutes(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </OpsFormField>

        {days.size ? (
          <div className="space-y-3">
            {[...days.entries()].map(([dateKey, day]) => (
              <div className="space-y-1" key={dateKey}>
                <p className="text-xs font-semibold uppercase tracking-wide text-ops-bamboo-strong">
                  {day.label}
                </p>
                <ul className="divide-y divide-ops-border rounded-[var(--ops-radius-row)] border border-ops-border">
                  {day.gaps.map((gap) => (
                    <li
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                      key={`${gap.employeeId}-${gap.startMinute}`}
                    >
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-ops-text">
                          {gap.employeeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatMinuteOfDay(gap.startMinute)} a{" "}
                          {formatMinuteOfDay(gap.endMinute)} ·{" "}
                          {formatDurationMinutes(getRangeMinutes(gap))} libres
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          onPick({
                            dateKey: gap.dateKey,
                            employeeId: gap.employeeId,
                            endMinute: gap.startMinute + minimumMinutes,
                            startMinute: gap.startMinute,
                          })
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Agendar
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--ops-radius-row)] border border-dashed border-ops-border p-4 text-sm text-muted-foreground">
            No quedan huecos de {formatDurationMinutes(minimumMinutes)} en los días
            visibles. Probá con menos duración, mostrá más días o revisá la
            disponibilidad del equipo.
          </p>
        )}
      </div>
    </SchedulePanelDialog>
  );
};
