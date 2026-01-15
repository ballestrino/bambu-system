import { updateBudget } from "@/actions/budgets/update-budget"
import ValidationError from "@/instances/validation-error"
import { BudgetFormValues } from "@/schemas/BudgetSchema"

export const updateBudgetAction = async (id: string, slug: string, values: BudgetFormValues) => {
  try {
    const result = await updateBudget(id, slug, values)

    if (result.error) {
      throw new ValidationError(result.error)
    }
    
    // Return the budget object directly
    return result.budget
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error("Error al actualizar el presupuesto")
  }
}
