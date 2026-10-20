"use client";

import type { OccurrenceStatus } from "@prisma/client";

import { getDayKeyInstant } from "@/lib/ops/visit-calendar";
import { getVisitDayKey } from "@/lib/ops/visit-day";
import { useJobOccurrenceMutations } from "@/components/ops/hooks/useJobOccurrenceMutations";
import type { OpsOccurrence } from "@/components/ops/types";

export type VisitRegistration = {
  endMinute: number;
  notes: string;
  startMinute: number;
  status: Extract<OccurrenceStatus, "CANCELED" | "DONE" | "SKIPPED">;
};

// Registrar y asignar desde la pantalla de Visitas. Las dos son una
// actualizacion parcial de la visita con la cache optimista de siempre.
export const useVisitActions = () => {
  const { isUpdating, updateOccurrenceAsync } = useJobOccurrenceMutations();

  const register = (visit: OpsOccurrence, registration: VisitRegistration) => {
    const dayKey = getVisitDayKey(visit.scheduledStartAt);
    const isDone = registration.status === "DONE";

    return updateOccurrenceAsync({
      occurrenceId: visit.id,
      successMessage: isDone ? "Visita completada" : "Visita registrada",
      values: {
        actualEndAt: isDone ? getDayKeyInstant(dayKey, registration.endMinute) : null,
        actualStartAt: isDone ? getDayKeyInstant(dayKey, registration.startMinute) : null,
        notes: registration.notes,
        status: registration.status,
      },
    });
  };

  const assign = (visit: OpsOccurrence, employee: { id: string; name: string }) =>
    updateOccurrenceAsync({
      occurrenceId: visit.id,
      successMessage: `Visita asignada a ${employee.name}`,
      values: { employeeIds: [employee.id] },
    });

  return { assign, isUpdating, register };
};
