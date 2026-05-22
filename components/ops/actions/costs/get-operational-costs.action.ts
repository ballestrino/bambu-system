"use server";

import { getOperationalCosts } from "@/data/ops";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import ValidationError from "@/instances/validation-error";
import type { OperationalCostFilters } from "@/schemas/ops";

export const getOperationalCostsAction = async (
  filters?: OperationalCostFilters
) => {
  try {
    const result = await getOperationalCosts(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.costs);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al obtener costes");
  }
};

