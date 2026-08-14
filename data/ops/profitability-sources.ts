import "server-only";

import { db } from "@/lib/db";
import { getAssignedMonthRange } from "@/lib/ops/finance";

export const readProfitabilitySources = async ({
  history,
  jobId,
  month,
}: {
  history: boolean;
  jobId?: string;
  month: Date;
}) => {
  const range = getAssignedMonthRange(month);
  const bounds = { end: range.lte, start: range.gte };
  const periodFilter = history ? undefined : { gte: bounds.start, lte: bounds.end };
  const jobs = await db.job.findMany({
    where: {
      id: jobId,
      ...(history ? {} : {
        archivedAt: null,
        status: { notIn: ["DRAFT", "ARCHIVED"] },
        OR: [
          { jobType: "ONGOING" },
          {
            jobType: "PUNCTUAL",
            punctualEndDate: { gte: bounds.start },
            punctualStartDate: { lte: bounds.end },
          },
        ],
      }),
    },
    select: {
      budgetSnapshot: true,
      id: true,
      jobType: true,
      name: true,
      punctualEndDate: true,
      punctualStartDate: true,
      sourceBudgetOption: true,
      status: true,
    },
  });
  const jobIds = jobs.map(({ id }) => id);
  const ongoingIds = jobs.filter(({ jobType }) => jobType === "ONGOING").map(({ id }) => id);
  const punctualIds = jobs.filter(({ jobType }) => jobType === "PUNCTUAL").map(({ id }) => id);
  if (!jobIds.length) return { costs: [], jobs, occurrences: [], payments: [] };

  const [occurrences, costs, payments] = await Promise.all([
    db.jobOccurrence.findMany({
      where: {
        archivedAt: null,
        OR: history ? [{ jobId: { in: jobIds } }] : [
          { jobId: { in: ongoingIds }, scheduledStartAt: periodFilter },
          { jobId: { in: punctualIds }, scheduledStartAt: { lte: bounds.end } },
        ],
        status: "DONE",
      },
      select: {
        actualEndAt: true,
        actualStartAt: true,
        archivedAt: true,
        employees: {
          select: {
            employee: { select: { hourlyRate: true, id: true, name: true } },
          },
        },
        id: true,
        jobId: true,
        scheduledStartAt: true,
        status: true,
      },
    }),
    db.operationalCost.findMany({
      where: {
        OR: history ? [{ jobId: { in: jobIds } }] : [
          { assignedMonth: periodFilter, jobId: { in: ongoingIds } },
          { assignedMonth: { lte: bounds.end }, jobId: { in: punctualIds } },
        ],
      },
      select: { amount: true, assignedMonth: true, jobId: true, status: true },
    }),
    db.jobClientPayment.findMany({
      where: {
        OR: history ? [{ jobId: { in: jobIds } }] : [
          { assignedMonth: periodFilter, jobId: { in: ongoingIds } },
          { assignedMonth: { lte: bounds.end }, jobId: { in: punctualIds } },
        ],
      },
      select: { amount: true, assignedMonth: true, jobId: true, status: true },
    }),
  ]);
  return { costs, jobs, occurrences, payments };
};

export type ProfitabilitySources = Awaited<ReturnType<typeof readProfitabilitySources>>;

export const toProfitabilityOccurrence = (
  occurrence: ProfitabilitySources["occurrences"][number]
) => ({
  ...occurrence,
  employees: occurrence.employees.map(({ employee }) => employee),
});
