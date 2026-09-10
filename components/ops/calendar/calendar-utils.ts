import type { OpsOccurrence } from "@/components/ops/types";
import { hasOccurrenceEmployees } from "@/components/ops/jobs/occurrence-employees";
import { formatTime } from "@/components/ops/utils";

export const byScheduledStart = (a: OpsOccurrence, b: OpsOccurrence) =>
  new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime();

export const sameDay = (date: Date | string, selectedDate?: Date) =>
  selectedDate
    ? new Date(date).toDateString() === selectedDate.toDateString()
    : false;

export const shouldCompleteOccurrenceOnSave = (occurrence: OpsOccurrence) =>
  hasOccurrenceEmployees(occurrence) &&
  (!occurrence.actualStartAt || !occurrence.actualEndAt);

export const getVisitActionLabel = (occurrence: OpsOccurrence) => {
  if (!hasOccurrenceEmployees(occurrence)) {
    return "Asignar";
  }

  if (shouldCompleteOccurrenceOnSave(occurrence)) {
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
