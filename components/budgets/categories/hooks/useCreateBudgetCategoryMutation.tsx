"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import createBudgetCategory from "@/actions/budgetCategories/create-budget-category"
import { toast } from "sonner"
import { BudgetCategoryWithCount } from "../../interfaces/category"

interface CreateBudgetCategoryValues {
    name: string
    description: string
    color: string
    isActive: boolean
    parentCategoryId?: string
}

export const useCreateBudgetCategoryMutation = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (values: CreateBudgetCategoryValues) => createBudgetCategory(values.name, values.description, values.color, values.isActive, values.parentCategoryId),
        onSuccess: (newCategory) => {
            if (!newCategory || "error" in newCategory) {
                toast.error("Error al crear la categoría")
                return
            }

            // If it's a subcategory
            if (newCategory.parentCategoryId) {
                // 1. Add to sub-categories list
                queryClient.setQueryData<BudgetCategoryWithCount[]>(["sub-categories", newCategory.parentCategoryId], (old) => {
                    if (!old) return [newCategory]
                    return [...old, newCategory]
                })

                // 2. Update parent count in budget-categories list
                queryClient.setQueryData<BudgetCategoryWithCount[]>(["budget-categories"], (old) => {
                    if (!old) return []
                    return old.map(cat => {
                        if (cat.id === newCategory.parentCategoryId) {
                            return {
                                ...cat,
                                _count: {
                                    ...cat._count,
                                    childCategories: (cat._count?.childCategories || 0) + 1
                                }
                            }
                        }
                        return cat
                    })
                })
            } else {
                // If it's a root category, add to the main list
                queryClient.setQueryData<BudgetCategoryWithCount[]>(["budget-categories"], (old) => {
                    if (!old) return [newCategory]
                    return [...old, newCategory]
                })
            }



            toast.success("Categoría creada exitosamente")
        },
        onError: () => {
            toast.error("Error al crear la categoría")
        }
    })

    return mutation
}
