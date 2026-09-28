import "server-only";

import { tool } from "ai";

import {
  applyPayrollTracking,
  buildPayrollRows,
  getPayrollSummary,
} from "@/components/ops/payroll/payroll-utils";
import { getAgentOccurrences } from "@/data/agent/occurrences";
import { getEmployeePayments } from "@/data/ops/employee-payments";
import { getEmployees } from "@/data/ops/employees";
import {
  formatMonthLabel,
  getCurrentMonthKey,
  getPayrollWorkMonthKey,
  getZonedMonthRange,
  toAssignedMonth,
} from "@/lib/agent/month";
import { roundMoney, runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import {
  isPayrollWorkMonthTracked,
  PAYROLL_TRACKING_START_LABEL,
} from "@/lib/ops/finance/payroll-period";
import { monthInputSchema } from "@/schemas/agent-tools";

const nullableMoney = (value: number | null) => (value === null ? null : roundMoney(value));

// Mismo cálculo que Finanzas → Pagos: los pagos del mes elegido contra las
// visitas realizadas del mes anterior.
export const createPayrollTools = () => ({
  getPayrollSummary: tool({
    description:
      `Sueldos a mes vencido: para el mes de pago elegido, las horas y visitas realizadas del mes anterior, el sugerido, lo pagado y el saldo por empleada, más aguinaldo, salario vacacional y BPS generados. Los sueldos se registran desde las horas de ${PAYROLL_TRACKING_START_LABEL}: antes, tracked es false y el sugerido y el saldo vienen en null (sin registro).`,
    inputSchema: monthInputSchema,
    execute: (input) =>
      runTool("getPayrollSummary", async () => {
        const paymentMonth = input.month ?? getCurrentMonthKey();
        const workMonth = getPayrollWorkMonthKey(paymentMonth);
        const range = getZonedMonthRange(workMonth);
        const [employees, payments, occurrences] = await Promise.all([
          getEmployees({ includeArchived: true }),
          getEmployeePayments({ assignedMonth: toAssignedMonth(paymentMonth) }),
          getAgentOccurrences({ start: range.start, end: range.end, statuses: ["DONE"] }),
        ]);
        if ("error" in employees || "error" in payments) {
          return toolError("read_failed", "No se pudieron leer empleadas o pagos.");
        }

        const tracked = isPayrollWorkMonthTracked(workMonth);
        const rows = applyPayrollTracking(
          buildPayrollRows(employees.employees, occurrences, payments.employeePayments),
          tracked
        );
        const summary = getPayrollSummary(rows, payments.employeePayments);
        return toolOk({
          card: "payroll" as const,
          paymentMonth,
          paymentMonthLabel: formatMonthLabel(paymentMonth),
          workMonth,
          workMonthLabel: formatMonthLabel(workMonth),
          tracked,
          trackingStartLabel: PAYROLL_TRACKING_START_LABEL,
          summary: {
            suggestedTotal: tracked ? roundMoney(summary.suggestedTotal) : null,
            recordedTotal: roundMoney(summary.recordedTotal),
            balanceTotal: tracked ? roundMoney(summary.balanceTotal) : null,
            aguinaldoGeneratedTotal: roundMoney(summary.aguinaldoGeneratedTotal),
            vacationSalaryGeneratedTotal: roundMoney(summary.vacationSalaryGeneratedTotal),
            bpsGeneratedTotal: roundMoney(summary.bpsGeneratedTotal),
            recordedCount: summary.recordedCount,
          },
          total: rows.length,
          truncated: rows.length > 30,
          employees: rows.slice(0, 30).map((row) => ({
            employeeId: row.employeeId,
            employeeName: row.employeeName,
            hours: Math.round(row.hours * 100) / 100,
            visits: row.visits,
            hourlyRate: nullableMoney(row.hourlyRate),
            suggestedAmount: nullableMoney(row.suggestedAmount),
            recordedTotal: roundMoney(row.recordedTotal),
            balance: nullableMoney(row.balance),
          })),
        });
      }),
  }),
});
