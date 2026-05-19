"use client";

import { useState, type ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";

import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useJobOccurrenceMutations } from "@/components/ops/hooks/useJobOccurrenceMutations";
import {
  getInitialOccurrenceState,
  getResolvedActualTimes,
} from "@/components/ops/jobs/job-occurrence-dialog-utils";
import { JobOccurrenceTrigger } from "@/components/ops/jobs/job-occurrence-trigger";
import {
  getOpsStatusConfig, OpsFormBody, OpsFormDialogContent, OpsFormField,
  OpsFormFooter, OpsFormGrid, OpsFormHeader, opsFormControlClass,
  opsFormSelectTriggerClass, opsFormTextareaClass, opsOccurrenceStatus,
} from "@/components/ops/shared";
import type { OpsOccurrence, OpsScheduleRule } from "@/components/ops/types";
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
  const { employees } = useEmployees({ isActive: true });
  const { jobs } = useJobs({ includeArchived: false });
  const resolvedJobId = jobId ?? occurrence?.jobId ?? formState.jobId;
  const { createOccurrenceAsync, updateOccurrenceAsync, isCreating, isUpdating } =
    useJobOccurrenceMutations(resolvedJobId);

  const handleSubmit = async () => {
    const { actualEndAt, actualStartAt } = getResolvedActualTimes(
      formState,
      completeOnSave
    );

    if (occurrence) {
      await updateOccurrenceAsync({
        occurrenceId: occurrence.id,
        values: {
          employeeId: formState.employeeId || null,
          scheduledStartAt: new Date(formState.scheduledStartAt),
          scheduledEndAt: new Date(formState.scheduledEndAt),
          actualStartAt: actualStartAt ?? null,
          actualEndAt: actualEndAt ?? null,
          status: formState.status as OccurrenceStatus,
          notes: formState.notes,
        },
      });
    } else {
      await createOccurrenceAsync({
        jobId: resolvedJobId,
        employeeId: formState.employeeId || undefined,
        scheduleRuleId: formState.scheduleRuleId || undefined,
        scheduledStartAt: new Date(formState.scheduledStartAt),
        scheduledEndAt: new Date(formState.scheduledEndAt),
        actualStartAt,
        actualEndAt,
        status: formState.status as OccurrenceStatus,
        isDetached: false,
        notes: formState.notes || undefined,
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
          <DialogDescription>Puede quedar sin empleada para resolverla desde la agenda.</DialogDescription>
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
          <OpsFormField label="Empleada">
            <Select value={formState.employeeId || "none"} onValueChange={(value) => setFormState((current) => ({ ...current, employeeId: value === "none" ? "" : value }))}>
              <SelectTrigger className={opsFormSelectTriggerClass}><SelectValue placeholder="Sin empleada asignada" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin empleada asignada</SelectItem>
                {employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </OpsFormField>
          <OpsFormField label="Regla opcional">
            <Select value={formState.scheduleRuleId || "none"} onValueChange={(value) => setFormState((current) => ({ ...current, scheduleRuleId: value === "none" ? "" : value }))}>
              <SelectTrigger className={opsFormSelectTriggerClass}><SelectValue placeholder="Sin regla vinculada" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin regla</SelectItem>
                {scheduleRules.map((rule, index) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    Regla {index + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OpsFormField>
          <OpsFormGrid>
            <OpsFormField label="Inicio programado"><Input className={opsFormControlClass} type="datetime-local" value={formState.scheduledStartAt} onChange={(event) => setFormState((current) => ({ ...current, scheduledStartAt: event.target.value }))} /></OpsFormField>
            <OpsFormField label="Fin programado"><Input className={opsFormControlClass} type="datetime-local" value={formState.scheduledEndAt} onChange={(event) => setFormState((current) => ({ ...current, scheduledEndAt: event.target.value }))} /></OpsFormField>
          </OpsFormGrid>
          <OpsFormGrid>
            <OpsFormField label="Inicio real"><Input className={opsFormControlClass} type="datetime-local" value={formState.actualStartAt} onChange={(event) => setFormState((current) => ({ ...current, actualStartAt: event.target.value }))} /></OpsFormField>
            <OpsFormField label="Fin real"><Input className={opsFormControlClass} type="datetime-local" value={formState.actualEndAt} onChange={(event) => setFormState((current) => ({ ...current, actualEndAt: event.target.value }))} /></OpsFormField>
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
