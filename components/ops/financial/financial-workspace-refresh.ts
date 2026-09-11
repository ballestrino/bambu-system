type Refetchable = { refetch: () => Promise<unknown> };

type FinancialQueries = {
  categories: Refetchable;
  costs: Refetchable;
  employeePayments: Refetchable;
  employees: Refetchable;
  jobs: Refetchable;
  occurrences: Refetchable;
  payments: Refetchable;
  payrollOccurrences: Refetchable;
  profitability: Refetchable;
  settings: Refetchable;
  trend: Refetchable;
};

const refetchAll = (queries: Refetchable[]) =>
  Promise.all(queries.map((query) => query.refetch()));

// Refetching a disabled query is a no-op in React Query, so these stay correct
// whatever the active section gated off.
export const buildFinancialRefresh = (queries: FinancialQueries) => ({
  all: () => refetchAll(Object.values(queries)),
  costs: () =>
    refetchAll([
      queries.categories,
      queries.costs,
      queries.employees,
      queries.jobs,
      queries.settings,
    ]),
  payments: () =>
    refetchAll([
      queries.jobs,
      queries.payments,
      queries.occurrences,
      queries.trend,
    ]),
  payroll: () =>
    refetchAll([
      queries.employeePayments,
      queries.employees,
      queries.payrollOccurrences,
    ]),
  profitability: () => refetchAll([queries.profitability]),
});
