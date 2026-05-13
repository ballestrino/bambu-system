"use server";

import { createEmployeePayment } from "@/actions/ops";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import ValidationError from "@/instances/validation-error";
import type { CreateEmployeePaymentInput } from "@/schemas/ops";

export const createEmployeePaymentAction = async (
  values: CreateEmployeePaymentInput
) => {
  try {
    const result = await createEmployeePayment(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.employeePayment);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al crear el pago");
  }
};
