import {
  CalendarClock,
  ReceiptText,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { OpsMetricsGrid } from "@/components/ops/shared";

const loadingValue = "...";

export const DashboardMetricGrid = ({
  activeEmployeeCount,
  areEmployeesLoading,
  areVisitsLoading,
  pendingVisitCount,
}: {
  activeEmployeeCount: number;
  areEmployeesLoading: boolean;
  areVisitsLoading: boolean;
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
        helper: "Pendiente de integrar pagos y cobros",
        icon: TrendingUp,
        label: "Ganancias",
        tone: "money",
        value: <span className="text-base">Próximamente</span>,
      },
      {
        helper: "Pendiente de integrar facturación real",
        icon: ReceiptText,
        label: "Facturación total",
        tone: "neutral",
        value: <span className="text-base">Próximamente</span>,
      },
    ]}
  />
);
