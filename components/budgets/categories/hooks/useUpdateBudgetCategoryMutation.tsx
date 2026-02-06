"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import updateNameBudgetCategory from "@/actions/budgetCategories/update-budget-category"
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
        mutationFn: (values: UpdateBudgetCategoryValues) => updateNameBudgetCategory(values.id, values.name, values.description, values.color, values.isActive),
        onSuccess: (updatedCategory) => {
            if (!updatedCategory || "error" in updatedCategory) {
                toast.error("Error al actualizar la categoría")
                return
            }

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
