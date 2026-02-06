import { useQuery } from "@tanstack/react-query"
import { getBudgetAction } from "../actions/get-budget.action"

export default function useBudget(slug: string) {

    const budgetQuery = useQuery({
        queryKey: ["budget", slug],
        queryFn: () => getBudgetAction(slug),
        staleTime: 1000 * 60 * 5 // 5 minutes
    })

    return {
        budget: budgetQuery.data,
        error: budgetQuery.error,
        isLoading: budgetQuery.isLoading,
        isFetching: budgetQuery.isFetching,
        isRefetching: budgetQuery.isRefetching
    }
}