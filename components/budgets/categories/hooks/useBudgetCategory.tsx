import { useQuery } from "@tanstack/react-query";
import { getBudgetCategoryAction } from "../actions/get-budget-category.action";
import { budgetCategoryKeys } from "@/components/budgets/query-keys";

export default function useBudgetCategory(id: string | null) {

    const budgetCategoryQuery = useQuery({
        queryKey: budgetCategoryKeys.detail(id),
        queryFn: () => getBudgetCategoryAction(id),
        staleTime: 1000 * 60 * 5 // 5 minutes
    })

    return {
        category: budgetCategoryQuery.data,
        error: budgetCategoryQuery.error,
        isLoading: budgetCategoryQuery.isLoading,
        isFetching: budgetCategoryQuery.isFetching,
        isRefetching: budgetCategoryQuery.isRefetching,

    }
}
