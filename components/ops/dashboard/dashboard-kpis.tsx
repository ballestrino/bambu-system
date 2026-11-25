"use client";

import { CalendarDays, CalendarRange, CircleDollarSign, TrendingUp } from "lucide-react";

import { getHomeVisitState } from "@/lib/ops/home-week";
import { plural } from "@/lib/ops/visit-day";
import { DashboardSectionError } from "@/components/ops/dashboard/dashboard-section-error";
import { formatDashboardMoney } from "@/components/ops/dashboard/dashboard-financials";
import type { OpsDashboard } from "@/components/ops/dashboard/use-ops-dashboard";
import { OpsMetricCard } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";

const loadingValue = "…";

const monthName = (month: Date) =>
  new Intl.DateTimeFormat("es-UY", { month: "long" }).format(month).toLowerCase();

const joinParts = (parts: (string | null)[], fallback: string) => {
  const present = parts.filter(Boolean);
  return present.length ? present.join(" · ") : fallback;
};

// Hoy y la semana a la izquierda (siempre la fecha actual); cobrado y
// resultado del mes elegido en el selector, como en Finanzas.
export const DashboardKpis = ({
  dashboard,
  nowMinute,
  todayVisits,
}: {
  dashboard: OpsDashboard;
  nowMinute: number | null;
  todayVisits: OpsOccurrence[];
}) => {
  const { financials, todayKey, weekSummary } = dashboard;
  const weekLoading = dashboard.isWeekLoading;
  const moneyLoading = dashboard.isFinancialsLoading;
  const states = todayKey ? todayVisits.map((visit) => getHomeVisitState(visit, { nowMinute, todayKey })) : [];
  const ended = states.filter((state) => state === "ended").length;
  const unassigned = states.filter((state) => state === "unassigned").length;
  const collected = financials.projectedRevenue
    ? Math.min(100, Math.round((financials.recordedRevenue / financials.projectedRevenue) * 100))
    : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <OpsMetricCard
        helper={weekLoading ? "Cargando el día" : joinParts([
          ended ? `${ended} sin registrar` : null,
          unassigned ? `${unassigned} sin equipo` : null,
        ], todayVisits.length ? "Nada pendiente" : "Sin visitas hoy")}
        icon={CalendarDays}
        label="Visitas hoy"
        tone="active"
        value={weekLoading ? loadingValue : todayVisits.length}
      />
      <OpsMetricCard
        helper={weekLoading ? "Cargando la semana" : joinParts([
          weekSummary.unassigned.length ? `${weekSummary.unassigned.length} sin asignar` : null,
          weekSummary.overlaps ? plural(weekSummary.overlaps, "cruce de horario", "cruces de horario") : null,
        ], "Todas asignadas, sin cruces")}
        icon={CalendarRange}
        label="Esta semana"
        value={weekLoading ? loadingValue : weekSummary.total}
      />
      {dashboard.financialError ? (
        <DashboardSectionError
          className="sm:col-span-2"
          description="Los importes quedan ocultos hasta recuperar las consultas."
          onRetry={dashboard.refreshFinancials}
          title="No pudimos calcular el mes"
        />
      ) : (
        <>
          <OpsMetricCard
            helper={moneyLoading ? "Calculando" : (
              <span className="flex flex-col gap-1.5">
                <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-ops-surface">
                  <span className="block h-full rounded-full bg-ops-bamboo" style={{ width: `${collected}%` }} />
                </span>
                {`${collected} % de ${formatDashboardMoney(financials.projectedRevenue)} proyectado`}
              </span>
            )}
            icon={CircleDollarSign}
            label={`Cobrado en ${monthName(dashboard.month)}`}
            tone="money"
            value={moneyLoading ? loadingValue : formatDashboardMoney(financials.recordedRevenue)}
          />
          <OpsMetricCard
            helper={moneyLoading ? "Calculando" : `Margen ${financials.marginPercent.toFixed(1)} % · proyectado ${formatDashboardMoney(financials.projectedProfit)}`}
            icon={TrendingUp}
            label="Resultado del mes"
            tone={financials.realProfit >= 0 ? "success" : "danger"}
            value={moneyLoading ? loadingValue : formatDashboardMoney(financials.realProfit)}
          />
        </>
      )}
    </div>
  );
};
