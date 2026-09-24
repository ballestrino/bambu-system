"use server";

import {
  generateJobOccurrences,
  previewJobOccurrenceGeneration,
} from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import type { OccurrenceGenerationInput } from "@/schemas/ops";

export const previewJobOccurrenceGenerationAction = async (
  input: OccurrenceGenerationInput
) => {
  try {
    const result = await previewJobOccurrenceGeneration(input);

    if (result.error || !result.preview) {
      throw new ValidationError(result.error ?? "No se pudo calcular qué visitas faltan");
    }

    return serializeActionResult(result.preview);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("No se pudo calcular qué visitas faltan");
  }
};

export const generateJobOccurrencesAction = async (input: OccurrenceGenerationInput) => {
  try {
    const result = await generateJobOccurrences(input);

    if (result.error || !result.result) {
      throw new ValidationError(result.error ?? "No se pudieron generar las visitas");
    }

    return serializeActionResult(result.result);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("No se pudieron generar las visitas");
  }
};
