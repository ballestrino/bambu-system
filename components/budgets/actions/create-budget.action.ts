import { createBudget } from "@/actions/budgets/create-budget"
import ValidationError from "@/instances/validation-error"
import { BudgetFormValues } from "@/schemas/BudgetSchema"

export const createBudgetAction = async (values: BudgetFormValues) => {
  try {
    const result = await createBudget(values)

    if (result.error) {
      throw new ValidationError(result.error)
    }
    
    return result.budget
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error("Error al crear el presupuesto")
  }
}
