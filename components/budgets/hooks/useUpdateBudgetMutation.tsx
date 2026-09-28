import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateBudgetAction } from "@/components/budgets/actions/update-budget.action"
import { toast } from "sonner"
import { BudgetFormValues } from "@/schemas/BudgetSchema"
import { officialBudgetKeys } from "@/components/official-budgets/query-keys"
import {
    invalidateBudgetSources,
    putBudgetOnTop,
    refreshBudgetDetail,
} from "@/components/budgets/hooks/budget-cache"
import { budgetKeys } from "@/components/budgets/query-keys"

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

            // Saving bumps updatedAt, so the budget moves to the top of the
            // unfiltered list; filtered lists may gain or lose it and refetch.
            void putBudgetOnTop(queryClient, updatedBudget, { isNew: false })

            // The saved budget comes back without its options and categories,
            // so the detail is read again instead of overwritten. A new slug
            // means a new detail key; the old one goes.
            if (variables.slug !== updatedBudget.slug) {
                queryClient.removeQueries({ queryKey: budgetKeys.detail(variables.slug) })
            }
            void refreshBudgetDetail(queryClient, updatedBudget.slug)

            void queryClient.invalidateQueries({ queryKey: officialBudgetKeys.all })
            void invalidateBudgetSources(queryClient)

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
