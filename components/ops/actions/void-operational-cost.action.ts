"use server";

import { voidOperationalCost } from "@/actions/ops";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import ValidationError from "@/instances/validation-error";

export const voidOperationalCostAction = async (costId: string) => {
  try {
    const result = await voidOperationalCost(costId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.cost);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al anular el coste");
  }
};
