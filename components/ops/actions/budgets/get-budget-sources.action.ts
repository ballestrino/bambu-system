"use server";

import { getBudgetSources } from "@/data/ops/budget-sources";
import type { GetBudgetSourcesParams } from "@/data/ops/budget-sources";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";

export const getBudgetSourcesAction = async (params?: GetBudgetSourcesParams) => {
  try {
    const result = await getBudgetSources(params);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener los presupuestos base");
  }
};

