import { Prisma, type PrismaClient } from "@prisma/client";

import { getPeriodOfIssueDate } from "@/lib/billing/billing-month";
import { planCreditNote, getCreditState, type CreditNoteRequest } from "@/lib/billing/credit-note-plan";
import type { CreditNoteInput } from "@/lib/billing/credit-note-payload";
import { readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { getIssueDay } from "@/lib/billing/issue-payload";
import { toOutcomeUpdate } from "@/lib/billing/issue-store";
import type { SendOutcome } from "@/lib/billing/issue-run";

type Tx = Prisma.TransactionClient;
const json = (value: unknown) => value as Prisma.InputJsonValue;

// Una nota de crédito por factura a la vez: el doble clic, otra pestaña o un
// reintento esperan este lock y ven la nota que ya está en curso.
const lockInvoiceCredit = (tx: Tx, billerId: number) =>
  tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`credit-note:${billerId}`}))`;

const invoiceSelect = {
  billerId: true, cfeType: true, currency: true, id: true, issueDate: true, items: true, number: true,
  paymentForm: true, receiver: true, receiverDocument: true, series: true, status: true, total: true,
} as const;

export const loadInvoiceNotes = async (tx: Tx, billerId: number) =>
  (
    await tx.invoice.findMany({
      where: { referenceIds: { has: billerId }, status: { not: "DRAFT" } },
      select: { cfeType: true, status: true, total: true },
    })
  ).map((note) => ({ ...note, total: Number(note.total) }));

// Lo que vio la página: el modo, las líneas, la razón, el total de la nota y
// lo ya acreditado de la factura (regla 2: se emite lo que se vio).
export type CreditNoteClaim = { credited: number; invoiceId: string; reason: string; total: number } & CreditNoteRequest;

export type CreditClaimResult = { noteId: string; ok: true; total: number } | { conflict: boolean; error: string };

// Con el lock de la factura vuelve a calcular la nota y la compara con lo que
// vio la página; si coincide crea la nota en ISSUING con su numero_interno.
export const claimCreditNote = (db: PrismaClient, claim: CreditNoteClaim, userId: string, now: Date) =>
  db.$transaction<CreditClaimResult>(async (tx) => {
    const found = await tx.invoice.findUnique({ where: { id: claim.invoiceId }, select: { billerId: true } });
    if (!found || found.billerId === null) return { conflict: false, error: "La factura todavía no está emitida en Biller" };
    await lockInvoiceCredit(tx, found.billerId);

    const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: claim.invoiceId }, select: invoiceSelect });
    const source = { ...invoice, items: readStoredItems(invoice.items), total: Number(invoice.total) };
    const notes = await loadInvoiceNotes(tx, found.billerId);
    const plan = planCreditNote(source, notes, claim);
    if (!plan.ok) return { conflict: false, error: plan.error };
    const state = getCreditState(source, notes);
    if (Math.abs(state.credited - claim.credited) > 0.01 || Math.abs(plan.total - claim.total) > 0.01) {
      return { conflict: true, error: "La factura cambió desde que abriste la nota: revisala antes de emitir" };
    }

    const note = await tx.invoice.create({
      data: {
        cfeType: plan.cfeType,
        createdById: userId,
        currency: invoice.currency,
        items: json(plan.items),
        origin: "APP",
        paymentForm: invoice.paymentForm,
        period: getPeriodOfIssueDate(getIssueDay(now)),
        receiver: invoice.receiver === null ? Prisma.DbNull : json(invoice.receiver),
        receiverDocument: invoice.receiverDocument,
        referenceIds: [found.billerId],
        referenceReason: claim.reason,
        references: json([{
          cfeType: invoice.cfeType, id: found.billerId, issueDate: invoice.issueDate?.toISOString().slice(0, 10) ?? null,
          number: invoice.number, series: invoice.series,
        }]),
        status: "ISSUING",
        total: plan.total,
      },
      select: { id: true },
    });
    // numero_interno: Biller lo rechaza repetido (regla 3).
    await tx.invoice.update({ where: { id: note.id }, data: { internalNumber: `BAMBU-${note.id}` } });
    return { noteId: note.id, ok: true, total: plan.total };
  });

export type CreditRetryResult = { ok: true } | { error: string };

// "Reintentar" una nota que quedó sin confirmar: vuelve a ISSUING y se manda
// con el mismo numero_interno, así que no duplica.
export const claimCreditNoteRetry = (db: PrismaClient, noteId: string) =>
  db.$transaction<CreditRetryResult>(async (tx) => {
    const found = await tx.invoice.findUnique({ where: { id: noteId }, select: { referenceIds: true, referenceReason: true } });
    const billerId = found?.referenceIds[0];
    if (!found || billerId === undefined || found.referenceReason === null) return { error: "La nota ya no existe" };
    await lockInvoiceCredit(tx, billerId);
    const { count } = await tx.invoice.updateMany({ where: { id: noteId, status: "UNKNOWN" }, data: { status: "ISSUING" } });
    return count ? { ok: true } : { error: "La nota ya no está sin confirmar" };
  });

const referenceSchema = (value: unknown) => {
  const first = Array.isArray(value) ? (value[0] as Record<string, unknown> | undefined) : undefined;
  if (!first || !Number.isInteger(first.id) || !Number.isInteger(first.number) || !Number.isInteger(first.cfeType)) return null;
  return {
    billerId: first.id as number,
    cfeType: first.cfeType as number,
    issueDate: typeof first.issueDate === "string" ? new Date(`${first.issueDate}T00:00:00Z`) : null,
    number: first.number as number,
    series: typeof first.series === "string" ? first.series : null,
  };
};

export const createCreditNoteStore = (db: PrismaClient) => ({
  // La nota en ISSUING lista para mandar, o null si no está (otra corrida la tomó).
  load: async (noteId: string): Promise<CreditNoteInput | null> => {
    const note = await db.invoice.findFirst({
      where: { id: noteId, status: "ISSUING" },
      select: {
        cfeType: true, currency: true, internalNumber: true, items: true, paymentForm: true, receiver: true,
        referenceReason: true, references: true,
      },
    });
    const items = readStoredItems(note?.items);
    const reference = referenceSchema(note?.references);
    if (!note?.internalNumber || !items?.length || !reference || !note.referenceReason) return null;
    return {
      cfeType: note.cfeType, currency: note.currency, internalNumber: note.internalNumber, items,
      paymentForm: note.paymentForm, reason: note.referenceReason, receiver: readStoredReceiver(note.receiver), reference,
    };
  },

  // Un rechazo de datos no creó nada en Biller: la nota se borra y la página
  // muestra por qué. Sin confirmar queda UNKNOWN para reintentar.
  save: async (noteId: string, outcome: SendOutcome, issueDate: Date, at: Date) => {
    if (outcome.kind === "failed") {
      await db.invoice.deleteMany({ where: { id: noteId, status: "ISSUING" } });
      return;
    }
    const data = outcome.kind === "issued"
      ? { billerId: outcome.cfe.billerId, error: null, issueDate, number: outcome.cfe.number, series: outcome.cfe.series, status: "ISSUED" as const }
      : toOutcomeUpdate(outcome, at);
    await db.invoice.update({ where: { id: noteId }, data });
  },
});

export type CreditNoteStore = ReturnType<typeof createCreditNoteStore>;
