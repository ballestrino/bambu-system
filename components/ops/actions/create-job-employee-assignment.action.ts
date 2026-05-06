"use server";

import { createJobEmployeeAssignment } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import type { CreateJobEmployeeAssignmentInput } from "@/schemas/ops";

export const createJobEmployeeAssignmentAction = async (
  values: CreateJobEmployeeAssignmentInput
) => {
  try {
    const result = await createJobEmployeeAssignment(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.assignment;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al crear la asignacion");
  }
};
