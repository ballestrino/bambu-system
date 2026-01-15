import { getBudgets } from "@/data/budgets"
import ValidationError from "@/instances/validation-error"
import { BudgetFilters } from "../interfaces/budget-filters"


import { Budget } from "@prisma/client"

export const getBudgetsAction = async (filters: BudgetFilters): Promise<{
    budgets: Budget[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}> => {
  try {
    const { query, page, limit, ...restFilters } = filters;
    const result = await getBudgets(query, page, limit, restFilters)

    if ('error' in result && result.error) {
      throw new ValidationError(result.error)
    }
    
    // Narrowing: TypeScript now knows result is the success variant (or we force cast if needed, but 'in' check should work)
    if ('error' in result) {
         throw new ValidationError("Unexpected error state")
    }

    return result
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error("Error al obtener los presupuestos")
  }
}