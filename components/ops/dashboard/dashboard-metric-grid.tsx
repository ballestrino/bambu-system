import {
  CalendarClock,
  CalendarDays,
  HandCoins,
  ReceiptText,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { DashboardSectionError } from "@/components/ops/dashboard/dashboard-section-error";
import { formatDashboardMoney } from "@/components/ops/dashboard/dashboard-financials";
import { OpsMetricCard, OpsSection } from "@/components/ops/shared";

const loadingValue = "…";

type DashboardFinancials = {
  estimatedBpsTotal: number;
  marginPercent: number;
  projectedProfit: number;
  projectedRevenue: number;
  realBpsTotal: number;
  realProfit: number;
  recordedRevenue: number;
  totalCosts: number;
};

export const DashboardMetricGrid = ({
  activeEmployeeCount,
  areFinancialsLoading,
  areOperationsLoading,
  financialError,
  financials,
  monthlyVisitCount,
  onRetryFinancials,
  onRetryOperations,
  operationsError,
  pendingVisitCount,
}: {
  activeEmployeeCount: number;
  areFinancialsLoading: boolean;
  areOperationsLoading: boolean;
  financialError: unknown;
  financials: DashboardFinancials;
  monthlyVisitCount: number;
  onRetryFinancials: () => Promise<unknown> | void;
  onRetryOperations: () => Promise<unknown> | void;
  operationsError: unknown;
  pendingVisitCount: number;
}) => (
  <div className="grid gap-4 xl:grid-cols-2">
    <OpsSection
      description="Carga de trabajo y capacidad del mes seleccionado."
      title="Resumen operativo"
    >
      {operationsError ? (
        <DashboardSectionError
          description="No mostramos ceros porque faltan datos de visitas o personal."
          onRetry={onRetryOperations}
          title="No pudimos cargar el resumen operativo"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <OpsMetricCard
            helper="Vencidas o de hoy"
            icon={CalendarClock}
            label="Pendientes"
            size="compact"
            tone="warning"
            value={areOperationsLoading ? loadingValue : pendingVisitCount}
          />
          <OpsMetricCard
            helper="Programadas este mes"
            icon={CalendarDays}
            label="Visitas"
            size="compact"
            value={areOperationsLoading ? loadingValue : monthlyVisitCount}
          />
          <OpsMetricCard
            helper="Disponibles y activos"
            icon={UsersRound}
            label="Empleados"
            size="compact"
            tone="active"
            value={areOperationsLoading ? loadingValue : activeEmployeeCount}
          />
        </div>
      )}
    </OpsSection>

    <OpsSection
      description="Importes registrados y proyección del mes seleccionado."
      title="Resumen financiero"
    >
      {financialError ? (
        <DashboardSectionError
          description="Los importes quedan ocultos hasta recuperar las consultas necesarias."
          onRetry={onRetryFinancials}
          title="No pudimos calcular el resumen financiero"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <OpsMetricCard
            helper={
              areFinancialsLoading
                ? "Calculando proyección"
                : `Proyectado: ${formatDashboardMoney(financials.projectedRevenue)}`
            }
            icon={ReceiptText}
            label="Cobrado"
            size="compact"
            value={areFinancialsLoading ? loadingValue : formatDashboardMoney(financials.recordedRevenue)}
          />
          <OpsMetricCard
            helper={
              areFinancialsLoading
                ? "Calculando BPS"
                : `BPS: ${formatDashboardMoney(financials.realBpsTotal)} · est. ${formatDashboardMoney(financials.estimatedBpsTotal)}`
            }
            icon={HandCoins}
            label="Costes"
            size="compact"
            tone="warning"
            value={areFinancialsLoading ? loadingValue : formatDashboardMoney(financials.totalCosts)}
          />
          <OpsMetricCard
            helper={
              areFinancialsLoading
                ? "Calculando resultado"
                : `Proyectado: ${formatDashboardMoney(financials.projectedProfit)} · margen ${financials.marginPercent.toFixed(1)}%`
            }
            icon={TrendingUp}
            label="Resultado"
            size="compact"
            tone={financials.realProfit >= 0 ? "success" : "danger"}
            value={areFinancialsLoading ? loadingValue : formatDashboardMoney(financials.realProfit)}
          />
        </div>
      )}
    </OpsSection>
  </div>
);
