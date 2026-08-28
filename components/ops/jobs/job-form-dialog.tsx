"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  getOpsStatusConfig, OpsFormBody, OpsFormDialogContent, OpsFormField,
  OpsFormFooter, OpsFormGrid, OpsFormHeader, opsFormControlClass,
  opsFormPanelClass, opsFormSelectTriggerClass, opsFormTextareaClass,
  opsJobStatus,
} from "@/components/ops/shared";
import { JobBudgetTaxModeToggle } from "@/components/ops/jobs/job-budget-tax-mode-toggle";
import { BudgetSourceSelector } from "@/components/ops/jobs/budget-source-selector";
import { JobTypeFields } from "@/components/ops/jobs/job-type-fields";
import {
  JobFormTrigger,
  type JobFormTriggerProps,
} from "@/components/ops/jobs/job-form-trigger";
import {
  getInitialJobFormState,
  type JobFormJob,
} from "@/components/ops/jobs/job-form-state";
import { useJobMutations } from "@/components/ops/hooks/useJobMutations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { jobStatusValues } from "@/schemas/ops";

export const JobFormDialog = ({
  job,
  triggerClassName,
  triggerLabel,
  triggerVariant,
}: JobFormTriggerProps & { job?: JobFormJob }) => {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(getInitialJobFormState(job));
  const { createJobAsync, updateJobAsync, isCreating, isUpdating } = useJobMutations();

  const isPending = isCreating || isUpdating;

  const handleSubmit = () => {
    const payload = {
      name: formState.name.trim(),
      description: formState.description,
      serviceAddress: formState.serviceAddress,
      serviceLocation: formState.serviceLocation,
      operationalNotes: formState.operationalNotes,
      status: formState.status as (typeof jobStatusValues)[number],
      jobType: formState.jobType,
      punctualStartDate:
        formState.jobType === "PUNCTUAL" && formState.punctualStartDate
          ? new Date(`${formState.punctualStartDate}T00:00:00`)
          : undefined,
      punctualEndDate:
        formState.jobType === "PUNCTUAL" && formState.punctualEndDate
          ? new Date(`${formState.punctualEndDate}T23:59:59`)
          : undefined,
      budgetIncludesIva: formState.budgetIncludesIva,
      sourceBudgetId: formState.sourceBudgetId || null,
      sourceBudgetOptionId: formState.sourceBudgetOptionId || null,
    };

    setOpen(false);

    if (job) {
      void updateJobAsync({
        jobId: job.id,
        onErrorAction: () => setOpen(true),
        values: payload,
      }).catch(() => undefined);
    } else {
      void createJobAsync({
        ...payload,
        onErrorAction: () => setOpen(true),
      }).catch(() => undefined);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setFormState(getInitialJobFormState(job));
        }

        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <JobFormTrigger
          isEditing={Boolean(job)}
          triggerClassName={triggerClassName}
          triggerLabel={triggerLabel}
          triggerVariant={triggerVariant}
        />
      </DialogTrigger>
      <OpsFormDialogContent size="lg">
        <OpsFormHeader>
          <DialogTitle>{job ? "Editar trabajo" : "Crear trabajo"}</DialogTitle>
          <DialogDescription>
            Definí la operación base y, si querés, vinculala a un presupuesto existente.
          </DialogDescription>
        </OpsFormHeader>
        <OpsFormBody className="grid gap-4">
          <OpsFormGrid>
            <OpsFormField label="Nombre">
              <Input className={opsFormControlClass} value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
            </OpsFormField>
            <OpsFormField label="Estado">
              <Select value={formState.status} onValueChange={(value) => setFormState((current) => ({ ...current, status: value }))}>
                <SelectTrigger className={opsFormSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobStatusValues.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getOpsStatusConfig(opsJobStatus, status).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OpsFormField>
          </OpsFormGrid>
          <JobTypeFields
            jobType={formState.jobType}
            punctualEndDate={formState.punctualEndDate}
            punctualStartDate={formState.punctualStartDate}
            onJobTypeChange={(jobType) =>
              setFormState((current) => ({
                ...current,
                jobType,
                punctualEndDate: jobType === "PUNCTUAL" ? current.punctualEndDate : "",
                punctualStartDate: jobType === "PUNCTUAL" ? current.punctualStartDate : "",
              }))
            }
            onPunctualEndDateChange={(punctualEndDate) =>
              setFormState((current) => ({ ...current, punctualEndDate }))
            }
            onPunctualStartDateChange={(punctualStartDate) =>
              setFormState((current) => ({ ...current, punctualStartDate }))
            }
          />
          <OpsFormField label="Descripción">
            <Textarea className={opsFormTextareaClass} value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} />
          </OpsFormField>
          <OpsFormGrid>
            <OpsFormField label="Dirección de servicio">
              <Input className={opsFormControlClass} value={formState.serviceAddress} onChange={(event) => setFormState((current) => ({ ...current, serviceAddress: event.target.value }))} />
            </OpsFormField>
            <OpsFormField label="Ubicación de referencia">
              <Input className={opsFormControlClass} value={formState.serviceLocation} onChange={(event) => setFormState((current) => ({ ...current, serviceLocation: event.target.value }))} />
            </OpsFormField>
          </OpsFormGrid>
          <OpsFormField label="Notas operativas">
            <Textarea className={opsFormTextareaClass} value={formState.operationalNotes} onChange={(event) => setFormState((current) => ({ ...current, operationalNotes: event.target.value }))} />
          </OpsFormField>
          <BudgetSourceSelector
            sourceBudgetId={formState.sourceBudgetId}
            sourceBudgetOptionId={formState.sourceBudgetOptionId}
            onBudgetChange={(sourceBudgetId) => setFormState((current) => ({ ...current, sourceBudgetId }))}
            onOptionChange={(sourceBudgetOptionId) => setFormState((current) => ({ ...current, sourceBudgetOptionId }))}
          />
          <div className={opsFormPanelClass}>
            <JobBudgetTaxModeToggle
              disabled={!formState.sourceBudgetOptionId}
              label="Precio asociado al trabajo"
              value={formState.budgetIncludesIva}
              onValueChange={(budgetIncludesIva) =>
                setFormState((current) => ({ ...current, budgetIncludesIva }))
              }
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {!formState.sourceBudgetOptionId
                ? "Seleccioná una opción del presupuesto para definir si el trabajo cobra con o sin IVA."
                : "Este modo se reflejará en el esperado de Cobros y en la imagen del presupuesto."}
            </p>
          </div>
        </OpsFormBody>
        <OpsFormFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={isPending || !formState.name.trim() || (formState.jobType === "PUNCTUAL" && (!formState.punctualStartDate || !formState.punctualEndDate))} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {job ? "Guardar cambios" : "Crear trabajo"}
          </Button>
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};
