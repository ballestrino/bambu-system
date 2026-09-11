"use server";

import { deleteEmployeeAvailabilityRule } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";

export const deleteEmployeeAvailabilityRuleAction = async (ruleId: string) => {
  try {
    const result = await deleteEmployeeAvailabilityRule(ruleId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.rule);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al eliminar la disponibilidad");
  }
};
