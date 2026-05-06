"use server";

import { getEmployeeById } from "@/data/ops";
import ValidationError from "@/instances/validation-error";

export const getEmployeeAction = async (employeeId: string) => {
  try {
    const result = await getEmployeeById(employeeId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.employee;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener la empleada");
  }
};
