import type { OpsEmployee, OpsOccurrence } from "@/components/ops/types";

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
  occurrence.status === "DONE" && Boolean(occurrence.employeeId);

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
