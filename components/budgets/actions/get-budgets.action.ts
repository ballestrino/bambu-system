import { readBudgets } from "./budget-reads"
import ValidationError from "@/instances/validation-error"
import { BudgetFilters } from "../interfaces/budget-filters"


import type { GeneratorBudgetListItem } from "@/components/budgets/interfaces/generator-budget"

export const getBudgetsAction = async (filters: BudgetFilters): Promise<{
    budgets: GeneratorBudgetListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}> => {
  try {
    const result = await readBudgets(filters)

    if ('error' in result && result.error) {
      throw new ValidationError(result.error)
    }
    
    // An error key without a message still is not a list.
    if ('error' in result) {
         throw new ValidationError("No se pudieron leer los presupuestos")
    }

    return result
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error("Error al obtener los presupuestos")
  }
}
