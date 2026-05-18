"use client";

import { useState, type ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";

import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useJobOccurrenceMutations } from "@/components/ops/hooks/useJobOccurrenceMutations";
import { JobOccurrenceTrigger } from "@/components/ops/jobs/job-occurrence-trigger";
import { getOpsStatusConfig, opsOccurrenceStatus } from "@/components/ops/shared";
import type { OpsOccurrence, OpsScheduleRule } from "@/components/ops/types";
import { toDateTimeLocalValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { occurrenceStatusValues } from "@/schemas/ops";

type OccurrenceStatus = (typeof occurrenceStatusValues)[number];

const getInitialState = (occurrence?: OpsOccurrence) => ({
  jobId: occurrence?.jobId ?? "",
  employeeId: occurrence?.employeeId ?? "",
  scheduleRuleId: occurrence?.scheduleRuleId ?? "",
  scheduledStartAt: toDateTimeLocalValue(occurrence?.scheduledStartAt),
  scheduledEndAt: toDateTimeLocalValue(occurrence?.scheduledEndAt),
  actualStartAt: toDateTimeLocalValue(occurrence?.actualStartAt),
  actualEndAt: toDateTimeLocalValue(occurrence?.actualEndAt),
  status: occurrence?.status ?? "SCHEDULED",
  notes: occurrence?.notes ?? "",
});

export const JobOccurrenceDialog = ({
  jobId,
  scheduleRules = [],
  occurrence,
  triggerClassName,
  triggerLabel,
  triggerVariant,
}: {
  jobId?: string;
  scheduleRules?: OpsScheduleRule[];
  occurrence?: OpsOccurrence;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
}) => {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(getInitialState(occurrence));
  const { employees } = useEmployees({ isActive: true });
  const { jobs } = useJobs({ includeArchived: false });
  const resolvedJobId = jobId ?? occurrence?.jobId ?? formState.jobId;
  const { createOccurrenceAsync, updateOccurrenceAsync, isCreating, isUpdating } =
    useJobOccurrenceMutations(resolvedJobId);

  const handleSubmit = async () => {
    if (occurrence) {
      await updateOccurrenceAsync({
        occurrenceId: occurrence.id,
        values: {
          employeeId: formState.employeeId || null,
          scheduledStartAt: new Date(formState.scheduledStartAt),
          scheduledEndAt: new Date(formState.scheduledEndAt),
          actualStartAt: formState.actualStartAt
            ? new Date(formState.actualStartAt)
            : null,
          actualEndAt: formState.actualEndAt ? new Date(formState.actualEndAt) : null,
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
        actualStartAt: formState.actualStartAt
          ? new Date(formState.actualStartAt)
          : undefined,
        actualEndAt: formState.actualEndAt
          ? new Date(formState.actualEndAt)
          : undefined,
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
          setFormState(getInitialState(occurrence));
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{occurrence ? "Editar visita" : "Crear visita"}</DialogTitle>
          <DialogDescription>Puede quedar sin empleada para resolverla desde la agenda.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {!jobId && !occurrence ? (
            <div className="space-y-2">
              <Label>Trabajo</Label>
              <Select value={formState.jobId} onValueChange={(nextJobId) => setFormState((current) => ({ ...current, jobId: nextJobId }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar trabajo" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Empleada</Label>
            <Select value={formState.employeeId || "none"} onValueChange={(value) => setFormState((current) => ({ ...current, employeeId: value === "none" ? "" : value }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Sin empleada asignada" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin empleada asignada</SelectItem>
                {employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Regla opcional</Label>
            <Select value={formState.scheduleRuleId || "none"} onValueChange={(value) => setFormState((current) => ({ ...current, scheduleRuleId: value === "none" ? "" : value }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Sin regla vinculada" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin regla</SelectItem>
                {scheduleRules.map((rule, index) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    Regla {index + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Inicio programado</Label><Input type="datetime-local" value={formState.scheduledStartAt} onChange={(event) => setFormState((current) => ({ ...current, scheduledStartAt: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Fin programado</Label><Input type="datetime-local" value={formState.scheduledEndAt} onChange={(event) => setFormState((current) => ({ ...current, scheduledEndAt: event.target.value }))} /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Inicio real</Label><Input type="datetime-local" value={formState.actualStartAt} onChange={(event) => setFormState((current) => ({ ...current, actualStartAt: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Fin real</Label><Input type="datetime-local" value={formState.actualEndAt} onChange={(event) => setFormState((current) => ({ ...current, actualEndAt: event.target.value }))} /></div>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={formState.status}
              onValueChange={(value) =>
                setFormState((current) => ({
                  ...current,
                  status: value as OccurrenceStatus,
                }))
              }
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {occurrenceStatusValues.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getOpsStatusConfig(opsOccurrenceStatus, status).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Notas</Label><Textarea value={formState.notes} onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={isPending || !resolvedJobId || !formState.scheduledStartAt || !formState.scheduledEndAt} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Guardar visita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
