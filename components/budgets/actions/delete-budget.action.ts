import deleteBudget from "@/actions/budgets/delete-budget"
import ValidationError from "@/instances/validation-error"


export const deleteBudgetAction = async (budgetId: string) => {
  try {
    const result = await deleteBudget(budgetId)

    if (result.error) {
      throw new ValidationError(result.error)
    }
    return result.success
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error("Error al eliminar el presupuesto")
  }
}