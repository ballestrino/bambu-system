"use client";

import { DashboardSectionError } from "@/components/ops/dashboard/dashboard-section-error";
import { PendingVisitsPanel } from "@/components/ops/jobs/pending-visits-panel";
import { getPendingRegistrationVisits } from "@/components/ops/jobs/pending-visits-utils";
import type { OpsOccurrence, OpsScheduleRule } from "@/components/ops/types";

export const DashboardVisitsPanel = ({
  error,
  isLoading,
  onRetry,
  occurrences,
  scheduleRules,
}: {
  error: unknown;
  isLoading: boolean;
  onRetry: () => Promise<unknown> | void;
  occurrences: OpsOccurrence[];
  scheduleRules: OpsScheduleRule[];
}) => {
  if (error) {
    return (
      <DashboardSectionError
        description="No mostramos una agenda vacía porque no pudimos confirmar las visitas."
        onRetry={onRetry}
        title="No pudimos cargar las tareas del día"
      />
    );
  }

  const hasPendingVisits = getPendingRegistrationVisits(occurrences).length > 0;
  const showTomorrow = !isLoading && !hasPendingVisits;

  return (
    <PendingVisitsPanel
      countLabel={showTomorrow ? "visita(s)" : "pendiente(s)"}
      defaultOpen
      description={
        showTomorrow
          ? "No hay pendientes vencidas ni de hoy. Estas son las visitas agendadas para mañana."
          : "Visitas vencidas o de hoy que todavía necesitan horario real completo."
      }
      emptyMessage={
        showTomorrow
          ? "No hay visitas pendientes ni visitas agendadas para mañana."
          : "No hay visitas pendientes de registro."
      }
      isLoading={isLoading}
      mode={showTomorrow ? "tomorrow" : "pending"}
      occurrences={occurrences}
      scheduleRules={scheduleRules}
      showJobLink
      title={showTomorrow ? "Visitas de mañana" : "Visitas pendientes de registro"}
    />
  );
};
