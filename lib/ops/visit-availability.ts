import { containsRange, formatMinuteOfDay, rangesOverlap } from "@/lib/ops/minute-ranges";
import {
  getAvailabilityWindows,
  type ScheduleAvailabilityRule,
} from "@/lib/ops/schedule-availability";
import type { ScheduleOccurrenceRow } from "@/lib/ops/schedule-types";
import { getDayKeyWeekday } from "@/lib/ops/visit-calendar";
import {
  getVisitDayKey,
  getVisitEmployees,
  getVisitMinutes,
  getVisitTitle,
} from "@/lib/ops/visit-day";

export type VisitCandidate = {
  employeeId: string;
  isFree: boolean;
  name: string;
  text: string;
};

// Cancelada u omitida ya no ocupa a la empleada (igual que en el cronograma).
const BLOCKING = new Set(["SCHEDULED", "DONE"]);

// Quien puede tomar una visita: libre si no se cruza con otra visita suya ese
// dia y, cuando tiene reglas cargadas, si el horario entra en su disponibilidad.
export const getVisitCandidates = ({
  employees,
  rules,
  visit,
  visits,
}: {
  employees: { id: string; name: string }[];
  rules: ScheduleAvailabilityRule[];
  visit: ScheduleOccurrenceRow;
  visits: ScheduleOccurrenceRow[];
}): VisitCandidate[] => {
  const dayKey = getVisitDayKey(visit.scheduledStartAt);
  const range = getVisitMinutes(visit);
  const sameDay = visits.filter(
    (other) =>
      other.id !== visit.id &&
      BLOCKING.has(other.status) &&
      getVisitDayKey(other.scheduledStartAt) === dayKey
  );
  const weekday = getDayKeyWeekday(dayKey);

  const candidates = employees.map((employee): VisitCandidate => {
    const own = sameDay
      .filter((other) => getVisitEmployees(other).some(({ id }) => id === employee.id))
      .map((other) => ({ other, range: getVisitMinutes(other) }))
      .sort((left, right) => left.range.startMinute - right.range.startMinute);
    const clash = own.find((item) => rangesOverlap(item.range, range));

    if (clash) {
      return {
        employeeId: employee.id,
        isFree: false,
        name: employee.name,
        text: `Ocupada ${formatMinuteOfDay(clash.range.startMinute)} – ${formatMinuteOfDay(clash.range.endMinute)} · ${getVisitTitle(clash.other)}`,
      };
    }

    const employeeRules = rules.filter((rule) => rule.employeeId === employee.id);
    if (employeeRules.length && !containsRange(getAvailabilityWindows(employeeRules, weekday), range)) {
      return { employeeId: employee.id, isFree: false, name: employee.name, text: "Fuera de su disponibilidad" };
    }

    const before = own.filter((item) => item.range.endMinute <= range.startMinute).pop();
    return {
      employeeId: employee.id,
      isFree: true,
      name: employee.name,
      text: before
        ? `Libre · termina ${formatMinuteOfDay(before.range.endMinute)} en ${getVisitTitle(before.other)}`
        : "Libre todo el horario",
    };
  });

  return [...candidates.filter((item) => item.isFree), ...candidates.filter((item) => !item.isFree)];
};
