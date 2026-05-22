"use server";

import { getOpsCostSettings } from "@/data/ops";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import ValidationError from "@/instances/validation-error";

export const getOpsCostSettingsAction = async () => {
  try {
    const result = await getOpsCostSettings();

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.settings);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al obtener configuracion de costes");
  }
};
