import type { OpsOccurrence } from "@/components/ops/types";

const hoursFormat = new Intl.NumberFormat("es-UY", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const moneyFormat = new Intl.NumberFormat("es-UY", {
  currency: "UYU",
  maximumFractionDigits: 2,
  style: "currency",
});

export const getHourlyRateNumber = (value: unknown) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0 ? rate : null;
};

export const getWorkedHours = (occurrence: OpsOccurrence) => {
  if (occurrence.status !== "DONE" || !occurrence.actualStartAt || !occurrence.actualEndAt) {
    return 0;
  }

  const startedAt = new Date(occurrence.actualStartAt).getTime();
  const endedAt = new Date(occurrence.actualEndAt).getTime();
  return Math.max(0, (endedAt - startedAt) / 3600000);
};

export const realTimingMatches = (occurrence: OpsOccurrence, filter: string) => {
  const hasRealTiming = Boolean(occurrence.actualStartAt && occurrence.actualEndAt);

  if (filter === "WITH_REAL") {
    return hasRealTiming;
  }

  if (filter === "WITHOUT_REAL") {
    return !hasRealTiming;
  }

  return true;
};

export const summarizeEmployeeVisits = (occurrences: OpsOccurrence[]) =>
  occurrences.reduce(
    (acc, occurrence) => {
      acc.hours += getWorkedHours(occurrence);
      acc.total += 1;
      acc.done += occurrence.status === "DONE" ? 1 : 0;
      acc.canceled += occurrence.status === "CANCELED" ? 1 : 0;
      acc.pending += occurrence.status === "SCHEDULED" ? 1 : 0;
      return acc;
    },
    { hours: 0, total: 0, done: 0, canceled: 0, pending: 0 }
  );

export const getEstimatedPay = (hours: number, hourlyRate: unknown) => {
  const rate = getHourlyRateNumber(hourlyRate);
  return rate === null ? null : hours * rate;
};

export const formatHours = (hours: number) => hoursFormat.format(hours);

export const formatMoney = (amount: number) => moneyFormat.format(amount);
