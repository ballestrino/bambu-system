"use client";

import type {
  OpsEmployee,
  OpsJobEmployeeAssignment,
  OpsJobListItem,
  OpsOccurrence,
} from "@/components/ops/types";

const asDate = (value?: Date | string | null) =>
  value ? new Date(value).getTime() : null;

const inRange = (
  value: Date | string | null | undefined,
  start?: unknown,
  end?: unknown
) => {
  const time = asDate(value);
  if (time === null) return false;
  const startTime = asDate(start as Date | string | undefined);
  const endTime = asDate(end as Date | string | undefined);

  return (
    (startTime === null || time >= startTime) &&
    (endTime === null || time <= endTime)
  );
};

const textIncludes = (value: unknown, query: string) =>
  String(value ?? "").toLowerCase().includes(query);

const archivedMatches = (
  archivedAt: Date | string | null | undefined,
  includeArchived?: unknown
) => Boolean(includeArchived) || !archivedAt;

export const matchesJobFilters = (
  job: OpsJobListItem,
  filters: Record<string, unknown>
) => {
  if (!archivedMatches(job.archivedAt, filters.includeArchived)) return false;
  if (Array.isArray(filters.statuses) && !filters.statuses.includes(job.status)) {
    return false;
  }
  if (filters.sourceBudgetId && job.sourceBudgetId !== filters.sourceBudgetId) {
    return false;
  }
  if (
    filters.sourceBudgetOptionId &&
    job.sourceBudgetOptionId !== filters.sourceBudgetOptionId
  ) {
    return false;
  }
  if (!inRange(job.createdAt, filters.startDate, filters.endDate)) return false;

  const query = String(filters.query ?? "").toLowerCase();
  if (
    query &&
    ![
      job.name,
      job.description,
      job.serviceAddress,
      job.serviceLocation,
      job.operationalNotes,
    ].some((value) => textIncludes(value, query))
  ) {
    return false;
  }

  if (filters.visibility === "PUNCTUAL") return job.jobType === "PUNCTUAL";
  return true;
};

export const matchesEmployeeFilters = (
  employee: OpsEmployee,
  filters: Record<string, unknown>
) => {
  if (!archivedMatches(employee.archivedAt, filters.includeArchived)) return false;
  if (
    typeof filters.isActive === "boolean" &&
    employee.isActive !== filters.isActive
  ) {
    return false;
  }
  if (!inRange(employee.createdAt, filters.startDate, filters.endDate)) return false;

  const query = String(filters.query ?? "").toLowerCase();
  return (
    !query ||
    [employee.name, employee.email, employee.phone, employee.notes].some((value) =>
      textIncludes(value, query)
    )
  );
};

export const matchesOccurrenceFilters = (
  occurrence: OpsOccurrence,
  filters: Record<string, unknown>
) => {
  if (!archivedMatches(occurrence.archivedAt, filters.includeArchived)) {
    return false;
  }
  if (filters.jobId && occurrence.jobId !== filters.jobId) return false;
  if (
    filters.employeeId &&
    !occurrence.employees.some((item) => item.employeeId === filters.employeeId)
  ) {
    return false;
  }
  if (
    filters.scheduleRuleId &&
    occurrence.scheduleRuleId !== filters.scheduleRuleId
  ) {
    return false;
  }
  if (
    Array.isArray(filters.statuses) &&
    !filters.statuses.includes(occurrence.status)
  ) {
    return false;
  }
  if (
    typeof filters.isDetached === "boolean" &&
    occurrence.isDetached !== filters.isDetached
  ) {
    return false;
  }

  return inRange(occurrence.scheduledStartAt, filters.startDate, filters.endDate);
};

export const matchesAssignmentFilters = (
  assignment: OpsJobEmployeeAssignment,
  filters: Record<string, unknown>
) => {
  if (!archivedMatches(assignment.archivedAt, filters.includeArchived)) {
    return false;
  }
  if (filters.jobId && assignment.jobId !== filters.jobId) return false;
  if (filters.employeeId && assignment.employeeId !== filters.employeeId) {
    return false;
  }
  if (!inRange(assignment.assignedFrom, filters.startDate, filters.endDate)) {
    return false;
  }

  const activeTime = asDate(filters.activeOnDate as Date | string | undefined);
  if (activeTime === null) return true;

  const fromTime = asDate(assignment.assignedFrom);
  const toTime = asDate(assignment.assignedTo);
  return fromTime !== null && fromTime <= activeTime && (toTime === null || toTime >= activeTime);
};

export const sortJobs = (jobs: OpsJobListItem[]) =>
  [...jobs].sort((a, b) => (asDate(b.updatedAt) ?? 0) - (asDate(a.updatedAt) ?? 0));

export const sortEmployees = (employees: OpsEmployee[]) =>
  [...employees].sort((a, b) => (asDate(b.updatedAt) ?? 0) - (asDate(a.updatedAt) ?? 0));

export const sortOccurrences = (occurrences: OpsOccurrence[]) =>
  [...occurrences].sort(
    (a, b) => (asDate(a.scheduledStartAt) ?? 0) - (asDate(b.scheduledStartAt) ?? 0)
  );

export const sortAssignments = (assignments: OpsJobEmployeeAssignment[]) =>
  [...assignments].sort(
    (a, b) => (asDate(b.assignedFrom) ?? 0) - (asDate(a.assignedFrom) ?? 0)
  );
