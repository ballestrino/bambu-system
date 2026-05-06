"use server";

import { createJob } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import type { CreateJobInput } from "@/schemas/ops";

export const createJobAction = async (values: CreateJobInput) => {
  try {
    const result = await createJob(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.job;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al crear el trabajo");
  }
};
