"use server";

import { archiveJob } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";

export const archiveJobAction = async (jobId: string) => {
  try {
    const result = await archiveJob(jobId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.job;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al archivar el trabajo");
  }
};
