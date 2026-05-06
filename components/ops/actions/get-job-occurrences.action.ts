"use server";

import { getJobOccurrences } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import type { JobOccurrenceFilters } from "@/schemas/ops";

export const getJobOccurrencesAction = async (filters?: JobOccurrenceFilters) => {
  try {
    const result = await getJobOccurrences(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.occurrences;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener las ocurrencias");
  }
};
