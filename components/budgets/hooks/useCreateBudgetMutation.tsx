import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createBudgetAction } from "../actions/create-budget.action"
import { toast } from "sonner"
import { BudgetFormValues } from "@/schemas/BudgetSchema"
import { Budget } from "@prisma/client"

export const useCreateBudgetMutation = () => {
    const queryClient = useQueryClient()

    const createBudgetMutation = useMutation({
        mutationFn: (values: BudgetFormValues) => createBudgetAction(values),

        onSuccess: (newBudget) => {
            if (!newBudget) return

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
                        budgets: [newBudget, ...old.budgets]
                    }
                }
            )

            // 2. Invalidate other searches (where query is NOT empty)
            queryClient.invalidateQueries({
                queryKey: ["budgets"],
                predicate: (query) => {
                    const filters = query.queryKey[1] as any
                    return !!filters?.query && filters.query !== ""
                }
            })

            toast.success("Presupuesto creado exitosamente")
        },

        onError: (error) => {
            const errorMessage =
                error instanceof Error ? error.message : "Error al crear el presupuesto"
            toast.error(errorMessage)
        }
    })

    return {
        createBudget: createBudgetMutation.mutate,
        createBudgetAsync: createBudgetMutation.mutateAsync,
        isCreating: createBudgetMutation.isPending,
        isSuccess: createBudgetMutation.isSuccess,
        isError: createBudgetMutation.isError,
        error: createBudgetMutation.error
    }
}
