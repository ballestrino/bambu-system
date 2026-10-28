"use server";

import { archiveEmployees } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";

export const archiveEmployeesAction = async (employeeIds: string[]) => {
  try {
    const result = await archiveEmployees(employeeIds);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.employees ?? []);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al archivar las empleadas");
  }
};
