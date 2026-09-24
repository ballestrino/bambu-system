import { getGenerationHorizonEnd } from "@/lib/ops/generation-horizon";
import { parseWeekDateKey } from "@/lib/ops/schedule-week";
import {
  compareLocalDates,
  DEFAULT_OPS_TIMEZONE,
  getLocalDate,
  zonedTimeToUtc,
} from "@/lib/ops/timezone";

// The scope of a generation: every job, one job, or one of its rules.
export type OccurrenceGenerationFilters = {
  jobId?: string;
  scheduleRuleId?: string;
};

export type OccurrenceGenerationRange = {
  cappedAtHorizon: boolean;
  end: Date;
  horizonEnd: Date;
  isEmpty: boolean;
  start: Date;
  startsInPast: boolean;
};

// The "desde/hasta" days of a manual generation, from 00:00 of the first day to
// the end of the last one in the ops timezone. It never goes past the 3-month
// horizon, and it may start in the past (to register visits already done).
export const resolveOccurrenceGenerationRange = (
  startKey: string,
  endKey: string,
  timeZone = DEFAULT_OPS_TIMEZONE,
  now = new Date()
): OccurrenceGenerationRange | null => {
  const startLocal = parseWeekDateKey(startKey);
  const endLocal = parseWeekDateKey(endKey);
  if (!startLocal || !endLocal || compareLocalDates(endLocal, startLocal) < 0) {
    return null;
  }

  const start = zonedTimeToUtc(startLocal, timeZone);
  const requestedEnd = zonedTimeToUtc(
    { ...endLocal, hour: 23, millisecond: 999, minute: 59, second: 59 },
    timeZone
  );
  const horizonEnd = getGenerationHorizonEnd(timeZone);
  const cappedAtHorizon = requestedEnd.getTime() > horizonEnd.getTime();
  const end = cappedAtHorizon ? horizonEnd : requestedEnd;

  return {
    cappedAtHorizon,
    end,
    horizonEnd,
    isEmpty: start.getTime() > end.getTime(),
    start,
    startsInPast: compareLocalDates(startLocal, getLocalDate(now, timeZone)) < 0,
  };
};
