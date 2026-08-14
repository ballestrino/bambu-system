import type { OpsOccurrence } from "@/components/ops/types";
import {
  parseDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/components/ops/utils";
import { getOccurrenceEmployeeIds } from "@/components/ops/jobs/occurrence-employees";

export const getInitialOccurrenceState = (
  occurrence?: OpsOccurrence,
  completeOnSave = false
) => {
  const scheduledStartAt = toDateTimeLocalValue(occurrence?.scheduledStartAt);
  const scheduledEndAt = toDateTimeLocalValue(occurrence?.scheduledEndAt);
  const actualStartAt = toDateTimeLocalValue(occurrence?.actualStartAt);
  const actualEndAt = toDateTimeLocalValue(occurrence?.actualEndAt);
  const shouldPrefillActualStart = completeOnSave && !actualStartAt;
  const shouldPrefillActualEnd = completeOnSave && !actualEndAt;

  return {
    jobId: occurrence?.jobId ?? "",
    employeeIds: getOccurrenceEmployeeIds(occurrence),
    scheduleRuleId: occurrence?.scheduleRuleId ?? "",
    scheduledStartAt,
    scheduledEndAt,
    actualStartAt: shouldPrefillActualStart ? scheduledStartAt : actualStartAt,
    actualEndAt: shouldPrefillActualEnd ? scheduledEndAt : actualEndAt,
    status:
      completeOnSave && occurrence?.status === "SCHEDULED"
        ? "DONE"
        : occurrence?.status ?? "SCHEDULED",
    notes: occurrence?.notes ?? "",
  };
};

export type OccurrenceFormState = ReturnType<typeof getInitialOccurrenceState>;

export type JobOccurrenceEmployeeOption = {
  archivedAt: Date | null;
  id: string;
  isActive: boolean;
  name: string;
};

export const getJobOccurrenceEmployeeOptions = (
  activeEmployees: JobOccurrenceEmployeeOption[],
  assignedEmployees: JobOccurrenceEmployeeOption[] = []
) => {
  const options = [...activeEmployees];

  assignedEmployees.forEach((employee) => {
    if (!options.some((option) => option.id === employee.id)) {
      options.push(employee);
    }
  });

  return options;
};

export type DateTimePart = "date" | "time";

export const getDateTimePart = (value: string, part: DateTimePart) => {
  const [date = "", time = ""] = value.split("T");
  return part === "date" ? date : time;
};

const setDateTimePart = (
  value: string,
  part: DateTimePart,
  nextPart: string
) => {
  const date = part === "date" ? nextPart : getDateTimePart(value, "date");
  const time = part === "time" ? nextPart : getDateTimePart(value, "time");
  return date || time ? `${date}T${time}` : "";
};

export const updateOccurrenceDateTimeRange = ({
  endValue,
  field,
  nextPart,
  part,
  startValue,
}: {
  endValue: string;
  field: "end" | "start";
  nextPart: string;
  part: DateTimePart;
  startValue: string;
}) => {
  const nextStartValue =
    field === "start"
      ? setDateTimePart(startValue, part, nextPart)
      : startValue;
  let nextEndValue =
    field === "end" ? setDateTimePart(endValue, part, nextPart) : endValue;

  if (
    field === "start" &&
    part === "date" &&
    nextPart &&
    (!getDateTimePart(endValue, "date") ||
      getDateTimePart(endValue, "date") ===
        getDateTimePart(startValue, "date"))
  ) {
    nextEndValue = setDateTimePart(endValue, "date", nextPart);
  }

  return { endValue: nextEndValue, startValue: nextStartValue };
};

export const syncOccurrenceActualTimes = (
  formState: OccurrenceFormState
) => ({
  ...formState,
  actualEndAt: formState.scheduledEndAt,
  actualStartAt: formState.scheduledStartAt,
});

export const clearOccurrenceActualTimes = (
  formState: OccurrenceFormState
) => ({
  ...formState,
  actualEndAt: "",
  actualStartAt: "",
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

  if (
    field === "scheduledStartAt" &&
    ((!occurrence && !formState.actualStartAt) ||
      formState.actualStartAt === formState.scheduledStartAt)
  ) {
    nextFormState.actualStartAt = value;
  }

  if (
    field === "scheduledEndAt" &&
    ((!occurrence && !formState.actualEndAt) ||
      formState.actualEndAt === formState.scheduledEndAt)
  ) {
    nextFormState.actualEndAt = value;
  }

  return nextFormState;
};

export const getResolvedActualTimes = (
  formState: OccurrenceFormState
) => {
  return {
    actualEndAt: parseDateTimeLocalValue(formState.actualEndAt),
    actualStartAt: parseDateTimeLocalValue(formState.actualStartAt),
  };
};
