"use server";

import { getVisitFilterOptions } from "@/data/ops/visit-feed";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import type { VisitFilterOptions } from "@/components/ops/types";

export const getVisitFilterOptionsAction = async (): Promise<VisitFilterOptions> => {
  const result = await getVisitFilterOptions();
  if (result.error || !result.options) {
    throw new ValidationError(result.error ?? "No se pudieron cargar los filtros");
  }

  return serializeActionResult(result.options) as VisitFilterOptions;
};
