import { getBudgetBySlug } from "@/data/budget"
import ValidationError from "@/instances/validation-error"

export const getBudgetAction = async (slug: string) => {
  try {
    const result = await getBudgetBySlug(slug)

    if (result.error) {
      throw new ValidationError(result.error)
    }

    return result.budget
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error("Error al obtener los presupuestos")
  }
} 