"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import createBudgetCategory from "@/actions/budgetCategories/create-budget-category"
import { toast } from "sonner"
import { BudgetCategoryWithCount } from "../../interfaces/category"
import { budgetCategoryKeys } from "@/components/budgets/query-keys"
import { invalidateCategoryScopes } from "@/components/budgets/hooks/budget-cache"

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
        mutationFn: (data: CreateBudgetCategoryValues) => createBudgetCategory(data),
        onSuccess: (data) => {
            const newCategory = data?.category
            if (!newCategory || "error" in newCategory) {
                toast.error(data?.error || "Error al crear la categoría")
                return
            }

            // If it's a subcategory
            if (newCategory.parentCategoryId) {
                // 1. Add to sub-categories list
                queryClient.setQueryData<BudgetCategoryWithCount[]>(budgetCategoryKeys.children(newCategory.parentCategoryId), (old) => {
                    if (!Array.isArray(old)) return [newCategory]
                    return [...old, newCategory]
                })

                // 2. Update parent count in budget-categories list
                queryClient.setQueryData<BudgetCategoryWithCount[]>(budgetCategoryKeys.roots(), (old) => {
                    if (!Array.isArray(old)) return old
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
                queryClient.setQueryData<BudgetCategoryWithCount[]>(budgetCategoryKeys.roots(), (old) => {
                    if (!Array.isArray(old)) return [newCategory]
                    return [...old, newCategory]
                })
            }
            void invalidateCategoryScopes(queryClient)

            toast.success("Categoría creada exitosamente")
        },
        onError: (error) => {
            toast.error(error?.message || "Error al crear la categoría")
        }
    })

    return mutation
}
