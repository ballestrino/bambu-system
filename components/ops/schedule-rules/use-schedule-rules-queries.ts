"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getScheduleRuleVisitsAction,
  getScheduleRulesBoardAction,
} from "@/components/ops/actions/schedule-rules/schedule-rule-board.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { StripVisit } from "@/components/ops/schedule-rules/rule-week-strip-model";
import type { BoardJob } from "@/components/ops/schedule-rules/schedule-rules-model";

// La tabla de reglas va bajo las reglas y las visitas de una regla bajo las
// visitas: así las invalidan los cambios de trabajos y de visitas de toda la app.
export const scheduleRulesBoardKey = [...opsQueryKeys.scheduleRuleRoot, "board"] as const;
export const ruleVisitsKey = (ruleId: string) => [...opsQueryKeys.occurrenceRoot, "rule", ruleId] as const;

export const orThrow = <T extends { error?: string }>(result: T) => {
  if (result.error) throw new Error(result.error);
  return result;
};

export const useScheduleRulesBoard = () => {
  const query = useQuery({
    queryKey: scheduleRulesBoardKey,
    queryFn: async () => (orThrow(await getScheduleRulesBoardAction()).jobs ?? []) as BoardJob[],
    staleTime: 60_000,
  });
  return { error: query.error, isLoading: query.isLoading, jobs: query.data ?? [], refetch: query.refetch };
};

export const useRuleVisits = (ruleId: string | null) => {
  const query = useQuery({
    enabled: Boolean(ruleId),
    queryKey: ruleVisitsKey(ruleId ?? "none"),
    queryFn: async () =>
      (orThrow(await getScheduleRuleVisitsAction({ scheduleRuleId: ruleId ?? "" })).visits ?? []) as StripVisit[],
    staleTime: 30_000,
  });
  return { error: query.error, isLoading: query.isLoading, visits: query.data ?? [] };
};
