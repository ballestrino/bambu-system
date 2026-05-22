"use server";

import { voidEmployeePayment } from "@/actions/ops";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import ValidationError from "@/instances/validation-error";

export const voidEmployeePaymentAction = async (paymentId: string) => {
  try {
    const result = await voidEmployeePayment(paymentId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.employeePayment);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al anular el pago");
  }
};

