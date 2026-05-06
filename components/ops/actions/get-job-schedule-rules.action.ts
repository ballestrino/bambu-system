"use server";

import { getJobScheduleRules } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import type { JobScheduleRuleFilters } from "@/schemas/ops";

export const getJobScheduleRulesAction = async (
  filters?: JobScheduleRuleFilters
) => {
  try {
    const result = await getJobScheduleRules(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.scheduleRules;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener las reglas del calendario");
  }
};
