"use server";

import { updateJob } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import type { UpdateJobInput } from "@/schemas/ops";

export const updateJobAction = async (
  jobId: string,
  values: UpdateJobInput
) => {
  try {
    const result = await updateJob(jobId, values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.job;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al actualizar el trabajo");
  }
};
