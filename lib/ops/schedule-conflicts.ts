import { rangesOverlap, type MinuteRange } from "@/lib/ops/minute-ranges";
import type { ScheduleDay, ScheduleVisit } from "@/lib/ops/schedule-types";

// Una visita cancelada u omitida ya no ocupa a la empleada: no cruza con nada
// ni tapa un hueco libre.
const BLOCKING_STATUSES = new Set(["SCHEDULED", "DONE"]);

export type ScheduleOverlaps = Map<string, ScheduleVisit[]>;

export const isBlockingVisit = (visit: ScheduleVisit) =>
  BLOCKING_STATUSES.has(visit.status);

export const getVisitRange = (visit: ScheduleVisit): MinuteRange => ({
  endMinute: visit.endMinute,
  startMinute: visit.startMinute,
});

export const getBusyRanges = (visits: ScheduleVisit[], skipVisitId?: string) =>
  visits
    .filter((visit) => isBlockingVisit(visit) && visit.id !== skipVisitId)
    .map(getVisitRange);

// Devuelve, por visita, las otras visitas del mismo dia y la misma empleada que
// se pisan con ella. La grilla lo usa para avisar sin bloquear: administracion
// a veces solapa a proposito y solo necesita verlo.
export const getDayOverlaps = (visits: ScheduleVisit[]): ScheduleOverlaps => {
  const blocking = visits.filter(isBlockingVisit);
  const overlaps: ScheduleOverlaps = new Map();

  blocking.forEach((visit, index) => {
    blocking.slice(index + 1).forEach((other) => {
      if (!rangesOverlap(getVisitRange(visit), getVisitRange(other))) {
        return;
      }

      overlaps.set(visit.id, [...(overlaps.get(visit.id) ?? []), other]);
      overlaps.set(other.id, [...(overlaps.get(other.id) ?? []), visit]);
    });
  });

  return overlaps;
};

export const countDayOverlapPairs = (visits: ScheduleVisit[]) => {
  const blocking = visits.filter(isBlockingVisit);

  return blocking.reduce(
    (total, visit, index) =>
      total +
      blocking
        .slice(index + 1)
        .filter((other) => rangesOverlap(getVisitRange(visit), getVisitRange(other)))
        .length,
    0
  );
};

export const countOverlapPairs = (days: ScheduleDay[]) =>
  days.reduce((total, day) => total + countDayOverlapPairs(day.visits), 0);

export const formatOverlapWarning = (visits: ScheduleVisit[]) =>
  `Se cruza con ${visits
    .map((visit) => `${visit.displayName} (${visit.startLabel} - ${visit.endLabel})`)
    .join(", ")}`;
