"use server";

import { updateOpsCostSettings } from "@/actions/ops";
import { serializeActionResult } from "@/components/ops/actions/serialize-action-result";
import ValidationError from "@/instances/validation-error";
import type { OpsCostSettingsInput } from "@/schemas/ops";

export const updateOpsCostSettingsAction = async (
  values: OpsCostSettingsInput
) => {
  try {
    const result = await updateOpsCostSettings(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.settings);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new Error("Error al actualizar configuracion");
  }
};
