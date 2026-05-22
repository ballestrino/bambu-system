"use server";

import { archiveJobEmployeeAssignment } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";

export const archiveJobEmployeeAssignmentAction = async (
  assignmentId: string
) => {
  try {
    const result = await archiveJobEmployeeAssignment(assignmentId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.assignment);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al desasignar la empleada");
  }
};

