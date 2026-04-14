import { duplicateBudget } from "@/actions/budgets/duplicate-budget"
import ValidationError from "@/instances/validation-error"

export const duplicateBudgetAction = async (budgetId: string) => {
  try {
    const result = await duplicateBudget(budgetId)

    if (result.error) {
      throw new ValidationError(result.error)
    }

    return result.budget
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error("Error al duplicar el presupuesto")
  }
}
