"use server";

import { detachJobOccurrence } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import type { DetachJobOccurrenceInput } from "@/schemas/ops";

export const detachJobOccurrenceAction = async (
  occurrenceId: string,
  values?: DetachJobOccurrenceInput
) => {
  try {
    const result = await detachJobOccurrence(occurrenceId, values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.occurrence);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al separar la ocurrencia");
  }
};
