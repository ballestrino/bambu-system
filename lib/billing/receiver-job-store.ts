import type { Prisma, PrismaClient } from "@prisma/client";

import { addBillingMonths, BILLING_TIME_ZONE } from "@/lib/billing/billing-month";
import { getBillingMonthName } from "@/lib/billing/billing-month-text";
import type { InvoiceReceiverPayload } from "@/lib/billing/invoice-mapping";
import { getJobWarnings, getReceiverKey, suggestJobs, type JobChoice, type JobWarning } from "@/lib/billing/receiver-job";
import { getBudgetOptionPriceWithoutIva } from "@/lib/ops/job-budget-pricing";
import { zonedTimeToUtc } from "@/lib/ops/timezone";

type Db = PrismaClient | Prisma.TransactionClient;

const toRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

// El precio mensual sin IVA del presupuesto que tomó el trabajo (la copia
// guardada en el trabajo o, si no hay, la opción del presupuesto).
const getMonthlyPrice = (job: { budgetSnapshot: unknown; sourceBudgetOption: unknown }) =>
  getBudgetOptionPriceWithoutIva(toRecord(toRecord(job.budgetSnapshot)?.option) ?? toRecord(job.sourceBudgetOption));

// El mes en hora de Montevideo, como instantes UTC (las visitas guardan instantes).
const getMonthInstants = (period: Date) => {
  const at = (month: Date) =>
    zonedTimeToUtc({ year: month.getUTCFullYear(), month: month.getUTCMonth() + 1, day: 1 }, BILLING_TIME_ZONE);
  return { gte: at(period), lt: at(addBillingMonths(period, 1)) };
};

// Los trabajos que se pueden vincular: los que no están archivados.
export const listJobChoices = (db: Db): Promise<JobChoice[]> =>
  db.job.findMany({
    where: { archivedAt: null, status: { not: "ARCHIVED" } },
    select: { id: true, name: true, scheduleName: true },
    orderBy: { name: "asc" },
  });

export type DraftJobInfo = {
  job: { id: string; name: string } | null;
  receiverKey: string | null;
  suggestion: { id: string; name: string } | null;
  warnings: JobWarning[];
};

type DraftJobRow = { currency: string; id: string; label?: string | null; receiver: InvoiceReceiverPayload | null; subtotal: number };

// Para cada factura del borrador de `period`: su trabajo vinculado y los
// avisos (precio, visitas canceladas o salteadas en el mes, trabajo pausado o
// terminado), o el trabajo que se le parece para sugerir el vínculo.
export const loadDraftJobs = async (db: Db, period: Date, rows: DraftJobRow[]) => {
  const keys = [...new Set(rows.flatMap((row) => getReceiverKey(row.receiver, row.label) ?? []))];
  const links = keys.length
    ? await db.billingReceiverJob.findMany({
        where: { receiverKey: { in: keys } },
        select: {
          receiverKey: true,
          job: { select: { archivedAt: true, budgetSnapshot: true, id: true, name: true, sourceBudgetOption: true, status: true } },
        },
      })
    : [];
  const jobIds = [...new Set(links.map((link) => link.job.id))];
  const canceled = jobIds.length
    ? await db.jobOccurrence.groupBy({
        by: ["jobId"],
        where: { archivedAt: null, jobId: { in: jobIds }, scheduledStartAt: getMonthInstants(period), status: { in: ["CANCELED", "SKIPPED"] } },
        _count: { _all: true },
      })
    : [];
  const choices = rows.length ? await listJobChoices(db) : [];
  const monthName = getBillingMonthName(period);

  const byInvoice = new Map<string, DraftJobInfo>();
  for (const row of rows) {
    const receiverKey = getReceiverKey(row.receiver, row.label);
    const link = receiverKey ? links.find((item) => item.receiverKey === receiverKey) : undefined;
    if (link) {
      const job = {
        archivedAt: link.job.archivedAt,
        canceledVisits: canceled.find((group) => group.jobId === link.job.id)?._count._all ?? 0,
        monthlyPrice: getMonthlyPrice(link.job),
        name: link.job.name,
        status: link.job.status,
      };
      byInvoice.set(row.id, {
        job: { id: link.job.id, name: link.job.name },
        receiverKey,
        suggestion: null,
        warnings: getJobWarnings(row, job, monthName),
      });
      continue;
    }
    const best = receiverKey ? suggestJobs(row.receiver, choices, 1, row.label)[0] : undefined;
    byInvoice.set(row.id, {
      job: null,
      receiverKey,
      suggestion: best ? { id: best.job.id, name: best.job.name } : null,
      warnings: [],
    });
  }
  return { byInvoice, choices: choices.map((choice) => ({ id: choice.id, name: choice.name })) };
};
