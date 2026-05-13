"use server";

import { getEmployeePayments } from "@/data/ops";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import ValidationError from "@/instances/validation-error";
import type { EmployeePaymentFilters } from "@/schemas/ops";

export const getEmployeePaymentsAction = async (
  filters?: EmployeePaymentFilters
) => {
  try {
    const result = await getEmployeePayments(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.employeePayments);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener los pagos");
  }
};
