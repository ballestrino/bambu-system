"use server";

import { createJobOccurrence } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import type { CreateJobOccurrenceInput } from "@/schemas/ops";

export const createJobOccurrenceAction = async (
  values: CreateJobOccurrenceInput
) => {
  try {
    const result = await createJobOccurrence(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.occurrence);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al crear la ocurrencia");
  }
};
