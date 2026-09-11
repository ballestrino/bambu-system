"use server";

import { createEmployeeAvailabilityRule } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import type { CreateEmployeeAvailabilityRuleInput } from "@/schemas/ops";

export const createEmployeeAvailabilityRuleAction = async (
  values: CreateEmployeeAvailabilityRuleInput
) => {
  try {
    const result = await createEmployeeAvailabilityRule(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.rule);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al guardar la disponibilidad");
  }
};
