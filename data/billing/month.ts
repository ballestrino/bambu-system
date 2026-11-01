import "server-only";

import { getBillerStatus } from "@/lib/billing/biller-server";
import { addBillingMonths, getBillingPeriodKey, getIssueDateRange, parseBillingPeriod } from "@/lib/billing/billing-month";
import { toDraftRow, toIssuedRow } from "@/lib/billing/billing-month-view";
import { summarizeBillingMonth } from "@/lib/billing/billing-summary";
import { linkCreditNotes } from "@/lib/billing/credit-note-links";
import { readStoredReceiver } from "@/lib/billing/invoice-json";
import { loadDraftJobs } from "@/lib/billing/receiver-job-store";
import { buildRepeatDraft, getRepeatSkip, type RepeatSkipKind } from "@/lib/billing/draft-repeat";
import { loadRepeatInputs, toRepeatSource } from "@/lib/billing/draft-store";
import { ISSUE_STALE_MS } from "@/lib/billing/issue-claim";
import { getIssueDay } from "@/lib/billing/issue-payload";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import { billingPeriodSchema } from "@/schemas/billing";

const sourceSelect = {
  adenda: true, billerId: true, cfeType: true, currency: true, dueDate: true, id: true, issueDate: true,
  items: true, number: true, paymentForm: true, receiver: true, receiverDocument: true, status: true, total: true,
} as const;

const issuedSelect = {
  archivedAt: true, billerId: true, billerStatus: true, cfeType: true, currency: true, id: true, issueDate: true, items: true,
  number: true, receiver: true, series: true, status: true, total: true,
} as const;

// Todo lo de la página Facturación para un mes, desde la copia local
// (sincronizar primero con syncBillingMonth): el resumen contra el mes
// anterior, lo emitido, el borrador y qué pasaría al repetir el mes anterior.
export const getBillingMonthView = async (periodKey: unknown) => {
  await requireAdminSession();

  const parsedKey = billingPeriodSchema.safeParse(periodKey);
  const period = parsedKey.success ? parseBillingPeriod(parsedKey.data) : null;
  if (!period) return { error: "Mes inválido" };
  const previous = addBillingMonths(period, -1);

  const batch = await db.invoiceBatch.findFirst({
    where: { period },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true, id: true, origin: true, status: true, updatedAt: true,
      invoices: {
        select: {
          archivedAt: true, billerId: true, billerStatus: true, cfeType: true, currency: true, dueDays: true, error: true, id: true, items: true, number: true, paymentForm: true,
          receiver: true, selected: true, series: true, status: true, total: true, updatedAt: true,
          sourceInvoice: { select: sourceSelect },
        },
      },
    },
  });

  const [invoices, repeat] = await Promise.all([
    db.invoice.findMany({
      where: { issueDate: { gte: previous, lt: addBillingMonths(period, 1) }, status: { not: "DRAFT" } },
      select: issuedSelect,
      orderBy: [{ issueDate: "desc" }, { number: "desc" }],
    }),
    loadRepeatInputs(db, period, batch?.id),
  ]);

  const current = invoices.filter((invoice) => invoice.issueDate && invoice.issueDate >= period);
  const currentIds = current.flatMap((invoice) => (invoice.billerId === null ? [] : [invoice.billerId]));
  const notes = currentIds.length
    ? await db.invoice.findMany({
        where: { referenceIds: { hasSome: currentIds }, status: { not: "DRAFT" } },
        select: { cfeType: true, id: true, issueDate: true, number: true, referenceIds: true, series: true, status: true, total: true },
      })
    : [];
  const credits = linkCreditNotes(
    current.map((invoice) => ({ billerId: invoice.billerId, total: Number(invoice.total) })),
    notes.map((note) => ({ ...note, total: Number(note.total) }))
  );

  // Lo archivado (47) sale de las listas: solo puede ser algo ya emitido.
  const draftRows = (batch?.invoices ?? [])
    .filter((invoice) => !invoice.archivedAt)
    .map((invoice) => {
      const source = invoice.sourceInvoice ? toRepeatSource(invoice.sourceInvoice) : null;
      const order = [invoice.sourceInvoice?.issueDate?.getTime() ?? Infinity, invoice.sourceInvoice?.number ?? 0];
      return { order, row: toDraftRow(invoice, source, repeat.context) };
    })
    .sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1] || a.row.name.localeCompare(b.row.name))
    .map(({ row }) => row);

  const receivers = new Map((batch?.invoices ?? []).map((invoice) => [invoice.id, readStoredReceiver(invoice.receiver)]));
  const jobs = await loadDraftJobs(
    db,
    period,
    draftRows.map((row) => ({ currency: row.currency, id: row.id, receiver: receivers.get(row.id) ?? null, subtotal: row.subtotal }))
  );
  for (const row of draftRows) row.jobLink = jobs.byInvoice.get(row.id) ?? null;

  const skipped: Partial<Record<RepeatSkipKind, number>> = {};
  for (const source of repeat.sources) {
    const skip = getRepeatSkip(source, repeat.context);
    if (skip) skipped[skip.kind] = (skipped[skip.kind] ?? 0) + 1;
  }
  const repeatRows = buildRepeatDraft(repeat.sources, repeat.context);
  const { gte } = getIssueDateRange(period);
  const now = new Date();

  return {
    biller: getBillerStatus(),
    draft: batch
      ? {
          createdAt: batch.createdAt.toISOString(),
          id: batch.id,
          jobChoices: jobs.choices,
          origin: batch.origin,
          // Sin nada repetido (solo facturas nuevas): la página ofrece repetir el mes anterior.
          repeated: batch.invoices.some((invoice) => invoice.sourceInvoice),
          rows: draftRows,
          status: batch.status,
          // Una emisión sin novedades hace rato se cortó: la página ofrece continuar.
          stuck: batch.status === "ISSUING" && now.getTime() - batch.updatedAt.getTime() > ISSUE_STALE_MS,
          updatedAt: batch.updatedAt.toISOString(),
        }
      : null,
    // Lo archivado (47) sale de "Emitidas" y sigue en el resumen (current).
    issued: current.filter((invoice) => !invoice.archivedAt).map((invoice) => toIssuedRow(invoice, credits)),
    archived: current.filter((invoice) => invoice.archivedAt).map((invoice) => toIssuedRow(invoice, credits)),
    issueDay: getIssueDay(now).toISOString().slice(0, 10),
    period: getBillingPeriodKey(period),
    previousPeriod: getBillingPeriodKey(previous),
    repeatPreview: {
      selected: repeatRows.filter((row) => row.selected).length,
      skipped,
      total: repeatRows.length,
    },
    summary: {
      current: summarizeBillingMonth(current),
      previous: summarizeBillingMonth(invoices.filter((invoice) => invoice.issueDate && invoice.issueDate < gte)),
    },
  };
};

export type BillingMonthView = Exclude<Awaited<ReturnType<typeof getBillingMonthView>>, { error: string }>;
