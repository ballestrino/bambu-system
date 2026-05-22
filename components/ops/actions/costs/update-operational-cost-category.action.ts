"use server";

import { updateOperationalCostCategory } from "@/actions/ops";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import ValidationError from "@/instances/validation-error";
import type { UpdateOperationalCostCategoryInput } from "@/schemas/ops";

export const updateOperationalCostCategoryAction = async (
  categoryId: string,
  values: UpdateOperationalCostCategoryInput
) => {
  try {
    const result = await updateOperationalCostCategory(categoryId, values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.category);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al actualizar la categoria");
  }
};

