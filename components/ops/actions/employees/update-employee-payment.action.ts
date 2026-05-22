"use server";

import { updateEmployeePayment } from "@/actions/ops";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import ValidationError from "@/instances/validation-error";
import type { UpdateEmployeePaymentInput } from "@/schemas/ops";

export const updateEmployeePaymentAction = async (
  paymentId: string,
  values: UpdateEmployeePaymentInput
) => {
  try {
    const result = await updateEmployeePayment(paymentId, values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.employeePayment);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al actualizar el pago");
  }
};

