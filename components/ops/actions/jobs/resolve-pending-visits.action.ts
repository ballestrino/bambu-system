"use server";

import { resolvePendingVisits } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import type { ResolvePendingVisitsInput } from "@/schemas/ops";

export const resolvePendingVisitsAction = async (values: ResolvePendingVisitsInput) => {
  try {
    const result = await resolvePendingVisits(values);

    if ("error" in result && result.error) {
      throw new ValidationError(result.error);
    }

    return { count: result.count ?? 0, success: result.success ?? "Visitas actualizadas" };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al resolver las visitas pendientes");
  }
};
