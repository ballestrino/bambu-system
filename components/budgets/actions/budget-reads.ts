"use server";

import { getBudgetBySlug } from "@/data/budget";
import { getBudgets } from "@/data/budgets";
import type { BudgetFilters } from "@/components/budgets/interfaces/budget-filters";

// Server Actions for the client hooks. The data reads check the admin session
// themselves and stay server-only.
export const readBudgets = async (filters: BudgetFilters) => {
  const { query, page, limit, ...restFilters } = filters;
  return getBudgets(query, page, limit, restFilters);
};

export const readBudgetBySlug = async (slug: string) => getBudgetBySlug(slug);
