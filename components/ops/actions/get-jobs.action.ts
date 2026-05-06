"use server";

import { getJobs } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import type { JobFilters } from "@/schemas/ops";

export const getJobsAction = async (filters?: JobFilters) => {
  try {
    const result = await getJobs(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.jobs;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener los trabajos");
  }
};
