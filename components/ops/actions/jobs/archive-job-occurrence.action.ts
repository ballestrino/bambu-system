"use server";

import { archiveJobOccurrence } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";

export const archiveJobOccurrenceAction = async (occurrenceId: string) => {
  try {
    const result = await archiveJobOccurrence(occurrenceId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.occurrence);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al archivar la ocurrencia");
  }
};

