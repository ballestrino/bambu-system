"use client"

import { useQuery } from "@tanstack/react-query"
import { getBudgetSubCategoriesAction } from "../actions/get-budget-sub-categories.action"

export default function useSubCategories(parentId: string) {
    const query = useQuery({
        queryKey: ["sub-categories", parentId],
        queryFn: () => getBudgetSubCategoriesAction(parentId),
    })

    const subCategories = Array.isArray(query.data) ? query.data : []
    const isError = query.isError || (query.data && "error" in query.data)
    const error = query.error || (query.data && "error" in query.data ? query.data.error : null)

    return {
        subCategories,
        isLoading: query.isLoading,
        isRefetching: query.isRefetching,
        isError,
        error: error,
        refetch: query.refetch
    }
}
