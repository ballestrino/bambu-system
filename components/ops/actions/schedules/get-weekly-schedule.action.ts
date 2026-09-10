"use server";

import { getWeeklySchedule } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import type { WeeklyScheduleFilters } from "@/schemas/ops";

export const getWeeklyScheduleAction = async (filters?: WeeklyScheduleFilters) => {
  try {
    const result = await getWeeklySchedule(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return serializeActionResult(result.schedule);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener el cronograma semanal");
  }
};
