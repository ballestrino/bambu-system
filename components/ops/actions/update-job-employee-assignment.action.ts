"use server";

import { updateJobEmployeeAssignment } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import type { UpdateJobEmployeeAssignmentInput } from "@/schemas/ops";

export const updateJobEmployeeAssignmentAction = async (
  assignmentId: string,
  values: UpdateJobEmployeeAssignmentInput
) => {
  try {
    const result = await updateJobEmployeeAssignment(assignmentId, values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.assignment);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al actualizar la asignacion");
  }
};
