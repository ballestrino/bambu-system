import type { PrismaClient } from "@prisma/client";

import type { IssueBatchRequest } from "@/schemas/billing";

// Sin novedades del emisor en este tiempo, una emisión se da por cortada y se
// puede continuar. Una factura tarda a lo sumo ~100 s (timeouts y búsquedas).
export const ISSUE_STALE_MS = 3 * 60_000;

const round = (amount: number) => Math.round(amount * 100) / 100;

export type ClaimResult =
  | { count: number; ok: true }
  | { error: "not_found" | "not_draft" | "issuing" | "stale" | "empty" };

// También lo toma el agente antes de cambiar el borrador: un cambio y "Emitir"
// no se cruzan.
export const lockBatch = (tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0], batchId: string) =>
  tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`invoice-batch-issue:${batchId}`}))`;

// "Emitir N" (regla 2): se emite lo que se vio. Con el lock del lote, compara
// updatedAt, la cantidad y el total marcados con lo que mandó el diálogo y
// pasa esas facturas y el lote a ISSUING. Un doble clic o una segunda pestaña
// encuentran el lote en ISSUING y no emiten nada.
export const claimBatchIssue = (db: PrismaClient, request: IssueBatchRequest, now: Date) =>
  db.$transaction<ClaimResult>(async (tx) => {
    await lockBatch(tx, request.batchId);
    const batch = await tx.invoiceBatch.findUnique({
      where: { id: request.batchId },
      select: { status: true, updatedAt: true },
    });
    if (!batch) return { error: "not_found" };
    if (batch.status === "ISSUING") return { error: "issuing" };
    if (batch.status !== "DRAFT") return { error: "not_draft" };
    if (batch.updatedAt.toISOString() !== request.updatedAt) return { error: "stale" };

    const marked = await tx.invoice.findMany({
      where: { batchId: request.batchId, selected: true, status: "DRAFT" },
      select: { id: true, total: true },
    });
    const total = round(marked.reduce((sum, invoice) => sum + Number(invoice.total), 0));
    if (marked.length !== request.count || Math.abs(total - request.total) > 0.005) return { error: "stale" };
    if (!marked.length) return { error: "empty" };

    await tx.invoice.updateMany({
      where: { id: { in: marked.map((invoice) => invoice.id) }, status: "DRAFT" },
      data: { error: null, status: "ISSUING" },
    });
    await tx.invoiceBatch.update({ where: { id: request.batchId }, data: { status: "ISSUING", updatedAt: now } });
    return { count: marked.length, ok: true };
  });

export type ResumeResult = { count: number; ok: true } | { error: "not_found" | "running" | "nothing" };

// "Continuar" o "Reintentar": lo que quedó en ISSUING (una emisión cortada) y
// lo que quedó UNKNOWN vuelve a la cola. Mandarlo de nuevo no duplica: Biller
// rechaza el numero_interno repetido y se toma el que ya existe.
export const claimBatchResume = (db: PrismaClient, batchId: string, now: Date) =>
  db.$transaction<ResumeResult>(async (tx) => {
    await lockBatch(tx, batchId);
    const batch = await tx.invoiceBatch.findUnique({ where: { id: batchId }, select: { status: true, updatedAt: true } });
    if (!batch) return { error: "not_found" };
    if (batch.status === "ISSUING" && now.getTime() - batch.updatedAt.getTime() < ISSUE_STALE_MS) {
      return { error: "running" };
    }

    await tx.invoice.updateMany({ where: { batchId, status: "UNKNOWN" }, data: { status: "ISSUING" } });
    const count = await tx.invoice.count({ where: { batchId, status: "ISSUING" } });
    if (!count) return { error: "nothing" };
    await tx.invoiceBatch.update({ where: { id: batchId }, data: { status: "ISSUING", updatedAt: now } });
    return { count, ok: true };
  });
