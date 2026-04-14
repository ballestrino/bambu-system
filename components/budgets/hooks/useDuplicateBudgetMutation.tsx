import { useMutation, useQueryClient } from "@tanstack/react-query"
import { duplicateBudgetAction } from "../actions/duplicate-budget.action"
import { toast } from "sonner"
import { Budget } from "@prisma/client"

export const useDuplicateBudgetMutation = () => {
    const queryClient = useQueryClient()

    const duplicateBudgetMutation = useMutation({
        mutationFn: (budgetId: string) => duplicateBudgetAction(budgetId),

        onSuccess: (newBudget) => {
            if (!newBudget) return

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

            toast.success("Presupuesto duplicado")
        },

        onError: (error) => {
            const errorMessage =
                error instanceof Error ? error.message : "Error al duplicar el presupuesto"
            toast.error(errorMessage)
        }
    })

    return {
        duplicateBudget: duplicateBudgetMutation.mutate,
        duplicateBudgetAsync: duplicateBudgetMutation.mutateAsync,
        isDuplicating: duplicateBudgetMutation.isPending,
        isSuccess: duplicateBudgetMutation.isSuccess,
        isError: duplicateBudgetMutation.isError,
        error: duplicateBudgetMutation.error
    }
}
