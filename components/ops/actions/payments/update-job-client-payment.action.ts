"use server";

import { updateJobClientPayment } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import type { UpdateJobClientPaymentInput } from "@/schemas/ops";

export const updateJobClientPaymentAction = async (
  paymentId: string,
  values: UpdateJobClientPaymentInput
) => {
  try {
    const result = await updateJobClientPayment(paymentId, values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.clientPayment);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al actualizar el cobro");
  }
};

