"use server";

import { voidJobClientPayment } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";

export const voidJobClientPaymentAction = async (paymentId: string) => {
  try {
    const result = await voidJobClientPayment(paymentId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.clientPayment);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al anular el cobro");
  }
};
