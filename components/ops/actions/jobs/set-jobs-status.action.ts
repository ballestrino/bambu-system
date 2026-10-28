"use server";

import { setJobsStatus } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import type { SetJobsStatusInput } from "@/schemas/ops";

export const setJobsStatusAction = async (values: SetJobsStatusInput) => {
  try {
    const result = await setJobsStatus(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.jobs ?? []);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al cambiar los trabajos");
  }
};
