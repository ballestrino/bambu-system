"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getOfficialBudgetAction,
  getOfficialBudgetListAction,
} from "@/components/official-budgets/actions/official-budget-reads";
import { officialBudgetKeys } from "@/components/official-budgets/query-keys";

export const useOfficialBudgetList = (filters: {
  status: "ACTIVE" | "ARCHIVED";
  query?: string;
}) =>
  useQuery({
    queryKey: officialBudgetKeys.screen(filters),
    queryFn: () => getOfficialBudgetListAction(filters),
    placeholderData: keepPreviousData,
  });

export const useOfficialBudget =(officialBudgetId: string) =>
  useQuery({
    queryKey: officialBudgetKeys.detail(officialBudgetId),
    queryFn: () => getOfficialBudgetAction(officialBudgetId),
  });
