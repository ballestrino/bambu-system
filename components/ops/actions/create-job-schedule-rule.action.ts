"use server";

import { createJobScheduleRule } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import type { CreateJobScheduleRuleInput } from "@/schemas/ops";

export const createJobScheduleRuleAction = async (
  values: CreateJobScheduleRuleInput
) => {
  try {
    const result = await createJobScheduleRule(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.scheduleRule;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al crear la regla");
  }
};
