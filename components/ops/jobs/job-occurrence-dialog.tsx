"use client";

import { useState, type ComponentProps } from "react";

import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useJobScheduleRules } from "@/components/ops/hooks/useJobScheduleRules";
import { JobOccurrenceDialogForm } from "@/components/ops/jobs/job-occurrence-dialog-form";
import { JobOccurrenceDialogPresentation } from "@/components/ops/jobs/job-occurrence-dialog-presentation";
import {
  getInitialOccurrenceState,
  getJobOccurrenceEmployeeOptions,
  type OccurrenceDefaults,
} from "@/components/ops/jobs/job-occurrence-dialog-utils";
import { JobOccurrenceTrigger } from "@/components/ops/jobs/job-occurrence-trigger";
import { useJobOccurrenceDialogSubmit } from "@/components/ops/jobs/use-job-occurrence-dialog-submit";
import type { OpsOccurrence, OpsScheduleRule } from "@/components/ops/types";
import { parseDateTimeLocalValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";

type JobOccurrenceDialogProps = {
  completeOnSave?: boolean;
  defaults?: OccurrenceDefaults;
  jobId?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  scheduleRules?: OpsScheduleRule[];
  occurrence?: OpsOccurrence;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
};

export const JobOccurrenceDialog = ({
  completeOnSave = false,
  defaults,
  jobId,
  onOpenChange: onControlledOpenChange,
  open: controlledOpen,
  scheduleRules = [],
  occurrence,
  triggerClassName,
  triggerLabel,
  triggerVariant,
}: JobOccurrenceDialogProps) => {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setUncontrolledOpen(nextOpen);
    onControlledOpenChange?.(nextOpen);
  };
  const [formState, setFormState] = useState(
    getInitialOccurrenceState(occurrence, completeOnSave, defaults)
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

  const onOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setFormState(getInitialOccurrenceState(occurrence, completeOnSave, defaults));
    }
    setOpen(nextOpen);
  };

  return (
    <JobOccurrenceDialogPresentation
      canSubmit={
        !isPending && Boolean(resolvedJobId) && hasCompleteScheduledTimes
      }
      isEditing={Boolean(occurrence)}
      isPending={isPending}
      open={open}
      onOpenChange={onOpenChange}
      onRemove={remove}
      onSubmit={submit}
      trigger={
        isControlled ? null : (
          <JobOccurrenceTrigger
            isEditing={Boolean(occurrence)}
            triggerClassName={triggerClassName}
            triggerLabel={triggerLabel}
            triggerVariant={triggerVariant}
          />
        )
      }
    >
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
    </JobOccurrenceDialogPresentation>
  );
};
