"use server";

import { getJobOccurrences } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import type { JobOccurrenceFilters } from "@/schemas/ops";

export const getJobOccurrencesAction = async (filters?: JobOccurrenceFilters) => {
  try {
    const result = await getJobOccurrences(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.occurrences);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener las ocurrencias");
  }
};
