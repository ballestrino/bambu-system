import "server-only";

import { tool } from "ai";

import { getAgentOccurrences } from "@/data/agent/occurrences";
import { getEmployeePayments } from "@/data/ops/employee-payments";
import { getEmployees } from "@/data/ops/employees";
import { getJobClientPayments } from "@/data/ops/job-client-payments";
import { getJobs } from "@/data/ops/jobs";
import { getOperationalCosts } from "@/data/ops/operational-costs";
import {
  getCurrentMonthKey,
  getZonedMonthRange,
  toAssignedMonth,
} from "@/lib/agent/month";
import { roundMoney, runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import { DEFAULT_OPS_TIMEZONE } from "@/lib/ops/timezone";
import { queryOperationsInputSchema, type QueryOperationsInput } from "@/schemas/agent-tools";

const MAX_ROWS = 50;

const localFormat = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: DEFAULT_OPS_TIMEZONE,
});
const dateFormat = new Intl.DateTimeFormat("sv-SE", { timeZone: DEFAULT_OPS_TIMEZONE });

const localDateTime = (date: Date | null) => (date ? localFormat.format(date) : null);
const localDate = (date: Date) => dateFormat.format(date);
const money = (value: unknown) => roundMoney(Number(value) || 0);

type AmountRow = { amount: number; status: string };

const recordedTotal = (rows: AmountRow[]) =>
  roundMoney(rows.reduce((sum, row) => (row.status === "RECORDED" ? sum + row.amount : sum), 0));

// Cada tipo usa el lector de data/ que ya usa la pantalla. Las visitas usan el
// lector propio del agente (data/agent/occurrences.ts), pensado para sus filtros.
const readOperations = async (input: QueryOperationsInput) => {
  const month = input.month ?? getCurrentMonthKey();
  const assignedMonth = toAssignedMonth(month);

  switch (input.kind) {
    case "jobs": {
      const result = await getJobs({
        query: input.query ?? undefined,
        statuses: input.jobStatus ? [input.jobStatus] : undefined,
        includeArchived: input.jobStatus === "ARCHIVED",
      });
      if (!result.jobs) return { error: result.error ?? "No se pudieron leer los trabajos." };
      return {
        rows: result.jobs.map((job) => ({
          id: job.id,
          name: job.name,
          status: job.status,
          jobType: job.jobType,
          location: job.serviceLocation,
          sourceBudget: job.sourceBudget?.name ?? null,
        })),
      };
    }
    case "employees": {
      const result = await getEmployees({
        query: input.query ?? undefined,
        isActive: input.includeInactive ? undefined : true,
        includeArchived: input.includeInactive ?? undefined,
      });
      if (!result.employees) return { error: result.error ?? "No se pudieron leer las empleadas." };
      return {
        rows: result.employees.map((employee) => ({
          id: employee.id,
          name: employee.name,
          isActive: employee.isActive,
          archived: Boolean(employee.archivedAt),
          hourlyRate: employee.hourlyRate === null ? null : money(employee.hourlyRate),
        })),
      };
    }
    case "visits": {
      const range = getZonedMonthRange(month);
      const occurrences = await getAgentOccurrences({
        start: range.start,
        end: range.end,
        jobId: input.jobId ?? undefined,
        employeeId: input.employeeId ?? undefined,
        statuses: input.visitStatus ? [input.visitStatus] : undefined,
      });
      return {
        month,
        rows: occurrences.map((visit) => ({
          id: visit.id,
          job: visit.job.name,
          status: visit.status,
          scheduledStart: localDateTime(visit.scheduledStartAt),
          scheduledEnd: localDateTime(visit.scheduledEndAt),
          actualStart: localDateTime(visit.actualStartAt),
          actualEnd: localDateTime(visit.actualEndAt),
          employees: visit.employees.map(({ employee }) => employee.name),
        })),
      };
    }
    case "clientPayments": {
      const result = await getJobClientPayments({ assignedMonth, jobId: input.jobId ?? undefined });
      if (!result.clientPayments) return { error: result.error ?? "No se pudieron leer los cobros." };
      const rows = result.clientPayments.map((payment) => ({
        id: payment.id,
        job: payment.job.name,
        paymentDate: localDate(payment.paymentDate),
        amount: money(payment.amount),
        status: payment.status,
        reference: payment.reference,
      }));
      return { month, rows, recordedTotal: recordedTotal(rows) };
    }
    case "operationalCosts": {
      const result = await getOperationalCosts({
        assignedMonth,
        jobId: input.jobId ?? undefined,
        kinds: input.costKind ? [input.costKind] : undefined,
      });
      if (!result.costs) return { error: result.error ?? "No se pudieron leer los costes." };
      const rows = result.costs.map((cost) => ({
        id: cost.id,
        category: cost.category.name,
        kind: cost.category.kind,
        job: cost.job?.name ?? null,
        employee: cost.employee?.name ?? null,
        costDate: localDate(cost.costDate),
        amount: money(cost.amount),
        status: cost.status,
      }));
      return { month, rows, recordedTotal: recordedTotal(rows) };
    }
    case "employeePayments": {
      const result = await getEmployeePayments({ assignedMonth, employeeId: input.employeeId ?? undefined });
      if (!result.employeePayments) return { error: result.error ?? "No se pudieron leer los pagos a empleadas." };
      const rows = result.employeePayments.map((payment) => ({
        id: payment.id,
        employee: payment.employee.name,
        paymentDate: localDate(payment.paymentDate),
        amount: money(payment.amount),
        status: payment.status,
      }));
      return { month, rows, recordedTotal: recordedTotal(rows) };
    }
  }
};

export const createOperationsTools = () => ({
  queryOperations: tool({
    description:
      "Consulta operaciones en modo lectura: trabajos (jobs), empleadas (employees), visitas del mes (visits), cobros (clientPayments), costes (operationalCosts) o pagos a empleadas (employeePayments). Hasta 50 filas; truncated avisa si hay más. No modifica nada.",
    inputSchema: queryOperationsInputSchema,
    execute: (input) =>
      runTool("queryOperations", async () => {
        const result = await readOperations(input);
        if ("error" in result) return toolError("read_failed", String(result.error));
        return toolOk({
          card: "list" as const,
          kind: input.kind,
          ...result,
          total: result.rows.length,
          truncated: result.rows.length > MAX_ROWS,
          rows: result.rows.slice(0, MAX_ROWS),
        });
      }),
  }),
});
