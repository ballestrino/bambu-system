import type { OpsEmployee, OpsOccurrence } from "@/components/ops/types";
import {
  getOccurrenceEmployees,
  hasOccurrenceEmployees,
} from "@/components/ops/jobs/occurrence-employees";

export const TRANSPORTATION_PAY_PER_VISIT = 52;

export const getEmployeeHourlyRate = (
  employee: Pick<OpsEmployee, "hourlyRate">
) => {
  if (employee.hourlyRate === null || employee.hourlyRate === undefined) {
    return null;
  }

  const rate = Number(employee.hourlyRate);
  return Number.isFinite(rate) && rate >= 0 ? rate : null;
};

export const isCompletedEmployeeVisit = (occurrence: OpsOccurrence) =>
  occurrence.status === "DONE" && hasOccurrenceEmployees(occurrence);

export const getCompletedVisitEmployees = (occurrence: OpsOccurrence) =>
  isCompletedEmployeeVisit(occurrence) ? getOccurrenceEmployees(occurrence) : [];

export const getCompletedVisitHours = (occurrence: OpsOccurrence) => {
  if (
    !isCompletedEmployeeVisit(occurrence) ||
    !occurrence.actualStartAt ||
    !occurrence.actualEndAt
  ) {
    return 0;
  }

  const startedAt = new Date(occurrence.actualStartAt).getTime();
  const endedAt = new Date(occurrence.actualEndAt).getTime();
  return Math.max(0, (endedAt - startedAt) / 3600000);
};
