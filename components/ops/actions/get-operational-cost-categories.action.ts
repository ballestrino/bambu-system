"use server";

import { getOperationalCostCategories } from "@/data/ops";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import ValidationError from "@/instances/validation-error";
import type { OperationalCostCategoryFilters } from "@/schemas/ops";

export const getOperationalCostCategoriesAction = async (
  filters?: OperationalCostCategoryFilters
) => {
  try {
    const result = await getOperationalCostCategories(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.categories);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al obtener categorias de costes");
  }
};
