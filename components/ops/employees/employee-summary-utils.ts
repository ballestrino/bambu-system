import {
  TRANSPORTATION_PAY_PER_VISIT,
  getCompletedVisitEmployees,
  getCompletedVisitHours,
  getEmployeeHourlyRate,
  isCompletedEmployeeVisit,
} from "@/components/ops/compensation-utils";
import { toPayrollNumber } from "@/components/ops/payroll/payroll-utils";
import type { OpsEmployee, OpsEmployeePayment, OpsOccurrence } from "@/components/ops/types";
import { getMonthRange, toDateInputValue } from "@/components/ops/utils";

export type EmployeeSummaryJobRow = {
  hours: number;
  jobId: string;
  jobName: string;
  laborAmount: number | null;
  paymentAmount: number | null;
  transportationAmount: number;
  visits: number;
};

export type EmployeeSummaryVisitRow = {
  actualEndAt: Date | string | null;
  actualStartAt: Date | string | null;
  hours: number;
  id: string;
  jobId: string;
  jobName: string;
  notes: string | null;
  scheduledStartAt: Date | string;
};

export type EmployeeMonthlySummary = {
  balance: number | null;
  hours: number;
  hourlyRate: number | null;
  jobRows: EmployeeSummaryJobRow[];
  laborAmount: number | null;
  paymentAmount: number | null;
  recordedTotal: number;
  transportationAmount: number;
  visitRows: EmployeeSummaryVisitRow[];
  visits: number;
  voidedTotal: number;
};

const isValidDateInput = (value?: string) =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime()));

export const getInitialEmployeeSummaryRange = (start?: string, end?: string) => {
  const currentMonth = getMonthRange(new Date());

  return {
    endDate: isValidDateInput(end) ? end ?? "" : toDateInputValue(currentMonth.end),
    startDate: isValidDateInput(start) ? start ?? "" : toDateInputValue(currentMonth.start),
  };
};

export const getSummaryPeriodHref = (
  employeeId: string,
  startDate?: Date | string | null,
  endDate?: Date | string | null
) => {
  const start = toDateInputValue(startDate);
  const end = toDateInputValue(endDate);
  const query = start && end ? `?start=${start}&end=${end}` : "";

  return `/dashboard/employees/${employeeId}/summary${query}`;
};

export const buildEmployeeMonthlySummary = (
  employee: Pick<OpsEmployee, "hourlyRate" | "id">,
  occurrences: OpsOccurrence[],
  payments: OpsEmployeePayment[]
): EmployeeMonthlySummary => {
  const hourlyRate = getEmployeeHourlyRate(employee);
  const rows = new Map<string, EmployeeSummaryJobRow>();
  const visitRows: EmployeeSummaryVisitRow[] = [];

  occurrences.forEach((occurrence) => {
    const isAssigned = getCompletedVisitEmployees(occurrence).some(
      (assignedEmployee) => assignedEmployee.id === employee.id
    );
    if (!isAssigned) return;

    const current = rows.get(occurrence.jobId) ?? {
      hours: 0,
      jobId: occurrence.jobId,
      jobName: occurrence.job.name,
      laborAmount: null,
      paymentAmount: null,
      transportationAmount: 0,
      visits: 0,
    };
    const hours = getCompletedVisitHours(occurrence);

    current.hours += hours;
    if (isCompletedEmployeeVisit(occurrence)) {
      current.transportationAmount += TRANSPORTATION_PAY_PER_VISIT;
      current.visits += 1;
    }
    rows.set(occurrence.jobId, current);
    visitRows.push({
      actualEndAt: occurrence.actualEndAt,
      actualStartAt: occurrence.actualStartAt,
      hours,
      id: occurrence.id,
      jobId: occurrence.jobId,
      jobName: occurrence.job.name,
      notes: occurrence.notes,
      scheduledStartAt: occurrence.scheduledStartAt,
    });
  });

  const jobRows = Array.from(rows.values())
    .map((row) => {
      const laborAmount = hourlyRate === null ? null : row.hours * hourlyRate;
      return {
        ...row,
        laborAmount,
        paymentAmount: laborAmount === null ? null : laborAmount + row.transportationAmount,
      };
    })
    .sort((left, right) => right.hours - left.hours || left.jobName.localeCompare(right.jobName));

  const recordedTotal = payments.reduce(
    (sum, payment) => sum + (payment.status === "RECORDED" ? toPayrollNumber(payment.amount) : 0),
    0
  );
  const voidedTotal = payments.reduce(
    (sum, payment) => sum + (payment.status === "VOIDED" ? toPayrollNumber(payment.amount) : 0),
    0
  );
  const hours = jobRows.reduce((sum, row) => sum + row.hours, 0);
  const visits = jobRows.reduce((sum, row) => sum + row.visits, 0);
  const transportationAmount = jobRows.reduce((sum, row) => sum + row.transportationAmount, 0);
  const laborAmount = hourlyRate === null ? null : hours * hourlyRate;
  const paymentAmount = laborAmount === null ? null : laborAmount + transportationAmount;

  return {
    balance: paymentAmount === null ? null : paymentAmount - recordedTotal,
    hourlyRate,
    hours,
    jobRows,
    laborAmount,
    paymentAmount,
    recordedTotal,
    transportationAmount,
    visitRows: visitRows.sort(
      (left, right) =>
        left.jobName.localeCompare(right.jobName) ||
        new Date(left.scheduledStartAt).getTime() -
        new Date(right.scheduledStartAt).getTime()
    ),
    visits,
    voidedTotal,
  };
};

const csvCell = (value: string | number | null) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

const transportationSummary = (visits: number, amount: number) =>
  `${visits} visitas x ${TRANSPORTATION_PAY_PER_VISIT} = ${amount.toFixed(2)}`;

export const buildEmployeeSummaryCsv = (
  employeeName: string,
  startDate: string,
  endDate: string,
  summary: EmployeeMonthlySummary
) => {
  const rows = [
    ["Empleado", employeeName],
    ["Periodo", `${startDate} - ${endDate}`],
    [],
    ["Trabajo", "Horas", "Visitas", "Pago horas", "Boleto", "Pago sugerido"],
    ...summary.jobRows.map((row) => [
      row.jobName,
      row.hours.toFixed(2),
      row.visits,
      row.laborAmount?.toFixed(2) ?? "",
      row.transportationAmount.toFixed(2),
      row.paymentAmount?.toFixed(2) ?? "",
    ]),
    [
      "TOTAL",
      summary.hours.toFixed(2),
      summary.visits,
      summary.laborAmount?.toFixed(2) ?? "",
      summary.transportationAmount.toFixed(2),
      summary.paymentAmount?.toFixed(2) ?? "",
    ],
    ["Detalle boleto", transportationSummary(summary.visits, summary.transportationAmount)],
    ["Pagado registrado", summary.recordedTotal.toFixed(2)],
    ["Pagos anulados", summary.voidedTotal.toFixed(2)],
    ["Saldo", summary.balance?.toFixed(2) ?? ""],
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
};
