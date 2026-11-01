import { Prisma, type InvoiceStatus, type PrismaClient } from "@prisma/client";

import { addBillingMonths, getBillingPeriodKey, getIssueDateRange } from "@/lib/billing/billing-month";
import { buildRepeatDraft, isRepeatSource, type RepeatContext, type RepeatSource } from "@/lib/billing/draft-repeat";
import { linkCreditNotes } from "@/lib/billing/credit-note-links";
import { readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { classifyCfe } from "@/lib/billing/invoice-mapping";

type Db = Prisma.TransactionClient;

const VALID_STATUSES: InvoiceStatus[] = ["ISSUING", "ISSUED", "ACCEPTED", "UNKNOWN"];
export const OPEN_BATCH_STATUSES = ["DRAFT", "ISSUING"] as const;

const sourceSelect = {
  adenda: true,
  billerId: true,
  cfeType: true,
  currency: true,
  dueDate: true,
  id: true,
  issueDate: true,
  items: true,
  paymentForm: true,
  receiver: true,
  receiverDocument: true,
  status: true,
  total: true,
} satisfies Prisma.InvoiceSelect;

type SourceRow = Prisma.InvoiceGetPayload<{ select: typeof sourceSelect }>;

export const toRepeatSource = (row: SourceRow): RepeatSource => ({
  ...row,
  items: readStoredItems(row.items),
  receiver: readStoredReceiver(row.receiver),
});

// Lo emitido el mes anterior a `period` y lo que hace falta para saber qué
// arranca desmarcado: las notas de crédito que lo anulan y a quién ya se le
// facturó en `period` (sin contar las facturas del borrador `excludeBatchId`).
export const loadRepeatInputs = async (db: Db, period: Date, excludeBatchId?: string) => {
  const from = addBillingMonths(period, -1);
  const rows = await db.invoice.findMany({
    where: { issueDate: getIssueDateRange(from), status: { in: VALID_STATUSES } },
    select: sourceSelect,
    orderBy: [{ issueDate: "asc" }, { number: "asc" }],
  });
  const sources = rows.map(toRepeatSource).filter(isRepeatSource);
  const billerIds = sources.flatMap((source) => (source.billerId === null ? [] : [source.billerId]));

  const [notes, billed] = await Promise.all([
    billerIds.length
      ? db.invoice.findMany({
          where: { referenceIds: { hasSome: billerIds }, status: { in: VALID_STATUSES } },
          select: { cfeType: true, id: true, issueDate: true, number: true, referenceIds: true, series: true, status: true, total: true },
        })
      : Promise.resolve([]),
    db.invoice.findMany({
      where: {
        issueDate: getIssueDateRange(period),
        receiverDocument: { not: null },
        status: { in: VALID_STATUSES },
        ...(excludeBatchId ? { OR: [{ batchId: null }, { batchId: { not: excludeBatchId } }] } : {}),
      },
      select: { cfeType: true, issueDate: true, receiverDocument: true },
      orderBy: { issueDate: "asc" },
    }),
  ]);

  // Solo una nota por el total la deja afuera: con una parcial se repite igual.
  const credits = linkCreditNotes(
    rows.map((row) => ({ billerId: row.billerId, total: Number(row.total) })),
    notes.map((note) => ({ ...note, total: Number(note.total) }))
  );
  const annulledBy = new Map<number, Date>();
  for (const [billerId, credit] of credits) {
    if (credit.fully && credit.note?.issueDate) annulledBy.set(billerId, credit.note.issueDate);
  }
  const billedInTarget = new Map<string, Date>();
  for (const invoice of billed) {
    if (classifyCfe(invoice.cfeType) !== "invoice" || !invoice.issueDate || !invoice.receiverDocument) continue;
    if (!billedInTarget.has(invoice.receiverDocument)) billedInTarget.set(invoice.receiverDocument, invoice.issueDate);
  }

  const context: RepeatContext = { annulledBy, billedInTarget, from, to: period };
  return { context, sources };
};

const json = (value: unknown) => (value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue));

export type CreateRepeatDraftResult =
  | { batchId: string; created: boolean }
  | { error: "no_sources" };

// Serializa lo que crea o cambia el borrador de un mes (repetir, el agente).
export const lockBillingPeriod = (tx: Db, period: Date) =>
  tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`invoice-batch:${getBillingPeriodKey(period)}`}))`;

// Crea el borrador de `period` repitiendo el mes anterior, o devuelve el que
// ya está abierto. El lock de la transacción hace que dos pedidos a la vez (dos
// pestañas, un doble clic, el agente) terminen en un único borrador. Uno que
// arma el agente queda con origin AGENT y su conversación.
type RepeatDraftInput = { conversationId?: string | null; origin?: "REPEAT" | "AGENT"; period: Date; userId: string };

export const createRepeatDraft = (db: PrismaClient, { conversationId = null, origin = "REPEAT", period, userId }: RepeatDraftInput) =>
  db.$transaction<CreateRepeatDraftResult>(
    async (tx) => {
      await lockBillingPeriod(tx, period);

      const open = await tx.invoiceBatch.findFirst({
        where: { period, status: { in: [...OPEN_BATCH_STATUSES] } },
        select: { id: true },
      });
      if (open) return { batchId: open.id, created: false };

      const { context, sources } = await loadRepeatInputs(tx, period);
      const repeated = await tx.invoice.findMany({
        where: { period, sourceInvoiceId: { in: sources.map((source) => source.id) } },
        select: { sourceInvoiceId: true },
      });
      const repeatedIds = new Set(repeated.map((invoice) => invoice.sourceInvoiceId));
      const rows = buildRepeatDraft(sources.filter((source) => !repeatedIds.has(source.id)), context);
      if (!rows.length) return { error: "no_sources" };

      const batch = await tx.invoiceBatch.create({
        data: { conversationId, createdById: userId, origin, period, status: "DRAFT" },
        select: { id: true },
      });
      await tx.invoice.createMany({
        data: rows.map((row) => ({
          adenda: row.adenda,
          batchId: batch.id,
          cfeType: row.cfeType,
          createdById: userId,
          currency: row.currency,
          items: json(row.items),
          origin: "APP" as const,
          paymentForm: row.paymentForm,
          period,
          receiver: json(row.receiver),
          receiverDocument: row.receiverDocument,
          selected: row.selected,
          sourceInvoiceId: row.sourceInvoiceId,
          status: "DRAFT" as const,
          total: row.total,
        })),
      });
      // numero_interno de cada factura: Biller lo rechaza repetido (regla 3).
      await tx.$executeRaw`UPDATE "Invoice" SET "internalNumber" = 'BAMBU-' || "id" WHERE "batchId" = ${batch.id} AND "internalNumber" IS NULL`;
      return { batchId: batch.id, created: true };
    },
    { timeout: 20_000 }
  );
