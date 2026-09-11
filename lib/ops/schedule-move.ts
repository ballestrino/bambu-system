import { parseWeekDateKey, shiftOccurrenceToDate } from "@/lib/ops/schedule-week";
import { DEFAULT_OPS_TIMEZONE, zonedTimeToUtc } from "@/lib/ops/timezone";

export type ScheduleMoveSource = {
  employeeId: string | null;
  fromDateKey: string;
  visitId: string;
};

export type ScheduleMoveTarget = {
  dateKey: string;
  employeeId: string | null;
  startMinute?: number | null;
};

export type ScheduleMove = {
  employeeIds?: string[];
  scheduledEndAt: Date;
  scheduledStartAt: Date;
};

type MovableOccurrence = {
  scheduledEndAt: Date | string;
  scheduledStartAt: Date | string;
};

// Mover la tarjeta a otra fila reemplaza a la empleada arrastrada y deja al
// resto del equipo: una visita de dos personas no pierde a la companera porque
// una de las dos cambie de dia.
export const getMovedEmployeeIds = (
  currentEmployeeIds: string[],
  fromEmployeeId: string | null,
  toEmployeeId: string | null
) => {
  const withoutSource = fromEmployeeId
    ? currentEmployeeIds.filter((employeeId) => employeeId !== fromEmployeeId)
    : [...currentEmployeeIds];

  if (!toEmployeeId || withoutSource.includes(toEmployeeId)) {
    return withoutSource;
  }

  const index = fromEmployeeId ? currentEmployeeIds.indexOf(fromEmployeeId) : -1;
  if (index < 0) {
    return [...withoutSource, toEmployeeId];
  }

  const moved = [...withoutSource];
  moved.splice(index, 0, toEmployeeId);
  return moved;
};

// Soltar sobre un hueco fija la hora de inicio y conserva la duracion; soltar
// sobre el resto de la celda solo cambia de dia y de empleada.
const getMovedTimes = (
  occurrence: MovableOccurrence,
  target: ScheduleMoveTarget,
  timeZone: string
) => {
  const shifted = shiftOccurrenceToDate(occurrence, target.dateKey, timeZone);
  const targetDate = parseWeekDateKey(target.dateKey);

  if (!shifted || target.startMinute == null || !targetDate) {
    return shifted;
  }

  const start = new Date(occurrence.scheduledStartAt);
  const durationMs = new Date(occurrence.scheduledEndAt).getTime() - start.getTime();
  const scheduledStartAt = zonedTimeToUtc(
    {
      ...targetDate,
      hour: Math.floor(target.startMinute / 60),
      minute: target.startMinute % 60,
    },
    timeZone
  );

  return {
    scheduledEndAt: new Date(scheduledStartAt.getTime() + durationMs),
    scheduledStartAt,
  };
};

const sameIds = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export const buildScheduleMove = ({
  currentEmployeeIds,
  occurrence,
  source,
  target,
  timeZone = DEFAULT_OPS_TIMEZONE,
}: {
  currentEmployeeIds: string[];
  occurrence: MovableOccurrence;
  source: ScheduleMoveSource;
  target: ScheduleMoveTarget;
  timeZone?: string;
}): ScheduleMove | null => {
  const times = getMovedTimes(occurrence, target, timeZone);
  if (!times) {
    return null;
  }

  const employeeIds = getMovedEmployeeIds(
    currentEmployeeIds,
    source.employeeId,
    target.employeeId
  );
  const keepsTeam = sameIds(employeeIds, currentEmployeeIds);
  const keepsTime =
    times.scheduledStartAt.getTime() ===
    new Date(occurrence.scheduledStartAt).getTime();

  if (keepsTeam && keepsTime) {
    return null;
  }

  return keepsTeam ? times : { ...times, employeeIds };
};
