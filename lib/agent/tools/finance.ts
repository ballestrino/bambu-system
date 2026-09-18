import "server-only";

import { tool } from "ai";

import { getDashboardFinancials } from "@/components/ops/dashboard/dashboard-financials";
import { getEmployeePayments } from "@/data/ops/employee-payments";
import { getFinanceTrend } from "@/data/ops/finance-trend";
import { getJobClientPayments } from "@/data/ops/job-client-payments";
import { getJobs } from "@/data/ops/jobs";
import { getOperationalCosts, getOpsCostSettings } from "@/data/ops/operational-costs";
import { getJobProfitability } from "@/data/ops/profitability";
import { formatMonthLabel, getCurrentMonthKey, toAssignedMonth } from "@/lib/agent/month";
import { roundMoney, runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import {
  financialTrendInputSchema,
  jobProfitabilityInputSchema,
  monthInputSchema,
} from "@/schemas/agent-tools";

const roundPercent = (value: number) => Math.round(value * 10) / 10;

// Los mismos lectores y cuentas que Finanzas y el tablero, para que el agente
// dé exactamente los números de la pantalla.
export const createFinanceTools = () => ({
  getFinancialSnapshot: tool({
    description:
      "Resumen financiero de un mes, con las cuentas de Finanzas: cobrado, egresos (pagos a empleadas y costes), resultado, margen, BPS real y estimado, e ingreso y ganancia proyectados de los trabajos activos.",
    inputSchema: monthInputSchema,
    execute: (input) =>
      runTool("getFinancialSnapshot", async () => {
        const month = input.month ?? getCurrentMonthKey();
        const assignedMonth = toAssignedMonth(month);
        const [payments, employeePayments, costs, settings, jobs] = await Promise.all([
          getJobClientPayments({ assignedMonth }),
          getEmployeePayments({ assignedMonth }),
          getOperationalCosts({ assignedMonth }),
          getOpsCostSettings(),
          getJobs({ includeArchived: false }),
        ]);
        if (
          "error" in payments ||
          "error" in employeePayments ||
          "error" in costs ||
          "error" in settings ||
          "error" in jobs
        ) {
          return toolError("read_failed", "No se pudieron leer los movimientos del mes.");
        }

        const summary = getDashboardFinancials({
          bpsEstimatePercent: Number(settings.settings?.bpsEstimatePercent ?? 0),
          clientPayments: payments.clientPayments,
          employeePayments: employeePayments.employeePayments,
          jobs: jobs.jobs,
          operationalCosts: costs.costs,
        });
        return toolOk({
          card: "finance" as const,
          month,
          monthLabel: formatMonthLabel(month),
          summary: {
            recordedRevenue: roundMoney(summary.recordedRevenue),
            totalCosts: roundMoney(summary.totalCosts),
            employeePaymentsTotal: roundMoney(summary.employeePaymentsTotal),
            manualCostsTotal: roundMoney(summary.manualCostsTotal),
            realProfit: roundMoney(summary.realProfit),
            marginPercent: roundPercent(summary.marginPercent),
            realBpsTotal: roundMoney(summary.realBpsTotal),
            estimatedBpsTotal: roundMoney(summary.estimatedBpsTotal),
            projectedRevenue: roundMoney(summary.projectedRevenue),
            projectedProfit: roundMoney(summary.projectedProfit),
          },
          counts: {
            clientPayments: payments.clientPayments.length,
            employeePayments: employeePayments.employeePayments.length,
            operationalCosts: costs.costs.length,
          },
        });
      }),
  }),

  getFinancialTrend: tool({
    description:
      "Tendencia de los últimos meses (3 por defecto) con cobrado, egresos, resultado y margen por mes, para comparar contra meses anteriores.",
    inputSchema: financialTrendInputSchema,
    execute: (input) =>
      runTool("getFinancialTrend", async () => {
        const month = input.month ?? getCurrentMonthKey();
        const result = await getFinanceTrend({
          month: toAssignedMonth(month),
          months: input.months ?? 3,
        });
        if ("error" in result) return toolError("read_failed", String(result.error));
        return toolOk({
          card: "finance-trend" as const,
          points: result.trend.map((point) => ({
            month: point.monthKey,
            monthLabel: formatMonthLabel(point.monthKey),
            recordedRevenue: roundMoney(point.recordedRevenue),
            totalCosts: roundMoney(point.totalCosts),
            realProfit: roundMoney(point.realProfit),
            marginPercent: roundPercent(point.marginPercent),
          })),
        });
      }),
  }),

  getJobProfitability: tool({
    description:
      "Rentabilidad por trabajo en un mes (o el histórico de un trabajo): ingreso esperado y cobrado, costo real, ganancia, visitas y severidad. missingData dice qué datos faltan para que el cálculo sea confiable.",
    inputSchema: jobProfitabilityInputSchema,
    execute: (input) =>
      runTool("getJobProfitability", async () => {
        const mode = input.mode ?? "MONTH";
        if (mode === "HISTORY" && !input.jobId) {
          return toolError("invalid_input", "El histórico necesita un jobId.");
        }
        const month = input.month ?? getCurrentMonthKey();
        const result = await getJobProfitability({
          jobId: input.jobId ?? undefined,
          mode,
          month: toAssignedMonth(month),
        });
        if ("error" in result) return toolError("read_failed", String(result.error));
        const rows = result.profitability;
        return toolOk({
          card: "profitability" as const,
          mode,
          month,
          monthLabel: formatMonthLabel(month),
          total: rows.length,
          truncated: rows.length > 15,
          jobs: rows.slice(0, 15).map((row) => ({
            jobId: row.jobId,
            jobName: row.jobName,
            severity: row.severity,
            expectedRevenue: roundMoney(row.expectedRevenue),
            collectedRevenue: roundMoney(row.collectedRevenue),
            actualCost: roundMoney(row.actualCost),
            actualProfit: roundMoney(row.actualProfit),
            expectedProfit: roundMoney(row.expectedProfit),
            lossPercent: roundPercent(row.lossPercent),
            completedVisits: row.completedVisits,
            plannedVisits: row.plannedVisits,
            missingData: row.missingData,
          })),
        });
      }),
  }),
});
