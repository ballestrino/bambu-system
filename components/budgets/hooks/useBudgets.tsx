"use client"

import { useQuery } from "@tanstack/react-query"
import { getBudgetsAction } from "@/components/budgets/actions/get-budgets.action"
import { BudgetFilters } from "@/components/budgets/interfaces/budget-filters"

export default function useBudgets(filters: BudgetFilters) {
    const budgetsQuery = useQuery({
        queryKey: ["budgets", { filters }],
        queryFn: () => getBudgetsAction(filters),
        staleTime: 1000 * 60, // 1 minuto
        refetchInterval: 1000 * 60, // 1 minuto
        retry: 1,
        refetchOnMount: true,
        placeholderData: (previousData) => previousData,
    })

    return {
        budgets: budgetsQuery.data?.budgets || [],
        totalCount: budgetsQuery.data?.totalCount || 0,
        totalPages: budgetsQuery.data?.totalPages || 0,
        isLoading: budgetsQuery.isLoading,
        isError: budgetsQuery.isError,
        error: budgetsQuery.error,
        refetch: budgetsQuery.refetch
    }
}
