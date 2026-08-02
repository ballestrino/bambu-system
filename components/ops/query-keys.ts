export const opsQueryKeys = {
  jobs: ["ops", "jobs"] as const,
  job: (jobId: string) => ["ops", "job", jobId] as const,
  scheduleRuleRoot: ["ops", "schedule-rules"] as const,
  scheduleRules: (jobId?: string) =>
    ["ops", "schedule-rules", jobId ?? "all"] as const,
  occurrenceRoot: ["ops", "occurrences"] as const,
  occurrences: (scope?: string) =>
    ["ops", "occurrences", scope ?? "all"] as const,
  calendarRoot: ["ops", "calendar"] as const,
  calendar: (monthKey: string) => ["ops", "calendar", monthKey] as const,
  visitFeedRoot: ["ops", "visit-feed"] as const,
  visitFeed: (scope: unknown) => ["ops", "visit-feed", scope] as const,
  visitFilterOptions: ["ops", "visit-filter-options"] as const,
  budgetSources: (scope?: { query?: string; selectedBudgetId?: string }) =>
    ["ops", "budget-sources", scope ?? {}] as const,
  employees: ["ops", "employees"] as const,
  employee: (employeeId: string) => ["ops", "employee", employeeId] as const,
  assignments: ["ops", "assignments"] as const,
  assignmentScope: (scope?: string) =>
    ["ops", "assignments", scope ?? "all"] as const,
  clientPayments: ["ops", "client-payments"] as const,
  clientPaymentScope: (scope?: string) =>
    ["ops", "client-payments", scope ?? "all"] as const,
  employeePayments: ["ops", "employee-payments"] as const,
  employeePaymentScope: (scope?: string) =>
    ["ops", "employee-payments", scope ?? "all"] as const,
  costCategories: ["ops", "cost-categories"] as const,
  costs: ["ops", "costs"] as const,
  costScope: (scope?: string) => ["ops", "costs", scope ?? "all"] as const,
  costSettings: ["ops", "cost-settings"] as const,
};
