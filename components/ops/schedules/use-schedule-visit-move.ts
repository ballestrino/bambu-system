"use client";

import { buildScheduleMove, type ScheduleMoveTarget } from "@/lib/ops/schedule-move";
import { useJobOccurrenceMutations } from "@/components/ops/hooks/useJobOccurrenceMutations";
import { getOccurrenceEmployeeIds } from "@/components/ops/jobs/occurrence-employees";
import type { ScheduleDragPayload } from "@/components/ops/schedules/use-schedule-drag";
import type { OpsOccurrence } from "@/components/ops/types";

// Soltar la tarjeta escribe dia, hora y equipo en la misma actualizacion: la
// grilla no tiene un paso intermedio donde la visita quede a medio mover.
export const useScheduleVisitMove = (occurrences: OpsOccurrence[]) => {
  const { updateOccurrenceAsync } = useJobOccurrenceMutations();

  return (payload: ScheduleDragPayload, target: ScheduleMoveTarget) => {
    const occurrence = occurrences.find((current) => current.id === payload.visitId);
    if (!occurrence) {
      return;
    }

    const move = buildScheduleMove({
      currentEmployeeIds: getOccurrenceEmployeeIds(occurrence),
      occurrence,
      source: payload,
      target,
    });

    if (!move) {
      return;
    }

    void updateOccurrenceAsync({
      occurrenceId: occurrence.id,
      successMessage: move.employeeIds ? "Visita reasignada" : "Visita movida",
      values: move,
    }).catch(() => undefined);
  };
};
