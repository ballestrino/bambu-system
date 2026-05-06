"use server";

import { archiveJobScheduleRule } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";

export const archiveJobScheduleRuleAction = async (scheduleRuleId: string) => {
  try {
    const result = await archiveJobScheduleRule(scheduleRuleId);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.scheduleRule;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al archivar la regla");
  }
};
