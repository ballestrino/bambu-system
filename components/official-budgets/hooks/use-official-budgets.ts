"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getOfficialBudgetAction,
  getOfficialBudgetsAction,
} from "@/components/official-budgets/actions/official-budget-reads";
import { officialBudgetKeys } from "@/components/official-budgets/query-keys";

export const useOfficialBudgets = (filters: {
  status: "ACTIVE" | "ARCHIVED";
  query?: string;
}) =>
  useQuery({
    queryKey: officialBudgetKeys.list(filters),
    queryFn: () => getOfficialBudgetsAction(filters),
  });

export const useOfficialBudget = (officialBudgetId: string) =>
  useQuery({
    queryKey: officialBudgetKeys.detail(officialBudgetId),
    queryFn: () => getOfficialBudgetAction(officialBudgetId),
  });
