"use client";

import { useJobOccurrenceMutations } from "@/components/ops/hooks/useJobOccurrenceMutations";
import {
  getResolvedActualTimes,
  type OccurrenceFormState,
} from "@/components/ops/jobs/job-occurrence-dialog-utils";
import type { OpsOccurrence } from "@/components/ops/types";
import { parseDateTimeLocalValue } from "@/components/ops/utils";
import { occurrenceStatusValues } from "@/schemas/ops";

type OccurrenceStatus = (typeof occurrenceStatusValues)[number];

export const useJobOccurrenceDialogSubmit = ({
  formState,
  occurrence,
  resolvedJobId,
  selectedScheduleRuleId,
  setOpen,
}: {
  formState: OccurrenceFormState;
  occurrence?: OpsOccurrence;
  resolvedJobId: string;
  selectedScheduleRuleId: string;
  setOpen: (open: boolean) => void;
}) => {
  const {
    archiveOccurrenceAsync,
    createOccurrenceAsync,
    updateOccurrenceAsync,
    isArchiving,
    isCreating,
    isUpdating,
  } = useJobOccurrenceMutations(resolvedJobId);

  const submit = () => {
    const { actualEndAt, actualStartAt } = getResolvedActualTimes(formState);
    const scheduledStartAt = parseDateTimeLocalValue(formState.scheduledStartAt);
    const scheduledEndAt = parseDateTimeLocalValue(formState.scheduledEndAt);
    const resolvedScheduleRuleId = selectedScheduleRuleId || null;

    if (!scheduledStartAt || !scheduledEndAt) return;

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
      return;
    }

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
  };

  const remove = async () => {
    if (!occurrence) return;

    try {
      await archiveOccurrenceAsync({
        occurrenceId: occurrence.id,
        successMessage: "Visita eliminada",
      });
      setOpen(false);
    } catch {
      // The mutation keeps the dialog open and reports the error in a toast.
    }
  };

  return {
    isPending: isCreating || isUpdating || isArchiving,
    remove,
    submit,
  };
};
