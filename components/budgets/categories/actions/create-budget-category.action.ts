import createBudgetCategory, { CreateBudgetCategoryValues } from "@/actions/budgetCategories/create-budget-category"
import ValidationError from "@/instances/validation-error"

export const getBudgetCategoryAction = async (data: CreateBudgetCategoryValues) => {
  try {
    const result = await createBudgetCategory(data)

    if (result.error) {
      throw new ValidationError(result.error)
    }
    
    return result.category
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error("Error al crear el presupuesto")
  }
}
