"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import createBudgetCategory from "@/actions/budgetCategories/create-budget-category"
import { toast } from "sonner"
import { BudgetCategory } from "@prisma/client"

interface CreateBudgetCategoryValues {
    name: string
    description: string
}

export const useCreateBudgetCategoryMutation = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (values: CreateBudgetCategoryValues) => createBudgetCategory(values.name, values.description),
        onSuccess: (newCategory) => {
            if (!newCategory || "error" in newCategory) {
                toast.error("Error al crear la categoría")
                return
            }

            queryClient.setQueryData<BudgetCategory[]>(["budget-categories"], (old) => {
                if (!old) return [newCategory]
                return [...old, newCategory]
            })

            toast.success("Categoría creada exitosamente")
        },
        onError: () => {
            toast.error("Error al crear la categoría")
        }
    })

    return mutation
}
