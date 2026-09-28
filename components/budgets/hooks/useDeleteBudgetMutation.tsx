import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteBudgetAction } from "../actions/delete-budget.action"
import { toast } from "sonner"
import { useState } from "react"
import { budgetKeys } from "@/components/budgets/query-keys"
import {
    invalidateBudgetLists,
    invalidateBudgetSources,
    removeBudgetDetail,
    removeBudgetFromLists,
} from "@/components/budgets/hooks/budget-cache"

export const useDeleteBudgetMutation = () => {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const deleteBudgetMutation = useMutation({
        mutationFn: (budgetId: string) => deleteBudgetAction(budgetId),

        onMutate: async (budgetId: string) => {
            // Cancelar consultas salientes
            await queryClient.cancelQueries({ queryKey: budgetKeys.lists() })

            // Snapshot
            const previousData = queryClient.getQueriesData({ queryKey: budgetKeys.lists() })

            // Optimistic Update
            removeBudgetFromLists(queryClient, budgetId)

            return { previousData }
        },

        onError: (error, _budgetId, context) => {
            // Restaurar datos anteriores
            if (context?.previousData) {
                context.previousData.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data)
                })
            }
            const errorMessage =
                error instanceof Error ? error.message : "Error al eliminar el presupuesto"
            toast.error(errorMessage)
            setSuccess(null)
            setError(errorMessage)
        },

        onSuccess: (result, budgetId) => {
            // Totals and pages shift in every list, and the detail is gone.
            removeBudgetDetail(queryClient, budgetId)
            void invalidateBudgetLists(queryClient)
            void invalidateBudgetSources(queryClient)
            if (result) {
                toast.success(result)
                setError(null)
                setSuccess(result)
            }
        }
    })

    return {
        deleteBudget: deleteBudgetMutation.mutate,
        deleteBudgetAsync: deleteBudgetMutation.mutateAsync,
        isDeleting: deleteBudgetMutation.isPending,
        isSuccess: deleteBudgetMutation.isSuccess,
        isError: deleteBudgetMutation.isError,
        error,
        success
    }
}
