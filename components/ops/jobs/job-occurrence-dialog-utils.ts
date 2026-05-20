import type { OpsOccurrence } from "@/components/ops/types";
import {
  parseDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/components/ops/utils";
import { getOccurrenceEmployeeIds } from "@/components/ops/jobs/occurrence-employees";

export const getInitialOccurrenceState = (
  occurrence?: OpsOccurrence,
  completeOnSave = false
) => ({
  jobId: occurrence?.jobId ?? "",
  employeeIds: getOccurrenceEmployeeIds(occurrence),
  scheduleRuleId: occurrence?.scheduleRuleId ?? "",
  scheduledStartAt: toDateTimeLocalValue(occurrence?.scheduledStartAt),
  scheduledEndAt: toDateTimeLocalValue(occurrence?.scheduledEndAt),
  actualStartAt: toDateTimeLocalValue(occurrence?.actualStartAt),
  actualEndAt: toDateTimeLocalValue(occurrence?.actualEndAt),
  status:
    completeOnSave && occurrence?.status === "SCHEDULED"
      ? "DONE"
      : occurrence?.status ?? "SCHEDULED",
  notes: occurrence?.notes ?? "",
});

export type OccurrenceFormState = ReturnType<typeof getInitialOccurrenceState>;

export const syncOccurrenceActualTimes = (
  formState: OccurrenceFormState
) => ({
  ...formState,
  actualEndAt: formState.scheduledEndAt,
  actualStartAt: formState.scheduledStartAt,
});

export const updateOccurrenceScheduledTime = ({
  field,
  formState,
  occurrence,
  value,
}: {
  field: "scheduledEndAt" | "scheduledStartAt";
  formState: OccurrenceFormState;
  occurrence?: OpsOccurrence;
  value: string;
}) => {
  const nextFormState = {
    ...formState,
    [field]: value,
  };

  if (occurrence) {
    return nextFormState;
  }

  if (
    field === "scheduledStartAt" &&
    (!formState.actualStartAt ||
      formState.actualStartAt === formState.scheduledStartAt)
  ) {
    nextFormState.actualStartAt = value;
  }

  if (
    field === "scheduledEndAt" &&
    (!formState.actualEndAt || formState.actualEndAt === formState.scheduledEndAt)
  ) {
    nextFormState.actualEndAt = value;
  }

  return nextFormState;
};

export const getResolvedActualTimes = (
  formState: OccurrenceFormState
) => {
  const useScheduledFallback = formState.status === "DONE";

  return {
    actualEndAt: parseDateTimeLocalValue(
      formState.actualEndAt ||
        (useScheduledFallback ? formState.scheduledEndAt : "")
    ),
    actualStartAt: parseDateTimeLocalValue(
      formState.actualStartAt ||
        (useScheduledFallback ? formState.scheduledStartAt : "")
    ),
  };
};
