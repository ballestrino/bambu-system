"use client";

import type { ReactNode } from "react";

import { opsFormControlClass } from "@/components/ops/shared";
import {
  formDurationMinutes,
  generateRangeFor,
  type RuleFormState,
  type RuleFrequency,
} from "@/components/ops/schedule-rules/rule-form-model";
import { RuleSegmented } from "@/components/ops/schedule-rules/rule-segmented";
import { DAY_LETTERS, DAY_NAMES, dayLabel, durationLabel } from "@/components/ops/schedule-rules/schedule-rules-model";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const frequencyOptions: { label: string; value: RuleFrequency }[] = [
  { label: "Semanal", value: "WEEKLY" },
  { label: "Cada día", value: "DAILY" },
  { label: "Mensual", value: "MONTHLY" },
];

const unitLabels: Record<RuleFrequency, string> = { DAILY: "días", MONTHLY: "meses", WEEKLY: "semanas" };

const Field = ({ children, label }: { children: ReactNode; label: string }) => (
  <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold text-ops-text">
    {label}
    {children}
  </label>
);

const Hint = ({ children }: { children: ReactNode }) => <p className="-mt-2 text-[13px] text-ops-text-muted">{children}</p>;

// Campos de un horario: los usan el panel del escritorio, la hoja de nuevo
// horario y la pantalla del horario en el celular.
export const RuleFormFields = ({
  error,
  form,
  mode,
  onChange,
  todayKey,
}: {
  error: string;
  form: RuleFormState;
  mode: "new" | "rule";
  onChange: (patch: Partial<RuleFormState>) => void;
  todayKey: string;
}) => {
  const duration = formDurationMinutes(form);
  const range = generateRangeFor(form, todayKey);
  const toggleDay = (day: number) =>
    onChange({
      weekdays: form.weekdays.includes(day)
        ? form.weekdays.filter((value) => value !== day)
        : [...form.weekdays, day].sort((a, b) => a - b),
    });

  return (
    <div className="flex flex-col gap-4">
      <RuleSegmented label="Frecuencia" onChange={(frequency) => onChange({ frequency })} options={frequencyOptions} value={form.frequency} />
      {form.frequency === "WEEKLY" ? (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ops-text">Días</span>
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_LETTERS.map((letter, index) => {
              const active = form.weekdays.includes(index + 1);
              return (
                <button
                  aria-label={DAY_NAMES[index]}
                  aria-pressed={active}
                  className={cn(
                    "h-11 rounded-[10px] border text-sm font-semibold transition-colors",
                    active
                      ? "border-ops-bamboo-strong bg-ops-bamboo-strong text-white dark:text-ops-canvas"
                      : "border-ops-border bg-ops-surface text-ops-text hover:bg-ops-surface-muted"
                  )}
                  key={letter}
                  onClick={() => toggleDay(index + 1)}
                  type="button"
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2.5">
        {form.frequency === "MONTHLY" ? (
          <Field label="Día del mes">
            <Input className={opsFormControlClass} max={31} min={1} onChange={(event) => onChange({ dayOfMonth: event.target.value })} type="number" value={form.dayOfMonth} />
          </Field>
        ) : null}
        <Field label={`Se repite cada (${unitLabels[form.frequency]})`}>
          <Input className={opsFormControlClass} min={1} onChange={(event) => onChange({ interval: event.target.value })} type="number" value={form.interval} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Entra">
          <Input className={opsFormControlClass} onChange={(event) => onChange({ start: event.target.value })} type="time" value={form.start} />
        </Field>
        <Field label="Sale">
          <Input className={opsFormControlClass} onChange={(event) => onChange({ end: event.target.value })} type="time" value={form.end} />
        </Field>
      </div>
      <Hint>{duration > 0 ? `Duración: ${durationLabel(duration)}` : "Duración: revisar los horarios"}</Hint>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Desde">
          <Input className={opsFormControlClass} onChange={(event) => onChange({ startKey: event.target.value })} type="date" value={form.startKey} />
        </Field>
        <Field label="Hasta">
          <Input className={opsFormControlClass} onChange={(event) => onChange({ endKey: event.target.value })} type="date" value={form.endKey} />
        </Field>
      </div>
      <Hint>Sin fecha final, el horario sigue hasta que se termine.</Hint>
      {mode === "rule" ? (
        <>
          <Field label="El cambio corre desde">
            <Input className={opsFormControlClass} onChange={(event) => onChange({ applyFrom: event.target.value })} type="date" value={form.applyFrom} />
          </Field>
          <Hint>Desde esa fecha se rehacen las visitas sin tocar. Las anteriores, las editadas y las realizadas quedan como están.</Hint>
        </>
      ) : (
        <label className="flex min-h-11 items-center gap-2.5 text-sm text-ops-text">
          <input
            checked={form.generate}
            className="size-[18px] shrink-0 accent-[var(--ops-bamboo-strong)]"
            disabled={!range}
            onChange={() => onChange({ generate: !form.generate })}
            type="checkbox"
          />
          {range ? `Generar sus visitas al guardar, hasta el ${dayLabel(range.endDate)}` : "Las fechas no dejan generar visitas"}
        </label>
      )}
      {error ? (
        <p className="text-[13px] font-medium text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
