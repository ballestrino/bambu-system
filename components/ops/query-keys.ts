export const opsQueryKeys = {
  jobs: ["ops", "jobs"] as const,
  job: (jobId: string) => ["ops", "job", jobId] as const,
  scheduleRules: (jobId?: string) =>
    ["ops", "schedule-rules", jobId ?? "all"] as const,
  occurrences: (scope?: string) =>
    ["ops", "occurrences", scope ?? "all"] as const,
  calendar: (monthKey: string) => ["ops", "calendar", monthKey] as const,
  budgetSources: ["ops", "budget-sources"] as const,
  employees: ["ops", "employees"] as const,
  employee: (employeeId: string) => ["ops", "employee", employeeId] as const,
  assignments: ["ops", "assignments"] as const,
  assignmentScope: (scope?: string) =>
    ["ops", "assignments", scope ?? "all"] as const,
  clientPayments: ["ops", "client-payments"] as const,
  clientPaymentScope: (scope?: string) =>
    ["ops", "client-payments", scope ?? "all"] as const,
};
