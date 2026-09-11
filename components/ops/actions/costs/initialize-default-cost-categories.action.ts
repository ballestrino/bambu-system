"use server";

import { initializeDefaultCostCategories } from "@/actions/ops/cost-category-defaults";
import ValidationError from "@/instances/validation-error";

export const initializeDefaultCostCategoriesAction = async () => {
  try {
    const result = await initializeDefaultCostCategories();

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.success;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al crear las categorias por defecto");
  }
};
