"use client"

import { useQuery } from "@tanstack/react-query"
import { getBudgetsAction } from "@/components/budgets/actions/get-budgets.action"
import { BudgetFilters } from "@/components/budgets/interfaces/budget-filters"

export default function useBudgets(filters: BudgetFilters) {
    // Query principal de presupuestos
    const budgetsQuery = useQuery({
        queryKey: ["budgets", filters],
        queryFn: () => getBudgetsAction(filters),
        staleTime: 1000 * 60, // 1 minuto
        refetchInterval: 1000 * 60, // 1 minuto
        retry: 1,
        refetchOnMount: true
    })

    return {
        budgets: budgetsQuery.data?.budgets || [],
        isLoading: budgetsQuery.isLoading,
        isError: budgetsQuery.isError,
        error: budgetsQuery.error,
        refetch: budgetsQuery.refetch
    }
}
