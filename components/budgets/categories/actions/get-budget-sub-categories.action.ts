"use server"

import { getBudgetSubCategories } from "@/data/budgetCategory"
import ValidationError from "@/instances/validation-error"

export const getBudgetSubCategoriesAction = async (parentId: string) => {
  try {
    const result = await getBudgetSubCategories(parentId)

    if ("error" in result) {
      throw new ValidationError(result.error)
    }
    
    return result
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error("Error al obtener las subcategorías")
  }
}
