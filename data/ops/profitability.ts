import "server-only";

import {
  readProfitabilitySources,
  toProfitabilityOccurrence,
  type ProfitabilitySources,
} from "@/data/ops/profitability-sources";
import { getAssignedMonthRange } from "@/lib/ops/finance";
import {
  aggregateProfitabilityHistory,
  calculateJobProfitability,
  sortProfitability,
  type ProfitabilityCalculationInput,
} from "@/lib/ops/profitability";
import { requireAdminSession } from "@/lib/require-admin-session";
import { ProfitabilityQuerySchema } from "@/schemas/ops";

const monthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const monthBounds = (date: Date) => {
  const range = getAssignedMonthRange(date);
  return { end: range.lte, start: range.gte };
};

const isPastMonth = (month: Date) => {
  const now = new Date();
  const currentStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  return monthBounds(month).end.getTime() < currentStart;
};

const isJobClosed = (job: {
  jobType: string;
  punctualEndDate: Date | null;
  status: string;
}) =>
  job.status === "COMPLETED" ||
  (job.jobType === "PUNCTUAL" &&
    Boolean(job.punctualEndDate && job.punctualEndDate <= new Date()));

const getMonthlyInputs = (
  sources: ProfitabilitySources,
  month: Date,
  scope: "MONTH" | "HISTORY"
): ProfitabilityCalculationInput[] => {
  const bounds = monthBounds(month);
  return sources.jobs.map((job) => ({
    clientPayments: sources.payments.filter(
      (payment) => payment.jobId === job.id &&
        (job.jobType === "PUNCTUAL" || monthKey(payment.assignedMonth) === monthKey(month))
    ),
    isClosed: job.jobType === "PUNCTUAL"
      ? Boolean(job.punctualEndDate && job.punctualEndDate <= bounds.end && job.punctualEndDate <= new Date())
      : isPastMonth(month) || isJobClosed(job),
    job,
    operationalCosts: sources.costs.filter(
      (cost) => cost.jobId === job.id &&
        (job.jobType === "PUNCTUAL" || monthKey(cost.assignedMonth) === monthKey(month))
    ),
    occurrences: sources.occurrences
      .filter(
        (occurrence) =>
          occurrence.jobId === job.id &&
          (job.jobType === "PUNCTUAL" || monthKey(occurrence.scheduledStartAt) === monthKey(month))
      )
      .map(toProfitabilityOccurrence),
    periodEnd: bounds.end,
    periodStart: job.jobType === "PUNCTUAL" && job.punctualStartDate
      ? job.punctualStartDate
      : bounds.start,
    scope,
  }));
};

export const getJobProfitability = async (query: unknown) => {
  await requireAdminSession();
  const parsed = ProfitabilityQuerySchema.safeParse(query);
  if (!parsed.success) return { error: "Consulta de rentabilidad inválida" };
  const { jobId, mode, month } = parsed.data;
  const sources = await readProfitabilitySources({ history: mode === "HISTORY", jobId, month });

  if (mode === "MONTH") {
    return {
      profitability: sortProfitability(
        getMonthlyInputs(sources, month, "MONTH").map(calculateJobProfitability)
      ),
    };
  }

  const job = sources.jobs[0];
  if (!job) return { profitability: [] };
  const dates = [
    ...sources.occurrences.map(({ scheduledStartAt }) => scheduledStartAt),
    ...sources.costs.map(({ assignedMonth }) => assignedMonth),
    ...sources.payments.map(({ assignedMonth }) => assignedMonth),
  ];
  if (!dates.length) return { profitability: [] };

  if (job.jobType === "PUNCTUAL") {
    const start = new Date(Math.min(...dates.map((date) => date.getTime())));
    const end = new Date(Math.max(...dates.map((date) => date.getTime())));
    const result = calculateJobProfitability({
      clientPayments: sources.payments,
      isClosed: isJobClosed(job),
      job,
      operationalCosts: sources.costs,
      occurrences: sources.occurrences.map(toProfitabilityOccurrence),
      periodEnd: end,
      periodStart: start,
      scope: "HISTORY",
    });
    return { profitability: [result] };
  }

  const months = Array.from(new Set(dates.map(monthKey))).sort();
  const inputs = months.flatMap((key) => {
    const [year, monthNumber] = key.split("-").map(Number);
    return getMonthlyInputs(
      sources,
      new Date(Date.UTC(year, monthNumber - 1, 1)),
      "HISTORY"
    );
  });
  const history = aggregateProfitabilityHistory(inputs);
  return { profitability: history ? [history] : [] };
};
