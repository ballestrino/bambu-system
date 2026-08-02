import type { OpsOccurrence } from "@/components/ops/types";
import { getOccurrenceEmployees } from "@/components/ops/jobs/occurrence-employees";
import { needsOccurrenceAttention } from "@/components/ops/calendar/calendar-utils";

export const ALL_CALENDAR_FILTER = "ALL";
export const UNASSIGNED_EMPLOYEE_FILTER = "UNASSIGNED";

export type CalendarFilters = {
  attentionOnly: boolean;
  employeeId: string;
  jobId: string;
  status: OpsOccurrence["status"] | typeof ALL_CALENDAR_FILTER;
};

export type CalendarFilterOption = {
  id: string;
  name: string;
};

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  attentionOnly: false,
  employeeId: ALL_CALENDAR_FILTER,
  jobId: ALL_CALENDAR_FILTER,
  status: ALL_CALENDAR_FILTER,
};

export const hasActiveCalendarFilters = (filters: CalendarFilters) =>
  filters.attentionOnly ||
  filters.employeeId !== ALL_CALENDAR_FILTER ||
  filters.jobId !== ALL_CALENDAR_FILTER ||
  filters.status !== ALL_CALENDAR_FILTER;

const sortOptions = (options: CalendarFilterOption[]) =>
  options.sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );

export const getCalendarFilterOptions = (occurrences: OpsOccurrence[]) => {
  const jobs = new Map<string, CalendarFilterOption>();
  const employees = new Map<string, CalendarFilterOption>();

  occurrences.forEach((occurrence) => {
    jobs.set(occurrence.job.id, {
      id: occurrence.job.id,
      name: occurrence.job.name,
    });

    getOccurrenceEmployees(occurrence).forEach((employee) => {
      employees.set(employee.id, { id: employee.id, name: employee.name });
    });
  });

  return {
    employeeOptions: sortOptions(Array.from(employees.values())),
    jobOptions: sortOptions(Array.from(jobs.values())),
  };
};

export const filterCalendarOccurrences = (
  occurrences: OpsOccurrence[],
  filters: CalendarFilters
) =>
  occurrences.filter((occurrence) => {
    if (
      filters.jobId !== ALL_CALENDAR_FILTER &&
      occurrence.jobId !== filters.jobId
    ) {
      return false;
    }

    const employeeIds = getOccurrenceEmployees(occurrence).map(
      (employee) => employee.id
    );
    if (
      filters.employeeId === UNASSIGNED_EMPLOYEE_FILTER &&
      employeeIds.length > 0
    ) {
      return false;
    }
    if (
      filters.employeeId !== ALL_CALENDAR_FILTER &&
      filters.employeeId !== UNASSIGNED_EMPLOYEE_FILTER &&
      !employeeIds.includes(filters.employeeId)
    ) {
      return false;
    }

    if (
      filters.status !== ALL_CALENDAR_FILTER &&
      occurrence.status !== filters.status
    ) {
      return false;
    }

    return !filters.attentionOnly || needsOccurrenceAttention(occurrence);
  });
