"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import deleteBudgetCategory from "@/actions/budgetCategories/delete-budget-category"
import { toast } from "sonner"
import { BudgetCategoryWithCount } from "../../interfaces/category"
import { budgetCategoryKeys } from "@/components/budgets/query-keys"
import { invalidateCategoryScopes } from "@/components/budgets/hooks/budget-cache"

export const useDeleteBudgetCategoryMutation = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (id: string) => deleteBudgetCategory(id),
        onSuccess: (result) => {
            if ("error" in result) {
                toast.error(result.error)
                return
            }
            const deletedCategory = result.category

            if (deletedCategory.parentCategoryId) {
                // 1. Remove from sub-categories list
                queryClient.setQueryData<BudgetCategoryWithCount[]>(budgetCategoryKeys.children(deletedCategory.parentCategoryId), (old) => {
                    if (!Array.isArray(old)) return old
                    return old.filter((category) => category.id !== deletedCategory.id)
                })

                // 2. Decrement parent count in budget-categories list
                queryClient.setQueryData<BudgetCategoryWithCount[]>(budgetCategoryKeys.roots(), (old) => {
                    if (!Array.isArray(old)) return old
                    return old.map(cat => {
                        if (cat.id === deletedCategory.parentCategoryId) {
                            return {
                                ...cat,
                                _count: {
                                    ...cat._count,
                                    childCategories: Math.max((cat._count?.childCategories || 0) - 1, 0)
                                }
                            }
                        }
                        return cat
                    })
                })
            } else {
                queryClient.setQueryData<BudgetCategoryWithCount[]>(budgetCategoryKeys.roots(), (old) => {
                    if (!Array.isArray(old)) return old
                    return old.filter((category) => category.id !== deletedCategory.id)
                })
            }
            // The deleted detail goes; budgets that had it drop the badge.
            queryClient.removeQueries({ queryKey: budgetCategoryKeys.detail(deletedCategory.id) })
            void invalidateCategoryScopes(queryClient)

            toast.success("Categoría eliminada exitosamente")
        },
        onError: () => {
            toast.error("Error al eliminar la categoría")
        }
    })

    return mutation
}
