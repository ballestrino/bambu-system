import type { BudgetFilters } from "@/components/budgets/interfaces/budget-filters";

// Every budget query lives under "budgets", so invalidating the root reaches
// lists and details at once. Same shape as the official-budget keys.
export const budgetKeys = {
  all: ["budgets"] as const,
  lists: () => [...budgetKeys.all, "list"] as const,
  list: (filters: BudgetFilters) => [...budgetKeys.lists(), filters] as const,
  details: () => [...budgetKeys.all, "detail"] as const,
  detail: (slug: string) => [...budgetKeys.details(), slug] as const,
};

export const budgetCategoryKeys = {
  all: ["budget-categories"] as const,
  roots: () => [...budgetCategoryKeys.all, "roots"] as const,
  children: (parentId: string) => [...budgetCategoryKeys.all, "children", parentId] as const,
  details: () => [...budgetCategoryKeys.all, "detail"] as const,
  detail: (id: string | null) => [...budgetCategoryKeys.details(), id] as const,
};
