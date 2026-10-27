import "server-only";

import { assertOccurrenceExists, assertOccurrenceRuleBelongsToJob } from "@/lib/ops/assertions";
import {
  assertOccurrenceEmployeesExist,
  getOccurrenceEmployeeIds,
  getPatchedEmployeeIds,
} from "@/lib/ops/job-occurrence-employees";
import { buildResolvedJobOccurrence, validateResolvedJobOccurrence } from "@/lib/ops/job-occurrence-patch";
import { UpdateJobOccurrenceSchema } from "@/schemas/ops";

// Valida un cambio parcial de una visita contra la guardada y devuelve lo que
// se escribe: lo usan cambiar una (updateJobOccurrence) y cambiar un lote
// (updateJobOccurrences). No escribe.
export const prepareOccurrenceUpdate = async (occurrenceId: string, values: unknown, updatedById: string) => {
  const existingOccurrence = await assertOccurrenceExists(occurrenceId);
  const parsedValues = UpdateJobOccurrenceSchema.safeParse(values);
  if (!parsedValues.success) {
    return { error: "Datos invalidos para actualizar la ocurrencia" } as const;
  }

  const existingEmployeeIds = await getOccurrenceEmployeeIds(occurrenceId);
  const employeeIds = getPatchedEmployeeIds({
    existingEmployeeIds,
    patch: parsedValues.data,
  });
  const mergedValues = buildResolvedJobOccurrence(existingOccurrence, parsedValues.data);
  const validatedValues = validateResolvedJobOccurrence(mergedValues);
  if (!validatedValues.success) {
    return { error: "La ocurrencia resultante es invalida" } as const;
  }

  await Promise.all([
    assertOccurrenceEmployeesExist(employeeIds),
    assertOccurrenceRuleBelongsToJob(mergedValues.scheduleRuleId ?? undefined, existingOccurrence.jobId),
  ]);

  return {
    occurrenceId,
    employeeIds,
    data: {
      scheduleRuleId: mergedValues.scheduleRuleId,
      scheduledStartAt: validatedValues.data.scheduledStartAt,
      scheduledEndAt: validatedValues.data.scheduledEndAt,
      actualStartAt: mergedValues.actualStartAt,
      actualEndAt: mergedValues.actualEndAt,
      status: validatedValues.data.status,
      isDetached: validatedValues.data.isDetached,
      notes: mergedValues.notes,
      scheduleLabel: mergedValues.scheduleLabel,
      updatedById,
    },
  };
};
