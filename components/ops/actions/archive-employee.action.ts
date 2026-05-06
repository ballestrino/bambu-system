"use server";

import { archiveEmployee } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";

export const archiveEmployeeAction = async (employeeId: string) => {
  try {
    const result = await archiveEmployee(employeeId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.employee;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al archivar la empleada");
  }
};
