"use server";

import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import { getFinanceTrend } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import type { FinanceTrendQueryInput } from "@/schemas/ops";

export const getFinanceTrendAction = async (query: FinanceTrendQueryInput) => {
  try {
    const result = await getFinanceTrend(query);
    if (result.error) throw new ValidationError(result.error);
    return serializeActionResult(result.trend ?? []);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al obtener la tendencia financiera");
  }
};
