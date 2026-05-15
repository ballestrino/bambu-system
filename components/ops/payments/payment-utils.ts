import type {
  OpsJobClientPayment,
  OpsOccurrence,
} from "@/components/ops/types";

const moneyFormat = new Intl.NumberFormat("es-UY", {
  currency: "UYU",
  maximumFractionDigits: 2,
  style: "currency",
});

export const toMoneyNumber = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatMoney = (amount: number) => moneyFormat.format(amount);

export const getPaymentSummary = (payments: OpsJobClientPayment[]) =>
  payments.reduce(
    (acc, payment) => {
      const amount = toMoneyNumber(payment.amount);
      if (payment.status === "RECORDED") {
        acc.recordedTotal += amount;
        acc.recordedCount += 1;
      } else {
        acc.voidedTotal += amount;
        acc.voidedCount += 1;
      }
      return acc;
    },
    { recordedTotal: 0, recordedCount: 0, voidedTotal: 0, voidedCount: 0 }
  );

const getWorkedHours = (occurrence: OpsOccurrence) => {
  if (occurrence.status !== "DONE" || !occurrence.employeeId || !occurrence.actualStartAt || !occurrence.actualEndAt) {
    return 0;
  }

  const startedAt = new Date(occurrence.actualStartAt).getTime();
  const endedAt = new Date(occurrence.actualEndAt).getTime();
  return Math.max(0, (endedAt - startedAt) / 3600000);
};

export const buildRevenueAttribution = (
  payments: OpsJobClientPayment[],
  occurrences: OpsOccurrence[]
) => {
  const recordedByJob = new Map<string, { amount: number; jobName: string }>();
  const hoursByJob = new Map<string, Map<string, { employeeName: string; hours: number }>>();

  payments.forEach((payment) => {
    if (payment.status !== "RECORDED") return;
    const current = recordedByJob.get(payment.jobId) ?? { amount: 0, jobName: payment.job.name };
    current.amount += toMoneyNumber(payment.amount);
    recordedByJob.set(payment.jobId, current);
  });

  occurrences.forEach((occurrence) => {
    const hours = getWorkedHours(occurrence);
    if (!hours || !occurrence.employeeId || !occurrence.employee) return;

    const jobHours = hoursByJob.get(occurrence.jobId) ?? new Map();
    const employeeHours = jobHours.get(occurrence.employeeId) ?? {
      employeeName: occurrence.employee.name,
      hours: 0,
    };
    employeeHours.hours += hours;
    jobHours.set(occurrence.employeeId, employeeHours);
    hoursByJob.set(occurrence.jobId, jobHours);
  });

  const rows = new Map<string, { employeeId: string; employeeName: string; hours: number; amount: number }>();
  const unassignedJobs: { jobId: string; jobName: string; amount: number }[] = [];

  recordedByJob.forEach((payment, jobId) => {
    const jobHours = hoursByJob.get(jobId);
    const totalHours = Array.from(jobHours?.values() ?? []).reduce(
      (sum, entry) => sum + entry.hours,
      0
    );

    if (!jobHours || totalHours <= 0) {
      unassignedJobs.push({ jobId, jobName: payment.jobName, amount: payment.amount });
      return;
    }

    jobHours.forEach((entry, employeeId) => {
      const current = rows.get(employeeId) ?? {
        employeeId,
        employeeName: entry.employeeName,
        hours: 0,
        amount: 0,
      };
      current.hours += entry.hours;
      current.amount += payment.amount * (entry.hours / totalHours);
      rows.set(employeeId, current);
    });
  });

  return {
    rows: Array.from(rows.values()).sort((a, b) => b.amount - a.amount),
    unassignedJobs,
    unassignedTotal: unassignedJobs.reduce((sum, job) => sum + job.amount, 0),
  };
};
