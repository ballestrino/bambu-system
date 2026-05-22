"use server";

import { getJobEmployeeAssignments } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import type { JobEmployeeAssignmentFilters } from "@/schemas/ops";

export const getJobEmployeeAssignmentsAction = async (
  filters?: JobEmployeeAssignmentFilters
) => {
  try {
    const result = await getJobEmployeeAssignments(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.assignments);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener las asignaciones");
  }
};

