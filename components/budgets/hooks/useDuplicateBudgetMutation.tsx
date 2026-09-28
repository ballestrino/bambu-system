import { useMutation, useQueryClient } from "@tanstack/react-query"
import { duplicateBudgetAction } from "../actions/duplicate-budget.action"
import { toast } from "sonner"
import { invalidateBudgetSources, putBudgetOnTop } from "@/components/budgets/hooks/budget-cache"

export const useDuplicateBudgetMutation = () => {
    const queryClient = useQueryClient()

    const duplicateBudgetMutation = useMutation({
        mutationFn: (budgetId: string) => duplicateBudgetAction(budgetId),

        onSuccess: (newBudget) => {
            if (!newBudget) return

            // The copy is the newest budget: first in the unfiltered list, and
            // every other list refetches.
            void putBudgetOnTop(queryClient, newBudget, { isNew: true })
            void invalidateBudgetSources(queryClient)

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
