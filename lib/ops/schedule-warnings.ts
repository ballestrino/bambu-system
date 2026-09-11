import {
  containsRange,
  formatMinuteRange,
  type MinuteRange,
} from "@/lib/ops/minute-ranges";
import type { ScheduleAvailabilityRule } from "@/lib/ops/schedule-availability";
import { getAvailabilityWindows } from "@/lib/ops/schedule-availability";
import {
  formatOverlapWarning,
  getDayOverlaps,
  getVisitRange,
  isBlockingVisit,
} from "@/lib/ops/schedule-conflicts";
import type { ScheduleDay } from "@/lib/ops/schedule-types";

export type ScheduleWarnings = Map<string, string[]>;

export const formatAvailabilityWindows = (windows: MinuteRange[]) =>
  windows.length ? windows.map(formatMinuteRange).join(", ") : "sin disponibilidad";

// Avisos por visita, no bloqueos: administracion a veces pisa un horario a
// proposito y solo necesita verlo antes de mandar el cronograma.
export const getDayWarnings = ({
  day,
  rules,
}: {
  day: ScheduleDay;
  rules: ScheduleAvailabilityRule[];
}): ScheduleWarnings => {
  const overlaps = getDayOverlaps(day.visits);
  // Sin reglas cargadas la ventana por defecto es solo una convencion para
  // buscar huecos: marcar cada visita temprana como fuera de horario seria
  // ruido, no un aviso.
  const windows = rules.length ? getAvailabilityWindows(rules, day.weekdayNumber) : null;

  return day.visits.reduce((warnings, visit) => {
    const messages: string[] = [];
    const crossing = overlaps.get(visit.id);

    if (crossing?.length) {
      messages.push(formatOverlapWarning(crossing));
    }

    if (
      windows &&
      isBlockingVisit(visit) &&
      !containsRange(windows, getVisitRange(visit))
    ) {
      messages.push(
        `Fuera de la disponibilidad de la empleada (${formatAvailabilityWindows(windows)})`
      );
    }

    if (messages.length) {
      warnings.set(visit.id, messages);
    }

    return warnings;
  }, new Map() as ScheduleWarnings);
};
