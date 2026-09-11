"use server";

import { getEmployeeAvailabilityRules } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import type { EmployeeAvailabilityFilters } from "@/schemas/ops";

export const getEmployeeAvailabilityRulesAction = async (
  filters?: EmployeeAvailabilityFilters
) => {
  try {
    const result = await getEmployeeAvailabilityRules(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.rules);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener la disponibilidad");
  }
};
