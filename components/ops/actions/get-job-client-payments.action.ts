"use server";

import { getJobClientPayments } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import type { JobClientPaymentFilters } from "@/schemas/ops";

export const getJobClientPaymentsAction = async (
  filters?: JobClientPaymentFilters
) => {
  try {
    const result = await getJobClientPayments(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.clientPayments);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener los cobros");
  }
};
