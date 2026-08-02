"use server";

import {
  getVisitFilterOptions,
  getVisitWeek,
} from "@/data/ops/visit-feed";
import ValidationError from "@/instances/validation-error";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import type {
  VisitFilterOptions,
  VisitWeekPage,
} from "@/components/ops/types";
import type { VisitFeedFilters } from "@/schemas/ops";

export const getVisitWeekAction = async (
  filters: VisitFeedFilters
): Promise<VisitWeekPage> => {
  const result = await getVisitWeek(filters);
  if (result.error || !result.page) {
    throw new ValidationError(result.error ?? "No se pudo cargar la semana");
  }

  return serializeActionResult(result.page) as unknown as VisitWeekPage;
};

export const getVisitFilterOptionsAction = async (): Promise<VisitFilterOptions> => {
  const result = await getVisitFilterOptions();
  if (result.error || !result.options) {
    throw new ValidationError(result.error ?? "No se pudieron cargar los filtros");
  }

  return serializeActionResult(result.options) as VisitFilterOptions;
};
