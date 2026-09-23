"use client"

import { useQuery } from "@tanstack/react-query"
import { readBudgetCategories } from "../actions/budget-category-reads"

export default function useBudgetCategories() {
    const query = useQuery({
        queryKey: ["budget-categories"],
        queryFn: () => readBudgetCategories(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const categories = Array.isArray(query.data) ? query.data : []
    const isError = query.isError || (query.data && "error" in query.data)
    const error = query.error || (query.data && "error" in query.data ? query.data.error : null)

    return {
        categories,
        isLoading: query.isLoading,
        isRefetching: query.isRefetching,
        isError,
        error: error,
        refetch: query.refetch
    }
}
