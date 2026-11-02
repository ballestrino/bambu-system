import "server-only";

import { getBillingPeriodKey } from "@/lib/billing/billing-month";
import { planCreditNote, type CreditNoteRequest } from "@/lib/billing/credit-note-plan";
import { getReceiverName, readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { getCfeLabel } from "@/lib/billing/invoice-mapping";
import { getReceiverKey, suggestJobs } from "@/lib/billing/receiver-job";
import { listJobChoices } from "@/lib/billing/receiver-job-store";
import { db } from "@/lib/db";

// Lecturas del agente para corregir y vincular (feature 43). Ninguna escribe:
// la nota la emite el usuario desde su página y el vínculo lo confirma en
// Facturación. No importa la emisión (check:billing).

export const CREDIT_NOTE_PATH = (invoiceId: string) => `/dashboard/billing/${invoiceId}/credit-note`;

// Valida la nota contra la copia local (lo mismo que hará la página al
// emitir) y devuelve el enlace a la página con todo puesto.
export const prepareAgentCreditNote = async (invoiceId: string, request: CreditNoteRequest, reason: string) => {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: { billerId: true, cfeType: true, currency: true, id: true, items: true, number: true, receiver: true, series: true, status: true, total: true },
  });
  if (!invoice) return { error: "No encontré esa factura", ok: false as const };
  const notes = invoice.billerId === null
    ? []
    : await db.invoice.findMany({ where: { referenceIds: { has: invoice.billerId }, status: { not: "DRAFT" } }, select: { cfeType: true, status: true, total: true } });
  const plan = planCreditNote(
    { ...invoice, items: readStoredItems(invoice.items), total: Number(invoice.total) },
    notes.map((note) => ({ ...note, total: Number(note.total) })),
    request
  );
  if (!plan.ok) return { error: plan.error, ok: false as const };

  const params = new URLSearchParams({ mode: request.mode, reason });
  if (request.mode === "partial") params.set("amounts", request.lines.filter((line) => line.amount > 0).map((line) => `${line.index}:${line.amount}`).join(","));
  return {
    cfeLabel: getCfeLabel(plan.cfeType),
    corrects: `${getCfeLabel(invoice.cfeType)} ${[invoice.series, invoice.number].filter(Boolean).join(" ")}`,
    currency: invoice.currency,
    lines: plan.items.map((item) => ({ concepto: item.concepto, subtotal: item.cantidad * item.precio })),
    mode: request.mode,
    name: getReceiverName(readStoredReceiver(invoice.receiver)),
    ok: true as const,
    reason,
    subtotal: plan.subtotal,
    total: plan.total,
    url: `${CREDIT_NOTE_PATH(invoice.id)}?${params.toString()}`,
  };
};

// Los receptores de un mes (el borrador o, si no hay, lo emitido) con su
// trabajo vinculado o hasta 3 trabajos parecidos para sugerir.
export const suggestAgentReceiverJobs = async (period: Date) => {
  const batch = await db.invoiceBatch.findFirst({ where: { period }, orderBy: { createdAt: "desc" }, select: { id: true } });
  const invoices = await db.invoice.findMany({
    where: batch ? { batchId: batch.id } : { period, status: { in: ["ISSUED", "ACCEPTED"] } },
    select: { label: true, receiver: true },
  });
  // Un consumidor final cuenta por su título interno (51).
  const receivers = new Map<string, { label: string | null; receiver: ReturnType<typeof readStoredReceiver> }>();
  for (const invoice of invoices) {
    const receiver = readStoredReceiver(invoice.receiver);
    const key = getReceiverKey(receiver, invoice.label);
    if (key && !receivers.has(key)) receivers.set(key, { label: invoice.label, receiver });
  }
  const keys = [...receivers.keys()];
  const [links, choices] = await Promise.all([
    keys.length ? db.billingReceiverJob.findMany({ where: { receiverKey: { in: keys } }, select: { receiverKey: true, job: { select: { name: true } } } }) : [],
    listJobChoices(db),
  ]);
  const rows = keys.map((key) => {
    const { label = null, receiver = null } = receivers.get(key) ?? {};
    const link = links.find((item) => item.receiverKey === key);
    return {
      job: link?.job.name ?? null,
      receiver: getReceiverName(receiver, label),
      suggestions: link ? [] : suggestJobs(receiver, choices, 3, label).map((match) => ({ job: match.job.name, score: Math.round(match.score * 100) / 100 })),
    };
  });
  return { from: batch ? "draft" as const : "issued" as const, month: getBillingPeriodKey(period), rows };
};
