"use server";

import { createOperationalCostCategory } from "@/actions/ops";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import ValidationError from "@/instances/validation-error";
import type { CreateOperationalCostCategoryInput } from "@/schemas/ops";

export const createOperationalCostCategoryAction = async (
  values: CreateOperationalCostCategoryInput
) => {
  try {
    const result = await createOperationalCostCategory(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.category);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al crear la categoria");
  }
};

