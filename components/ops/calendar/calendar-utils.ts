import type { OccurrenceDialogIntent } from "@/components/ops/jobs/job-occurrence-dialog-utils";
import { hasOccurrenceEmployees } from "@/components/ops/jobs/occurrence-employees";
import type { OpsOccurrence } from "@/components/ops/types";
import { formatTime, getMonthRange } from "@/components/ops/utils";

export const byScheduledStart = (a: OpsOccurrence, b: OpsOccurrence) =>
  new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime();

export const sameDay = (date: Date | string, selectedDate?: Date) =>
  selectedDate
    ? new Date(date).toDateString() === selectedDate.toDateString()
    : false;

// The day the calendar selects until someone picks one: today while it shows
// the current month, the first day of any other month. todayKey is the
// visitor's local YYYY-MM-DD, null while it is not known yet.
export const getDefaultVisitDay = (month: Date, todayKey: string | null) => {
  if (!todayKey) return getMonthRange(month).start;

  const [year, monthNumber, day] = todayKey.split("-").map(Number);
  const isCurrentMonth =
    year === month.getFullYear() && monthNumber - 1 === month.getMonth();

  return isCurrentMonth ? new Date(year, monthNumber - 1, day) : getMonthRange(month).start;
};

// An assigned visit without its real times is waiting to be registered.
export const getVisitDialogIntent = (
  occurrence: OpsOccurrence
): OccurrenceDialogIntent =>
  hasOccurrenceEmployees(occurrence) &&
  (!occurrence.actualStartAt || !occurrence.actualEndAt)
    ? "complete"
    : "schedule";

export const getVisitActionLabel = (occurrence: OpsOccurrence) => {
  if (!hasOccurrenceEmployees(occurrence)) {
    return "Asignar";
  }

  if (getVisitDialogIntent(occurrence) === "complete") {
    return "Registrar horario";
  }

  return "Editar";
};

export const needsOccurrenceAttention = (occurrence: OpsOccurrence) =>
  !hasOccurrenceEmployees(occurrence) ||
  ["CANCELED", "SKIPPED"].includes(occurrence.status);

export const getCalendarStats = (occurrences: OpsOccurrence[]) => {
  const done = occurrences.filter((occurrence) => occurrence.status === "DONE");
  const scheduled = occurrences.filter(
    (occurrence) => occurrence.status === "SCHEDULED"
  );
  const needsAttention = occurrences.filter(needsOccurrenceAttention);

  return {
    attentionDates: needsAttention.map(
      (occurrence) => new Date(occurrence.scheduledStartAt)
    ),
    doneCount: done.length,
    doneDates: done.map((occurrence) => new Date(occurrence.scheduledStartAt)),
    needsAttentionCount: needsAttention.length,
    pendingCount: scheduled.length,
    scheduledDates: scheduled.map(
      (occurrence) => new Date(occurrence.scheduledStartAt)
    ),
    total: occurrences.length,
  };
};

export type CalendarHourGroup = {
  hour: number;
  label: string;
  occurrences: OpsOccurrence[];
};

export const groupOccurrencesByHour = (
  occurrences: OpsOccurrence[]
): CalendarHourGroup[] => {
  const groups = new Map<number, CalendarHourGroup>();

  for (const occurrence of [...occurrences].sort(byScheduledStart)) {
    const start = new Date(occurrence.scheduledStartAt);
    const isValidStart = !Number.isNaN(start.getTime());
    const hour = isValidStart ? start.getHours() : -1;
    const group = groups.get(hour);

    if (group) {
      group.occurrences.push(occurrence);
      continue;
    }

    const slot = new Date(start);
    if (isValidStart) {
      slot.setMinutes(0, 0, 0);
    }

    groups.set(hour, {
      hour,
      label: isValidStart ? formatTime(slot) : "Sin hora",
      occurrences: [occurrence],
    });
  }

  return [...groups.values()].sort((a, b) => a.hour - b.hour);
};
