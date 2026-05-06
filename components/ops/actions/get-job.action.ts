"use server";

import { getJobById } from "@/data/ops";
import ValidationError from "@/instances/validation-error";

export const getJobAction = async (jobId: string) => {
  try {
    const result = await getJobById(jobId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.job;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener el trabajo");
  }
};
