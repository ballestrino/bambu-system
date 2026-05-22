import type { Job } from "@prisma/client";

import type { UpdateJobInput } from "@/schemas/ops";
import { getPatchedValue, hasOwnKey } from "@/lib/ops/patch";

export const resolveJobUpdatePatch = (
  existingJob: Job,
  patch: UpdateJobInput
) => {
  const nextJobType = getPatchedValue(patch, "jobType", existingJob.jobType);
  const nextPunctualStartDate = getPatchedValue(
    patch,
    "punctualStartDate",
    existingJob.punctualStartDate ?? null
  );
  const nextPunctualEndDate = getPatchedValue(
    patch,
    "punctualEndDate",
    existingJob.punctualEndDate ?? null
  );
  const nextSourceBudgetId = hasOwnKey(patch, "sourceBudgetId")
    ? patch.sourceBudgetId
    : existingJob.sourceBudgetId;
  const nextSourceBudgetOptionId =
    nextSourceBudgetId === null
      ? null
      : hasOwnKey(patch, "sourceBudgetOptionId")
        ? patch.sourceBudgetOptionId
        : existingJob.sourceBudgetOptionId;

  if (nextJobType === "PUNCTUAL" && !nextPunctualStartDate) {
    return { error: "La fecha inicial del puntual es obligatoria" };
  }

  if (nextJobType === "PUNCTUAL" && !nextPunctualEndDate) {
    return { error: "La fecha final del puntual es obligatoria" };
  }

  if (
    nextPunctualStartDate &&
    nextPunctualEndDate &&
    nextPunctualEndDate.getTime() < nextPunctualStartDate.getTime()
  ) {
    return { error: "La fecha final debe ser mayor o igual a la inicial" };
  }

  if (nextSourceBudgetOptionId && !nextSourceBudgetId) {
    return { error: "No puedes asociar una opcion sin seleccionar un presupuesto" };
  }

  return {
    nextDescription: getPatchedValue(
      patch,
      "description",
      existingJob.description ?? null
    ),
    nextJobType,
    nextOperationalNotes: getPatchedValue(
      patch,
      "operationalNotes",
      existingJob.operationalNotes ?? null
    ),
    nextPunctualEndDate,
    nextPunctualStartDate,
    nextServiceAddress: getPatchedValue(
      patch,
      "serviceAddress",
      existingJob.serviceAddress ?? null
    ),
    nextServiceLocation: getPatchedValue(
      patch,
      "serviceLocation",
      existingJob.serviceLocation ?? null
    ),
    nextSourceBudgetId,
    nextSourceBudgetOptionId,
    sourceChanged:
      nextSourceBudgetId !== existingJob.sourceBudgetId ||
      nextSourceBudgetOptionId !== existingJob.sourceBudgetOptionId,
  };
};
