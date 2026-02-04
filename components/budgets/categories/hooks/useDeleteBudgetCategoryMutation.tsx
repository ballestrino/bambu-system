"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import deleteBudgetCategory from "@/actions/budgetCategories/delete-budget-category"
import { toast } from "sonner"
import { BudgetCategory } from "@prisma/client"

export const useDeleteBudgetCategoryMutation = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (id: string) => deleteBudgetCategory(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<BudgetCategory[]>(["budget-categories"], (old) => {
                if (!old) return []
                return old.filter((category) => category.id !== id)
            })

            toast.success("Categoría eliminada exitosamente")
        },
        onError: () => {
            toast.error("Error al eliminar la categoría")
        }
    })

    return mutation
}
