"use client";

import { useState } from "react";

import { parseMinuteOfDay } from "@/lib/ops/minute-ranges";
import { getAvailabilityWeekdayLabel } from "@/lib/ops/schedule-availability";
import { ALL_WEEKDAYS } from "@/components/ops/schedules/schedule-weekday-filter";
import {
  OpsFormField,
  OpsFormGrid,
  opsFormControlClass,
} from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateEmployeeAvailabilityRuleInput } from "@/schemas/ops";
import { cn } from "@/lib/utils";

const kindOptions = [
  { description: "No puede trabajar en ese tramo", label: "No disponible", value: "UNAVAILABLE" },
  { description: "Solo trabaja en ese tramo", label: "Solo disponible", value: "AVAILABLE" },
] as const;

const defaultForm = {
  endTime: "13:00",
  kind: "UNAVAILABLE" as CreateEmployeeAvailabilityRuleInput["kind"],
  note: "",
  startTime: "08:00",
  weekdays: [] as number[],
};

export const ScheduleAvailabilityForm = ({
  employeeId,
  isPending,
  onSubmit,
}: {
  employeeId: string;
  isPending: boolean;
  onSubmit: (values: CreateEmployeeAvailabilityRuleInput) => Promise<void>;
}) => {
  const [form, setForm] = useState(defaultForm);
  const startMinute = parseMinuteOfDay(form.startTime);
  const endMinute = parseMinuteOfDay(form.endTime);
  const isValid =
    Boolean(employeeId) &&
    startMinute !== null &&
    endMinute !== null &&
    endMinute > startMinute;

  const toggleWeekday = (weekday: number) =>
    setForm((current) => ({
      ...current,
      weekdays: current.weekdays.includes(weekday)
        ? current.weekdays.filter((value) => value !== weekday)
        : [...current.weekdays, weekday].sort((left, right) => left - right),
    }));

  const submit = async () => {
    if (!isValid) return;

    await onSubmit({
      employeeId,
      endMinute: endMinute!,
      kind: form.kind,
      note: form.note.trim() || undefined,
      startMinute: startMinute!,
      weekdays: form.weekdays,
    });
    setForm(defaultForm);
  };

  return (
    <div className="space-y-4 rounded-[var(--ops-radius-row)] bg-ops-surface-muted p-3">
      <OpsFormField label="Tipo de regla">
        <div className="grid grid-cols-2 gap-2">
          {kindOptions.map((option) => (
            <button
              className={cn(
                "rounded-[var(--ops-radius-control)] border px-3 py-2 text-left text-xs transition-colors",
                form.kind === option.value
                  ? "border-ops-bamboo bg-ops-bamboo-soft text-ops-bamboo-strong"
                  : "border-ops-border bg-ops-surface text-muted-foreground hover:border-ops-bamboo/40"
              )}
              key={option.value}
              onClick={() => setForm((current) => ({ ...current, kind: option.value }))}
              type="button"
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="block">{option.description}</span>
            </button>
          ))}
        </div>
      </OpsFormField>

      <OpsFormField
        description="Sin días marcados la regla aplica a toda la semana."
        label="Días"
      >
        <div className="flex flex-wrap items-center gap-1">
          {ALL_WEEKDAYS.map((weekday) => (
            <Button
              aria-pressed={form.weekdays.includes(weekday)}
              className="h-8 min-w-11 rounded-full px-2 text-xs font-semibold"
              key={weekday}
              onClick={() => toggleWeekday(weekday)}
              size="sm"
              type="button"
              variant={form.weekdays.includes(weekday) ? "default" : "outline"}
            >
              {getAvailabilityWeekdayLabel(weekday)}
            </Button>
          ))}
        </div>
      </OpsFormField>

      <OpsFormGrid>
        <OpsFormField label="Desde">
          <Input
            className={opsFormControlClass}
            onChange={(event) =>
              setForm((current) => ({ ...current, startTime: event.target.value }))
            }
            type="time"
            value={form.startTime}
          />
        </OpsFormField>
        <OpsFormField label="Hasta">
          <Input
            className={opsFormControlClass}
            onChange={(event) =>
              setForm((current) => ({ ...current, endTime: event.target.value }))
            }
            type="time"
            value={form.endTime}
          />
        </OpsFormField>
      </OpsFormGrid>

      <OpsFormField label="Nota">
        <Input
          className={opsFormControlClass}
          maxLength={255}
          onChange={(event) =>
            setForm((current) => ({ ...current, note: event.target.value }))
          }
          placeholder="Estudia de tarde, cuida a su hija..."
          value={form.note}
        />
      </OpsFormField>

      <Button disabled={!isValid || isPending} onClick={submit} size="sm" type="button">
        Agregar regla
      </Button>
    </div>
  );
};
