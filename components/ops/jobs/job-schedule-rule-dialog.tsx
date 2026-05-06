"use client";

import { useState } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import { useJobScheduleRuleMutations } from "@/components/ops/hooks/useJobScheduleRuleMutations";
import type { OpsScheduleRule } from "@/components/ops/types";
import { minutesToTimeInput, timeInputToMinutes, toDateInputValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { recurrenceFrequencyValues } from "@/schemas/ops";

type RecurrenceFrequency = (typeof recurrenceFrequencyValues)[number];

const weekdayOptions = [
  { value: 1, label: "L" },
  { value: 2, label: "M" },
  { value: 3, label: "X" },
  { value: 4, label: "J" },
  { value: 5, label: "V" },
  { value: 6, label: "S" },
  { value: 7, label: "D" },
];

const getInitialState = (rule?: OpsScheduleRule) => ({
  isActive: rule?.isActive ?? true,
  frequency: rule?.frequency ?? "WEEKLY",
  interval: String(rule?.interval ?? 1),
  weekdays: rule?.weekdays ?? [1],
  dayOfMonth: rule?.dayOfMonth ? String(rule.dayOfMonth) : "",
  startDate: toDateInputValue(rule?.startDate),
  endDate: toDateInputValue(rule?.endDate),
  startTime: minutesToTimeInput(rule?.startTimeMinutes ?? 9 * 60),
  durationMinutes: String(rule?.durationMinutes ?? 60),
});

export const JobScheduleRuleDialog = ({
  jobId,
  rule,
}: {
  jobId: string;
  rule?: OpsScheduleRule;
}) => {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(getInitialState(rule));
  const { createScheduleRuleAsync, updateScheduleRuleAsync, isCreating, isUpdating } =
    useJobScheduleRuleMutations(jobId);

  const toggleWeekday = (day: number) => {
    setFormState((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day)
        ? current.weekdays.filter((value: number) => value !== day)
        : [...current.weekdays, day].sort(),
    }));
  };

  const handleSubmit = async () => {
    const sharedPayload = {
      isActive: formState.isActive,
      frequency: formState.frequency as (typeof recurrenceFrequencyValues)[number],
      interval: Number(formState.interval),
      weekdays: formState.weekdays,
      startDate: new Date(`${formState.startDate}T00:00:00`),
      startTimeMinutes: timeInputToMinutes(formState.startTime),
      durationMinutes: Number(formState.durationMinutes),
      timezone: "America/Montevideo",
    };

    if (rule) {
      await updateScheduleRuleAsync({
        scheduleRuleId: rule.id,
        values: {
          ...sharedPayload,
          dayOfMonth: formState.dayOfMonth ? Number(formState.dayOfMonth) : null,
          endDate: formState.endDate
            ? new Date(`${formState.endDate}T00:00:00`)
            : null,
        },
      });
    } else {
      await createScheduleRuleAsync({
        jobId,
        ...sharedPayload,
        dayOfMonth: formState.dayOfMonth
          ? Number(formState.dayOfMonth)
          : undefined,
        endDate: formState.endDate
          ? new Date(`${formState.endDate}T00:00:00`)
          : undefined,
      });
    }

    setOpen(false);
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setFormState(getInitialState(rule));
        }

        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {rule ? (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nueva regla
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule ? "Editar regla" : "Crear regla"}</DialogTitle>
          <DialogDescription>Define la recurrencia base del trabajo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            Regla activa
            <Switch checked={formState.isActive} onCheckedChange={(checked) => setFormState((current) => ({ ...current, isActive: checked }))} />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Frecuencia</Label><Select value={formState.frequency} onValueChange={(value) => setFormState((current) => ({ ...current, frequency: value as RecurrenceFrequency }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{recurrenceFrequencyValues.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Intervalo</Label><Input type="number" min="1" value={formState.interval} onChange={(event) => setFormState((current) => ({ ...current, interval: event.target.value }))} /></div>
          </div>
          {formState.frequency === "WEEKLY" ? (
            <div className="space-y-2">
              <Label>Días</Label>
              <div className="flex flex-wrap gap-2">
                {weekdayOptions.map((day) => (
                  <Button key={day.value} type="button" variant={formState.weekdays.includes(day.value) ? "default" : "outline"} size="sm" onClick={() => toggleWeekday(day.value)}>
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {formState.frequency === "MONTHLY" ? (
            <div className="space-y-2"><Label>Día del mes</Label><Input type="number" min="1" max="31" value={formState.dayOfMonth} onChange={(event) => setFormState((current) => ({ ...current, dayOfMonth: event.target.value }))} /></div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Fecha inicial</Label><Input type="date" value={formState.startDate} onChange={(event) => setFormState((current) => ({ ...current, startDate: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Fecha final</Label><Input type="date" value={formState.endDate} onChange={(event) => setFormState((current) => ({ ...current, endDate: event.target.value }))} /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Hora de inicio</Label><Input type="time" value={formState.startTime} onChange={(event) => setFormState((current) => ({ ...current, startTime: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Duración (min)</Label><Input type="number" min="1" value={formState.durationMinutes} onChange={(event) => setFormState((current) => ({ ...current, durationMinutes: event.target.value }))} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={isPending || !formState.startDate} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Guardar regla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
