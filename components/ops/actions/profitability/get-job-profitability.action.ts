"use server";

import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import { getJobProfitability } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import type { ProfitabilityQueryInput } from "@/schemas/ops";

export const getJobProfitabilityAction = async (
  query: ProfitabilityQueryInput
) => {
  try {
    const result = await getJobProfitability(query);
    if (result.error) throw new ValidationError(result.error);
    return serializeActionResult(result.profitability ?? []);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al obtener la rentabilidad de los servicios");
  }
};
