import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateBudgetAction } from "@/components/budgets/actions/update-budget.action"
import { toast } from "sonner"
import { BudgetFormValues } from "@/schemas/BudgetSchema"
import { Budget } from "@prisma/client"

interface UpdateBudgetParams {
    id: string
    slug: string
    values: BudgetFormValues
}

export const useUpdateBudgetMutation = () => {
    const queryClient = useQueryClient()

    const updateBudgetMutation = useMutation({
        mutationFn: ({ id, slug, values }: UpdateBudgetParams) => updateBudgetAction(id, slug, values),

        onSuccess: (updatedBudget, variables) => {
            if (!updatedBudget) return

            // 1. Update the "main" query (query is empty string or undefined)
            queryClient.setQueriesData<{ budgets: Budget[] }>(
                {
                    queryKey: ["budgets"],
                    predicate: (query) => {
                        const filters = query.queryKey[1] as any
                        return !filters?.query || filters.query === ""
                    }
                },
                (old) => {
                    if (!old || !old.budgets) return old
                    return {
                        ...old,
                        budgets: old.budgets.map((b) =>
                            b.id === updatedBudget.id ? updatedBudget : b
                        )
                    }
                }
            )

            // 2. Update specific budget query
            // If slug changed, we need to handle both old and new keys
            if (variables.slug !== updatedBudget.slug) {
                // Remove old query data or invalidate it
                queryClient.removeQueries({ queryKey: ["budget", variables.slug] })

                // Set new query data
                queryClient.setQueriesData(
                    { queryKey: ["budget", updatedBudget.slug] },
                    updatedBudget
                )
            } else {
                // Update existing query
                queryClient.setQueriesData(
                    { queryKey: ["budget", variables.slug] },
                    updatedBudget
                )
            }

            // 3. Invalidate other searches (where query is NOT empty)
            queryClient.invalidateQueries({
                queryKey: ["budgets"],
                predicate: (query) => {
                    const filters = query.queryKey[1] as any
                    return !!filters?.query && filters.query !== ""
                }
            })

            toast.success("Presupuesto actualizado correctamente")
        },

        onError: (error) => {
            const errorMessage =
                error instanceof Error ? error.message : "Error al actualizar el presupuesto"
            toast.error(errorMessage)
        }
    })

    return {
        updateBudget: updateBudgetMutation.mutate,
        updateBudgetAsync: updateBudgetMutation.mutateAsync,
        isUpdating: updateBudgetMutation.isPending,
        isSuccess: updateBudgetMutation.isSuccess,
        isError: updateBudgetMutation.isError,
        error: updateBudgetMutation.error
    }
}
