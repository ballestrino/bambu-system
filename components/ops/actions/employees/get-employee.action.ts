"use server";

import { getEmployeeById } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";

export const getEmployeeAction = async (employeeId: string) => {
  try {
    const result = await getEmployeeById(employeeId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.employee);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener la empleada");
  }
};

