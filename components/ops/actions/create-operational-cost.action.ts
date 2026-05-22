"use server";

import { createOperationalCost } from "@/actions/ops";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import ValidationError from "@/instances/validation-error";
import type { CreateOperationalCostInput } from "@/schemas/ops";

export const createOperationalCostAction = async (
  values: CreateOperationalCostInput
) => {
  try {
    const result = await createOperationalCost(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.cost);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al crear el coste");
  }
};
