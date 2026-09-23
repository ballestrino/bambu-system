"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import updateBudgetCategory from "@/actions/budgetCategories/update-budget-category"
import { toast } from "sonner"
import { BudgetCategoryWithCount } from "../../interfaces/category"

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

            if (updatedCategory.parentCategoryId) {
                queryClient.setQueryData<BudgetCategoryWithCount[]>(["sub-categories", updatedCategory.parentCategoryId], (old) => {
                    if (!old) return [updatedCategory]
                    return old.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat))
                })
            } else {
                queryClient.setQueryData<BudgetCategoryWithCount[]>(["budget-categories"], (old) => {
                    if (!old) return [updatedCategory]
                    return old.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat))
                })
            }

            toast.success("Categoría actualizada exitosamente")
        },
        onError: () => {
            toast.error("Error al actualizar la categoría")
        }
    })

    return mutation
}
