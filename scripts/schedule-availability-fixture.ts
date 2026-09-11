import { formatMinuteOfDay } from "../lib/ops/minute-ranges";
import type { ScheduleAvailabilityRule } from "../lib/ops/schedule-availability";
import type { ScheduleDay, ScheduleVisit } from "../lib/ops/schedule-types";

export const H = (hour: number) => hour * 60;

export const availabilityRule = (
  input: Partial<ScheduleAvailabilityRule> & { endMinute: number; startMinute: number }
): ScheduleAvailabilityRule => ({
  employeeId: "e1",
  kind: "UNAVAILABLE",
  weekdays: [],
  ...input,
});

export const scheduleVisit = (input: {
  end: number;
  id: string;
  start: number;
  status?: ScheduleVisit["status"];
}): ScheduleVisit => ({
  address: "Sarandí 450",
  displayName: `Visita ${input.id}`,
  endLabel: formatMinuteOfDay(input.end),
  endMinute: input.end,
  id: input.id,
  jobId: `job-${input.id}`,
  jobName: `Visita ${input.id}`,
  startAt: `2026-09-14T${formatMinuteOfDay(input.start)}:00.000Z`,
  startLabel: formatMinuteOfDay(input.start),
  startMinute: input.start,
  status: input.status ?? "SCHEDULED",
  teammates: [],
});

export const scheduleDay = (
  visits: ScheduleVisit[],
  weekdayNumber = 1
): ScheduleDay => ({
  dateKey: "2026-09-14",
  dayLabel: "14/09",
  longLabel: "Lunes 14 de setiembre",
  visits,
  weekdayLabel: "Lunes",
  weekdayNumber,
});
