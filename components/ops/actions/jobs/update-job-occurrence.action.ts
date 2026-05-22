"use server";

import { updateJobOccurrence } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import type { UpdateJobOccurrenceInput } from "@/schemas/ops";

export const updateJobOccurrenceAction = async (
  occurrenceId: string,
  values: UpdateJobOccurrenceInput
) => {
  try {
    const result = await updateJobOccurrence(occurrenceId, values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.occurrence);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al actualizar la ocurrencia");
  }
};

