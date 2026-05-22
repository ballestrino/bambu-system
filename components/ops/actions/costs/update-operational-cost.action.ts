"use server";

import { updateOperationalCost } from "@/actions/ops";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import ValidationError from "@/instances/validation-error";
import type { UpdateOperationalCostInput } from "@/schemas/ops";

export const updateOperationalCostAction = async (
  costId: string,
  values: UpdateOperationalCostInput
) => {
  try {
    const result = await updateOperationalCost(costId, values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.cost);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al actualizar el coste");
  }
};

