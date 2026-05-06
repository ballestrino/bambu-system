"use server";

import { updateEmployee } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import type { UpdateEmployeeInput } from "@/schemas/ops";

export const updateEmployeeAction = async (
  employeeId: string,
  values: UpdateEmployeeInput
) => {
  try {
    const result = await updateEmployee(employeeId, values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.employee;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al actualizar la empleada");
  }
};
