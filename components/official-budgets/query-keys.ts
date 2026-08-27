export const officialBudgetKeys = {
  all: ["official-budgets"] as const,
  lists: () => [...officialBudgetKeys.all, "list"] as const,
  list: (filters: { status?: string; query?: string }) =>
    [...officialBudgetKeys.lists(), filters] as const,
  details: () => [...officialBudgetKeys.all, "detail"] as const,
  detail: (id: string) => [...officialBudgetKeys.details(), id] as const,
};
