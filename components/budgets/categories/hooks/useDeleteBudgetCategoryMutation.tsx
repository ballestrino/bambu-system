"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import deleteBudgetCategory from "@/actions/budgetCategories/delete-budget-category"
import { toast } from "sonner"
import { BudgetCategoryWithCount } from "../../interfaces/category"

export const useDeleteBudgetCategoryMutation = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (id: string) => deleteBudgetCategory(id),
        onSuccess: (deletedCategory) => {
            if (!deletedCategory || "error" in deletedCategory) {
                toast.error("Error al eliminar la categoría")
                return
            }

            if (deletedCategory.parentCategoryId) {
                // 1. Remove from sub-categories list
                queryClient.setQueryData<BudgetCategoryWithCount[]>(["sub-categories", deletedCategory.parentCategoryId], (old) => {
                    if (!old) return []
                    return old.filter((category) => category.id !== deletedCategory.id)
                })

                // 2. Decrement parent count in budget-categories list
                queryClient.setQueryData<BudgetCategoryWithCount[]>(["budget-categories"], (old) => {
                    if (!old) return []
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
                queryClient.setQueryData<BudgetCategoryWithCount[]>(["budget-categories"], (old) => {
                    if (!old) return []
                    return old.filter((category) => category.id !== deletedCategory.id)
                })
            }

            toast.success("Categoría eliminada exitosamente")
        },
        onError: () => {
            toast.error("Error al eliminar la categoría")
        }
    })

    return mutation
}
