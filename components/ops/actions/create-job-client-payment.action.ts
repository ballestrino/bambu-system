"use server";

import { createJobClientPayment } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import type { CreateJobClientPaymentInput } from "@/schemas/ops";

export const createJobClientPaymentAction = async (
  values: CreateJobClientPaymentInput
) => {
  try {
    const result = await createJobClientPayment(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.clientPayment);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al crear el cobro");
  }
};
