import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createBudgetAction } from "../actions/create-budget.action"
import { toast } from "sonner"
import { BudgetFormValues } from "@/schemas/BudgetSchema"
import { invalidateBudgetSources, putBudgetOnTop } from "@/components/budgets/hooks/budget-cache"

export const useCreateBudgetMutation = () => {
    const queryClient = useQueryClient()

    const createBudgetMutation = useMutation({
        mutationFn: (values: BudgetFormValues) => createBudgetAction(values),

        onSuccess: (newBudget) => {
            if (!newBudget) return

            void putBudgetOnTop(queryClient, newBudget, { isNew: true })
            void invalidateBudgetSources(queryClient)

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
