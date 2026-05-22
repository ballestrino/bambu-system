"use server";

import { updateJobScheduleRule } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import type { UpdateJobScheduleRuleInput } from "@/schemas/ops";

export const updateJobScheduleRuleAction = async (
  scheduleRuleId: string,
  values: UpdateJobScheduleRuleInput
) => {
  try {
    const result = await updateJobScheduleRule(scheduleRuleId, values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.scheduleRule);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al actualizar la regla");
  }
};

