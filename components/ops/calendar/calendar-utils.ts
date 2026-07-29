import type { OpsOccurrence } from "@/components/ops/types";
import { hasOccurrenceEmployees } from "@/components/ops/jobs/occurrence-employees";

export const byScheduledStart = (a: OpsOccurrence, b: OpsOccurrence) =>
  new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime();

export const sameDay = (date: Date | string, selectedDate?: Date) =>
  selectedDate
    ? new Date(date).toDateString() === selectedDate.toDateString()
    : false;

export const getVisitActionLabel = (occurrence: OpsOccurrence) => {
  if (!hasOccurrenceEmployees(occurrence)) {
    return "Asignar";
  }

  if (!occurrence.actualStartAt || !occurrence.actualEndAt) {
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
