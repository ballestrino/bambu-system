"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import updateBudgetCategory from "@/actions/budgetCategories/update-budget-category"
import { toast } from "sonner"
import { BudgetCategoryWithCount } from "../../interfaces/category"
import { budgetCategoryKeys } from "@/components/budgets/query-keys"
import { invalidateCategoryScopes } from "@/components/budgets/hooks/budget-cache"

interface UpdateBudgetCategoryValues {
    id: string
    name: string
    description: string
    color: string
    isActive: boolean
}

export const useUpdateBudgetCategoryMutation = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (values: UpdateBudgetCategoryValues) => updateBudgetCategory(values),
        onSuccess: (result) => {
            if ("error" in result) {
                toast.error(result.error)
                return
            }
            const updatedCategory = result.category
            const listKey = updatedCategory.parentCategoryId
                ? budgetCategoryKeys.children(updatedCategory.parentCategoryId)
                : budgetCategoryKeys.roots()

            queryClient.setQueryData<BudgetCategoryWithCount[]>(listKey, (old) => {
                if (!Array.isArray(old)) return old
                return old.map((cat) => (cat.id === updatedCategory.id ? { ...cat, ...updatedCategory } : cat))
            })
            // Name and color show in the detail and in every budget card.
            void invalidateCategoryScopes(queryClient)

            toast.success("Categoría actualizada exitosamente")
        },
        onError: () => {
            toast.error("Error al actualizar la categoría")
        }
    })

    return mutation
}
