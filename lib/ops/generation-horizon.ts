import {
  addLocalMonths,
  DEFAULT_OPS_TIMEZONE,
  getLocalDate,
  zonedTimeToUtc,
} from "@/lib/ops/timezone";

export const MAX_GENERATION_MONTHS = 3;

// Vive fuera de job-occurrence-recurrence.ts, que es server-only, para que la
// UI y los scripts puedan saber hasta donde llegan las visitas materializadas.
export const getGenerationHorizonEnd = (timeZone = DEFAULT_OPS_TIMEZONE) => {
  const today = getLocalDate(new Date(), timeZone);
  const horizon = addLocalMonths(today, MAX_GENERATION_MONTHS);

  return zonedTimeToUtc(
    {
      ...horizon,
      hour: 23,
      millisecond: 999,
      minute: 59,
      second: 59,
    },
    timeZone
  );
};
