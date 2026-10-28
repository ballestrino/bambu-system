"use server";

import { setEmployeesActive } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";

export const setEmployeesActiveAction = async (
  employeeIds: string[],
  isActive: boolean
) => {
  try {
    const result = await setEmployeesActive(employeeIds, isActive);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.employees ?? []);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al actualizar las empleadas");
  }
};
