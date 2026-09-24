import {
  addLocalMonths,
  DEFAULT_OPS_TIMEZONE,
  getLocalDate,
  zonedTimeToUtc,
} from "@/lib/ops/timezone";

export const MAX_GENERATION_MONTHS = 3;

// El límite hacia adelante de la generación manual de visitas. Lo usan el
// servidor, la UI (cronograma y diálogo de generar) y los scripts.
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
