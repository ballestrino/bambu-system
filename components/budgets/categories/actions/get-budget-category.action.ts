import { getBudgetCategoryById } from "@/data/budgetCategory"
import ValidationError from "@/instances/validation-error"

export const getBudgetCategoryAction = async (id: string | null) => {
  try {
    if (!id) throw new ValidationError("El id es obligatorio")

    const result = await getBudgetCategoryById(id)

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
