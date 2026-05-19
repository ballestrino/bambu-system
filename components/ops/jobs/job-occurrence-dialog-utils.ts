import type { OpsOccurrence } from "@/components/ops/types";
import { toDateTimeLocalValue } from "@/components/ops/utils";
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

type OccurrenceFormState = ReturnType<typeof getInitialOccurrenceState>;

const toOptionalDate = (value: string) => (value ? new Date(value) : undefined);

export const getResolvedActualTimes = (
  formState: OccurrenceFormState,
  completeOnSave = false
) => {
  const useScheduledFallback = completeOnSave || formState.status === "DONE";

  return {
    actualEndAt: toOptionalDate(
      formState.actualEndAt ||
        (useScheduledFallback ? formState.scheduledEndAt : "")
    ),
    actualStartAt: toOptionalDate(
      formState.actualStartAt ||
        (useScheduledFallback ? formState.scheduledStartAt : "")
    ),
  };
};
