"use server";

import { archiveOperationalCostCategory } from "@/actions/ops";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import ValidationError from "@/instances/validation-error";

export const archiveOperationalCostCategoryAction = async (
  categoryId: string
) => {
  try {
    const result = await archiveOperationalCostCategory(categoryId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.category);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al archivar la categoria");
  }
};
