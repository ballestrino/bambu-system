"use client";

import { useState, type ComponentProps } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";

import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useJobScheduleRules } from "@/components/ops/hooks/useJobScheduleRules";
import { JobOccurrenceDialogForm } from "@/components/ops/jobs/job-occurrence-dialog-form";
import {
  getInitialOccurrenceState,
  getJobOccurrenceEmployeeOptions,
} from "@/components/ops/jobs/job-occurrence-dialog-utils";
import { JobOccurrenceTrigger } from "@/components/ops/jobs/job-occurrence-trigger";
import { useJobOccurrenceDialogSubmit } from "@/components/ops/jobs/use-job-occurrence-dialog-submit";
import {
  OpsFormBody,
  OpsFormDialogContent,
  OpsFormFooter,
  OpsFormHeader,
} from "@/components/ops/shared";
import type { OpsOccurrence, OpsScheduleRule } from "@/components/ops/types";
import { parseDateTimeLocalValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import DeleteDialog from "@/components/ui/delete-dialog";
import {
  Dialog,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type JobOccurrenceDialogProps = {
  completeOnSave?: boolean;
  jobId?: string;
  scheduleRules?: OpsScheduleRule[];
  occurrence?: OpsOccurrence;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
};

export const JobOccurrenceDialog = ({
  completeOnSave = false,
  jobId,
  scheduleRules = [],
  occurrence,
  triggerClassName,
  triggerLabel,
  triggerVariant,
}: JobOccurrenceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(
    getInitialOccurrenceState(occurrence, completeOnSave)
  );
  const { employees: activeEmployees } = useEmployees({ isActive: true });
  const { jobs } = useJobs({ includeArchived: false });
  const resolvedJobId = jobId ?? occurrence?.jobId ?? formState.jobId;
  const employees = getJobOccurrenceEmployeeOptions(
    activeEmployees,
    occurrence?.employees.map((assignment) => assignment.employee)
  );
  const { scheduleRules: fetchedScheduleRules } = useJobScheduleRules(
    resolvedJobId ? { jobId: resolvedJobId, isActive: true } : undefined,
    { enabled: Boolean(resolvedJobId) }
  );
  const currentScheduleRule =
    occurrence?.scheduleRule && occurrence.scheduleRule.jobId === resolvedJobId
      ? occurrence.scheduleRule
      : null;
  const mergedScheduleRules = [...scheduleRules, ...fetchedScheduleRules].reduce<
    OpsScheduleRule[]
  >((rules, rule) => {
    if (
      rule.jobId === resolvedJobId &&
      !rules.some((currentRule) => currentRule.id === rule.id)
    ) {
      rules.push(rule);
    }
    return rules;
  }, []);
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
  const { isPending, remove, submit } = useJobOccurrenceDialogSubmit({
    formState,
    occurrence,
    resolvedJobId,
    selectedScheduleRuleId,
    setOpen,
  });
  const hasCompleteScheduledTimes = Boolean(
    parseDateTimeLocalValue(formState.scheduledStartAt) &&
    parseDateTimeLocalValue(formState.scheduledEndAt)
  );

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
          <DialogDescription>
            Puede quedar sin equipo para resolverla desde la agenda.
          </DialogDescription>
        </OpsFormHeader>
        <OpsFormBody className="grid gap-4">
          <JobOccurrenceDialogForm
            employees={employees}
            formState={formState}
            jobs={jobs}
            occurrence={occurrence}
            resolvedJobId={resolvedJobId}
            scheduleRuleOptions={scheduleRuleOptions}
            selectedScheduleRuleId={selectedScheduleRuleId}
            setFormState={setFormState}
            showJobField={!jobId && !occurrence}
          />
        </OpsFormBody>
        <OpsFormFooter>
          {occurrence ? (
            <DeleteDialog
              title="Eliminar visita"
              description="La visita dejará de aparecer en el calendario y el historial activo. Esta acción no cambia solamente su estado."
              deleteButtonText="Eliminar visita"
              onConfirm={remove}
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  className="sm:mr-auto"
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar visita
                </Button>
              }
            />
          ) : null}
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            disabled={
              isPending ||
              !resolvedJobId ||
              !hasCompleteScheduledTimes
            }
            onClick={submit}
          >
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Guardar visita
          </Button>
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};
