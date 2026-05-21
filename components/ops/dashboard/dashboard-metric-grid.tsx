import {
  CalendarClock,
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
  areVisitsLoading,
  financials,
  pendingVisitCount,
}: {
  activeEmployeeCount: number;
  areEmployeesLoading: boolean;
  areFinancialsLoading: boolean;
  areVisitsLoading: boolean;
  financials: {
    projectedProfit: number;
    projectedRevenue: number;
    recordedRevenue: number;
  };
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
        helper: "Proyectada desde presupuestos asociados",
        icon: TrendingUp,
        label: "Ganancias",
        tone: "money",
        value: areFinancialsLoading
          ? loadingValue
          : formatDashboardMoney(financials.projectedProfit),
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
          : formatDashboardMoney(financials.projectedRevenue),
      },
    ]}
  />
);
