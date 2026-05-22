"use client";

import { useRef, useState, type ComponentProps } from "react";
import { ClockArrowUp, LoaderCircle } from "lucide-react";

import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useJobOccurrenceMutations } from "@/components/ops/hooks/useJobOccurrenceMutations";
import { useJobScheduleRules } from "@/components/ops/hooks/useJobScheduleRules";
import {
  clearOccurrenceActualTimes,
  getInitialOccurrenceState,
  getResolvedActualTimes,
  syncOccurrenceActualTimes,
  updateOccurrenceScheduledTime,
} from "@/components/ops/jobs/job-occurrence-dialog-utils";
import { JobOccurrenceEmployeeField } from "@/components/ops/jobs/job-occurrence-employee-field";
import { getJobScheduleRuleOptionLabel } from "@/components/ops/jobs/job-schedule-rule-label";
import { JobOccurrenceTrigger } from "@/components/ops/jobs/job-occurrence-trigger";
import {
  getOpsStatusConfig, OpsFormBody, OpsFormDialogContent, OpsFormField,
  OpsFormFooter, OpsFormGrid, OpsFormHeader, opsFormControlClass,
  opsFormSelectTriggerClass, opsFormTextareaClass, opsOccurrenceStatus,
} from "@/components/ops/shared";
import type { OpsOccurrence, OpsScheduleRule } from "@/components/ops/types";
import { parseDateTimeLocalValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { occurrenceStatusValues } from "@/schemas/ops";

type OccurrenceStatus = (typeof occurrenceStatusValues)[number];

export const JobOccurrenceDialog = ({
  completeOnSave = false,
  jobId,
  scheduleRules = [],
  occurrence,
  triggerClassName,
  triggerLabel,
  triggerVariant,
}: {
  completeOnSave?: boolean;
  jobId?: string;
  scheduleRules?: OpsScheduleRule[];
  occurrence?: OpsOccurrence;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
}) => {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(
    getInitialOccurrenceState(occurrence, completeOnSave)
  );
  const actualStartAtInputRef = useRef<HTMLInputElement>(null);
  const actualEndAtInputRef = useRef<HTMLInputElement>(null);
  const { employees } = useEmployees({ isActive: true });
  const { jobs } = useJobs({ includeArchived: false });
  const resolvedJobId = jobId ?? occurrence?.jobId ?? formState.jobId;
  const shouldLoadScheduleRules = Boolean(resolvedJobId);
  const { scheduleRules: fetchedScheduleRules } = useJobScheduleRules(
    resolvedJobId ? { jobId: resolvedJobId, isActive: true } : undefined,
    {
      enabled: shouldLoadScheduleRules,
    }
  );
  const { createOccurrenceAsync, updateOccurrenceAsync, isCreating, isUpdating } =
    useJobOccurrenceMutations(resolvedJobId);
  const currentScheduleRule =
    occurrence?.scheduleRule && occurrence.scheduleRule.jobId === resolvedJobId
      ? occurrence.scheduleRule
      : null;
  const availableScheduleRules = [...scheduleRules, ...fetchedScheduleRules];
  const mergedScheduleRules = availableScheduleRules.reduce<OpsScheduleRule[]>(
    (rules, rule) => {
      if (
        rule.jobId === resolvedJobId &&
        !rules.some((currentRule) => currentRule.id === rule.id)
      ) {
        rules.push(rule);
      }

      return rules;
    },
    []
  );
  const scheduleRuleOptions =
    currentScheduleRule &&
    !mergedScheduleRules.some((rule) => rule.id === currentScheduleRule.id)
      ? [currentScheduleRule, ...mergedScheduleRules]
      : mergedScheduleRules;
  const selectedScheduleRuleId = scheduleRuleOptions.some(
    (rule) => rule.id === formState.scheduleRuleId
  )
    ? formState.scheduleRuleId
    : "";

  const handleSubmit = () => {
    const submittedFormState = {
      ...formState,
      actualStartAt:
        actualStartAtInputRef.current?.value ?? formState.actualStartAt,
      actualEndAt: actualEndAtInputRef.current?.value ?? formState.actualEndAt,
    };
    const { actualEndAt, actualStartAt } =
      getResolvedActualTimes(submittedFormState);
    const scheduledStartAt = parseDateTimeLocalValue(
      submittedFormState.scheduledStartAt
    );
    const scheduledEndAt = parseDateTimeLocalValue(
      submittedFormState.scheduledEndAt
    );
    const resolvedScheduleRuleId = selectedScheduleRuleId || null;

    if (!scheduledStartAt || !scheduledEndAt) {
      return;
    }

    setOpen(false);

    if (occurrence) {
      const nextIsDetached = resolvedScheduleRuleId
        ? false
        : occurrence.scheduleRuleId
          ? true
          : occurrence.isDetached;

      void updateOccurrenceAsync({
        occurrenceId: occurrence.id,
        onErrorAction: () => setOpen(true),
        values: {
          employeeIds: formState.employeeIds,
          scheduleRuleId: resolvedScheduleRuleId,
          scheduledStartAt,
          scheduledEndAt,
          actualStartAt: actualStartAt ?? null,
          actualEndAt: actualEndAt ?? null,
          isDetached: nextIsDetached,
          status: formState.status as OccurrenceStatus,
          notes: formState.notes,
        },
      }).catch(() => undefined);
    } else {
      void createOccurrenceAsync({
        jobId: resolvedJobId,
        onErrorAction: () => setOpen(true),
        employeeIds: formState.employeeIds,
        scheduleRuleId: formState.scheduleRuleId || undefined,
        scheduledStartAt,
        scheduledEndAt,
        actualStartAt,
        actualEndAt,
        status: formState.status as OccurrenceStatus,
        isDetached: false,
        notes: formState.notes || undefined,
      }).catch(() => undefined);
    }
  };

  const handleClearActualTimes = () => {
    const nextFormState = clearOccurrenceActualTimes(formState);
    if (actualStartAtInputRef.current) actualStartAtInputRef.current.value = "";
    if (actualEndAtInputRef.current) actualEndAtInputRef.current.value = "";
    setFormState(nextFormState);
  };

  const handleSyncActualTimes = () => {
    const nextFormState = syncOccurrenceActualTimes(formState);
    if (actualStartAtInputRef.current) {
      actualStartAtInputRef.current.value = nextFormState.actualStartAt;
    }
    if (actualEndAtInputRef.current) {
      actualEndAtInputRef.current.value = nextFormState.actualEndAt;
    }
    setFormState(nextFormState);
  };

  const handleActualTimeInput = (
    field: "actualEndAt" | "actualStartAt",
    value: string
  ) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setFormState(getInitialOccurrenceState(occurrence, completeOnSave));
        }

        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <JobOccurrenceTrigger
          isEditing={Boolean(occurrence)}
          triggerClassName={triggerClassName}
          triggerLabel={triggerLabel}
          triggerVariant={triggerVariant}
        />
      </DialogTrigger>
      <OpsFormDialogContent size="md">
        <OpsFormHeader>
          <DialogTitle>{occurrence ? "Editar visita" : "Crear visita"}</DialogTitle>
          <DialogDescription>Puede quedar sin equipo para resolverla desde la agenda.</DialogDescription>
        </OpsFormHeader>
        <OpsFormBody className="grid gap-4">
          {!jobId && !occurrence ? (
            <OpsFormField label="Trabajo">
              <Select value={formState.jobId} onValueChange={(nextJobId) => setFormState((current) => ({ ...current, jobId: nextJobId }))}>
                <SelectTrigger className={opsFormSelectTriggerClass}><SelectValue placeholder="Seleccionar trabajo" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </OpsFormField>
          ) : null}
          <JobOccurrenceEmployeeField
            employees={employees}
            selectedEmployeeIds={formState.employeeIds}
            onChange={(employeeIds) =>
              setFormState((current) => ({ ...current, employeeIds }))
            }
          />
          <OpsFormField label="Regla opcional">
            <Select value={selectedScheduleRuleId || "none"} onValueChange={(value) => setFormState((current) => ({ ...current, scheduleRuleId: value === "none" ? "" : value }))} disabled={!resolvedJobId}>
              <SelectTrigger className={opsFormSelectTriggerClass}><SelectValue placeholder={resolvedJobId ? "Sin regla vinculada" : "Selecciona un trabajo primero"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin regla</SelectItem>
                {scheduleRuleOptions.map((rule) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {getJobScheduleRuleOptionLabel(rule)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OpsFormField>
          <OpsFormGrid>
            <OpsFormField label="Inicio programado"><Input className={opsFormControlClass} type="datetime-local" value={formState.scheduledStartAt} onChange={(event) => setFormState((current) => updateOccurrenceScheduledTime({ field: "scheduledStartAt", formState: current, occurrence, value: event.target.value }))} /></OpsFormField>
            <OpsFormField label="Fin programado"><Input className={opsFormControlClass} type="datetime-local" value={formState.scheduledEndAt} onChange={(event) => setFormState((current) => updateOccurrenceScheduledTime({ field: "scheduledEndAt", formState: current, occurrence, value: event.target.value }))} /></OpsFormField>
          </OpsFormGrid>
          <div className="flex items-center justify-between gap-3 rounded-md border border-[#53985E]/15 bg-[#F7FBF7] px-3 py-2 text-sm text-[#244C2D] dark:bg-[#132016] dark:text-[#EAF5EC]">
            <span>Horario real</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={handleClearActualTimes}
              >
                Limpiar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={!formState.scheduledStartAt || !formState.scheduledEndAt}
                onClick={handleSyncActualTimes}
              >
                <ClockArrowUp className="h-4 w-4" />
                Sincronizar
              </Button>
            </div>
          </div>
          <OpsFormGrid>
            <OpsFormField label="Inicio real">
              <Input
                ref={actualStartAtInputRef}
                className={opsFormControlClass}
                type="datetime-local"
                value={formState.actualStartAt}
                onInput={(event) =>
                  handleActualTimeInput(
                    "actualStartAt",
                    event.currentTarget.value
                  )
                }
                onChange={(event) =>
                  handleActualTimeInput("actualStartAt", event.target.value)
                }
              />
            </OpsFormField>
            <OpsFormField label="Fin real">
              <Input
                ref={actualEndAtInputRef}
                className={opsFormControlClass}
                type="datetime-local"
                value={formState.actualEndAt}
                onInput={(event) =>
                  handleActualTimeInput("actualEndAt", event.currentTarget.value)
                }
                onChange={(event) =>
                  handleActualTimeInput("actualEndAt", event.target.value)
                }
              />
            </OpsFormField>
          </OpsFormGrid>
          <OpsFormField label="Estado">
            <Select
              value={formState.status}
              onValueChange={(value) =>
                setFormState((current) => ({
                  ...current,
                  status: value as OccurrenceStatus,
                }))
              }
            >
              <SelectTrigger className={opsFormSelectTriggerClass}><SelectValue /></SelectTrigger>
              <SelectContent>
                {occurrenceStatusValues.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getOpsStatusConfig(opsOccurrenceStatus, status).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OpsFormField>
          <OpsFormField label="Notas"><Textarea className={opsFormTextareaClass} value={formState.notes} onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))} /></OpsFormField>
        </OpsFormBody>
        <OpsFormFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={isPending || !resolvedJobId || !formState.scheduledStartAt || !formState.scheduledEndAt} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Guardar visita
          </Button>
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};
