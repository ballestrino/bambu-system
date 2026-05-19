import type { OpsOccurrence } from "@/components/ops/types";

export const byScheduledStart = (left: OpsOccurrence, right: OpsOccurrence) =>
  new Date(left.scheduledStartAt).getTime() -
  new Date(right.scheduledStartAt).getTime();

export const startOfLocalDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addLocalDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const endOfLocalDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

const isSameLocalDay = (value: Date | string, target: Date) =>
  startOfLocalDay(new Date(value)).getTime() === startOfLocalDay(target).getTime();

export const isTodayOrPast = (value: Date | string, today = new Date()) =>
  startOfLocalDay(new Date(value)).getTime() <= startOfLocalDay(today).getTime();

export const isTomorrow = (value: Date | string, today = new Date()) =>
  isSameLocalDay(value, addLocalDays(today, 1));

export const needsVisitRegistration = (
  occurrence: OpsOccurrence,
  today = new Date()
) =>
  occurrence.status === "SCHEDULED" &&
  isTodayOrPast(occurrence.scheduledStartAt, today) &&
  (!occurrence.actualStartAt || !occurrence.actualEndAt);

export const getPendingRegistrationVisits = (
  occurrences: OpsOccurrence[],
  today = new Date()
) =>
  occurrences
    .filter((occurrence) => needsVisitRegistration(occurrence, today))
    .sort(byScheduledStart);

export const getTomorrowScheduledVisits = (
  occurrences: OpsOccurrence[],
  today = new Date()
) =>
  occurrences
    .filter(
      (occurrence) =>
        occurrence.status === "SCHEDULED" &&
        isTomorrow(occurrence.scheduledStartAt, today)
    )
    .sort(byScheduledStart);

export const getPendingVisitsRange = (today = new Date()) => ({
  endDate: endOfLocalDay(addLocalDays(today, 1)),
});
