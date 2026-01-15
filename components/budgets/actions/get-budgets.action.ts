import { getBudgets } from "@/data/budgets"
import ValidationError from "@/instances/validation-error"
import { BudgetFilters } from "../interfaces/budget-filters"


export const getBudgetsAction = async (filters: BudgetFilters) => {
  try {
    const { query, page, limit, ...restFilters } = filters;
    const result = await getBudgets(query, page, limit, restFilters)

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