"use client";

import { useMemo, useState } from "react";

import { DEFAULT_OPS_TIMEZONE, getLocalDateTime } from "@/lib/ops/timezone";
import { formatDayLabel } from "@/lib/ops/visit-calendar";
import { getVisitsOfDay } from "@/lib/ops/visit-day";
import type { DashboardVisitIntent } from "@/components/ops/dashboard/dashboard-agenda-row";
import { DashboardAttentionPanel } from "@/components/ops/dashboard/dashboard-attention-panel";
import { DashboardKpis } from "@/components/ops/dashboard/dashboard-kpis";
import { DashboardPendingAlert } from "@/components/ops/dashboard/dashboard-pending-alert";
import { DashboardQuickActions } from "@/components/ops/dashboard/dashboard-quick-actions";
import { DashboardTeamToday } from "@/components/ops/dashboard/dashboard-team-today";
import { DashboardTodayAgenda } from "@/components/ops/dashboard/dashboard-today-agenda";
import { useOpsDashboard } from "@/components/ops/dashboard/use-ops-dashboard";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { OpsPageHeader, OpsPageShell } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { useNow } from "@/components/ops/visits/hooks/use-now";

// Inicio (diseño "Inicio Bambú — rediseño", feature 70): un aviso con las
// pendientes de registro en lugar de su lista, los numeros del dia y del mes,
// la agenda de la semana y lo que requiere atencion.
export const OpsDashboardPage = () => {
  const dashboard = useOpsDashboard();
  const now = useNow();
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ intent: DashboardVisitIntent; visit: OpsOccurrence } | null>(null);
  const { todayKey } = dashboard;
  const dayKey = pickedDay ?? todayKey;
  const local = now ? getLocalDateTime(now, DEFAULT_OPS_TIMEZONE) : null;
  const nowMinute = local ? local.hour * 60 + local.minute : null;

  const dayVisits = useMemo(
    () => (dayKey ? getVisitsOfDay(dashboard.week.occurrences, dayKey) : []),
    [dashboard.week.occurrences, dayKey]
  );
  const todayVisits = useMemo(
    () => (todayKey ? getVisitsOfDay(dashboard.week.occurrences, todayKey) : []),
    [dashboard.week.occurrences, todayKey]
  );

  return (
    <OpsPageShell>
      <OpsPageHeader
        actions={<DashboardQuickActions isRefreshing={dashboard.isRefreshing} onRefresh={dashboard.refreshDashboard} />}
        description={todayKey ? formatDayLabel(todayKey) : " "}
        eyebrow="Operaciones"
        title="Hoy en Bambú"
      />

      <DashboardPendingAlert pending={dashboard.pending} />
      <DashboardKpis dashboard={dashboard} nowMinute={nowMinute} todayVisits={todayVisits} />

      {/* minmax(0,…): la tira de la semana no debe empujar la columna. */}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <DashboardTodayAgenda
          dayKey={dayKey}
          error={dashboard.weekError}
          isLoading={dashboard.isWeekLoading}
          nowMinute={nowMinute}
          onAction={(visit, intent) => setDialog({ intent, visit })}
          onPickDay={setPickedDay}
          onRetry={dashboard.refreshWeek}
          todayKey={todayKey}
          tomorrowCount={dashboard.pending.tomorrow.filter((visit) => visit.status === "SCHEDULED").length}
          totals={dashboard.weekTotals}
          visits={dayVisits}
        />
        <div className="grid content-start gap-4">
          <DashboardAttentionPanel
            isLoading={dashboard.isWeekLoading || dashboard.profitability.isLoading}
            profitability={dashboard.profitability.profitability}
            profitabilityError={dashboard.profitability.error}
            week={dashboard.weekSummary}
          />
          <DashboardTeamToday
            employeeCount={dashboard.employees.employees.length}
            isLoading={dashboard.isWeekLoading}
            week={dashboard.weekSummary}
          />
        </div>
      </div>

      {dialog ? (
        <JobOccurrenceDialog
          intent={dialog.intent}
          key={`${dialog.visit.id}-${dialog.intent}`}
          occurrence={dialog.visit}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          open
        />
      ) : null}
    </OpsPageShell>
  );
};
