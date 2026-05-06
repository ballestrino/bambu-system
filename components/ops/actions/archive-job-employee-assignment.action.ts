"use server";

import { archiveJobEmployeeAssignment } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";

export const archiveJobEmployeeAssignmentAction = async (
  assignmentId: string
) => {
  try {
    const result = await archiveJobEmployeeAssignment(assignmentId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.assignment;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al archivar la asignacion");
  }
};
