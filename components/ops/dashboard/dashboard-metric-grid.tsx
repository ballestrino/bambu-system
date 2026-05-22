import {
  BadgeDollarSign,
  CalendarDays,
  CalendarClock,
  HandCoins,
  Percent,
  ReceiptText,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { formatDashboardMoney } from "@/components/ops/dashboard/dashboard-financials";
import { OpsMetricsGrid } from "@/components/ops/shared";

const loadingValue = "...";

export const DashboardMetricGrid = ({
  activeEmployeeCount,
  areEmployeesLoading,
  areFinancialsLoading,
  areMonthlyVisitsLoading,
  areVisitsLoading,
  financials,
  monthlyVisitCount,
  pendingVisitCount,
}: {
  activeEmployeeCount: number;
  areEmployeesLoading: boolean;
  areFinancialsLoading: boolean;
  areMonthlyVisitsLoading: boolean;
  areVisitsLoading: boolean;
  financials: {
    estimatedBpsTotal: number;
    marginPercent: number;
    projectedProfit: number;
    projectedRevenue: number;
    realBpsTotal: number;
    realProfit: number;
    recordedRevenue: number;
    totalCosts: number;
  };
  monthlyVisitCount: number;
  pendingVisitCount: number;
}) => (
  <OpsMetricsGrid
    metrics={[
      {
        helper: "Vencidas o de hoy sin horario real completo",
        icon: CalendarClock,
        label: "Visitas pendientes",
        tone: "warning",
        value: areVisitsLoading ? loadingValue : pendingVisitCount,
      },
      {
        helper: "Activos y no archivados",
        icon: UsersRound,
        label: "Empleados activos",
        tone: "active",
        value: areEmployeesLoading ? loadingValue : activeEmployeeCount,
      },
      {
        helper: "Programadas dentro del mes actual",
        icon: CalendarDays,
        label: "Visitas del mes",
        tone: "neutral",
        value: areMonthlyVisitsLoading ? loadingValue : monthlyVisitCount,
      },
      {
        helper: areFinancialsLoading ? "Calculando ganancia real" : (
          <span className="flex flex-col gap-1">
            <span>
              Proyectada: {formatDashboardMoney(financials.projectedProfit)}
            </span>
            <span>
              Costes: {formatDashboardMoney(financials.totalCosts)}
            </span>
          </span>
        ),
        icon: TrendingUp,
        label: "Ganancias",
        tone: financials.realProfit >= 0 ? "money" : "danger",
        value: areFinancialsLoading
          ? loadingValue
          : formatDashboardMoney(financials.realProfit),
      },
      {
        helper: "Empleadas + costes registrados",
        icon: HandCoins,
        label: "Costes",
        tone: "warning",
        value: areFinancialsLoading
          ? loadingValue
          : formatDashboardMoney(financials.totalCosts),
      },
      {
        helper: areFinancialsLoading ? "Calculando facturación" : (
          <span className="flex flex-col gap-1">
            <span>
              Proyectado: {formatDashboardMoney(financials.projectedRevenue)}
            </span>
            <span>
              Recaudado: {formatDashboardMoney(financials.recordedRevenue)}
            </span>
          </span>
        ),
        icon: ReceiptText,
        label: "Facturación total",
        tone: "neutral",
        value: areFinancialsLoading
          ? loadingValue
          : formatDashboardMoney(financials.recordedRevenue),
      },
      {
        helper: areFinancialsLoading ? "Calculando BPS" : (
          <span className="flex flex-col gap-1">
            <span>
              Estimado: {formatDashboardMoney(financials.estimatedBpsTotal)}
            </span>
          </span>
        ),
        icon: BadgeDollarSign,
        label: "BPS",
        tone: "active",
        value: areFinancialsLoading
          ? loadingValue
          : formatDashboardMoney(financials.realBpsTotal),
      },
      {
        helper: "Ganancia real sobre cobrado",
        icon: Percent,
        label: "Margen",
        tone: financials.marginPercent >= 0 ? "success" : "danger",
        value: areFinancialsLoading
          ? loadingValue
          : `${financials.marginPercent.toFixed(1)}%`,
      },
    ]}
  />
);
