import { getBudgets } from "@/data/budgets"
import ValidationError from "@/instances/validation-error"
import { BudgetFilters } from "../interfaces/budget-filters"


export const getBudgetsAction = async (filters: BudgetFilters) => {
  try {
    const result = await getBudgets(filters.query)

    if (result.error) {
      throw new ValidationError(result.error)
    }
    return result
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error("Error al obtener los presupuestos")
  }
}