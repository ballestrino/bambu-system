import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { InvoiceBatchStatus, InvoiceStatus, PrismaClient } from "@prisma/client";

import { canArchiveInvoice, canDeleteDraftInvoice, getDeleteDraftError } from "../lib/billing/invoice-remove";
import { deleteDraftInvoice, setInvoiceArchived } from "../lib/billing/invoice-remove-store";
import { draftInvoiceDeleteSchema, invoiceArchiveSchema } from "../schemas/billing";

// Feature 47: borrar del borrador y archivar lo emitido (docs/billing.md).
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

// --- Reglas: solo se borra un DRAFT de un lote DRAFT; se archiva lo emitido.
const statuses: InvoiceStatus[] = ["DRAFT", "ISSUING", "ISSUED", "ACCEPTED", "REJECTED", "UNKNOWN"];
for (const status of statuses) {
  assert.equal(canDeleteDraftInvoice(status, "DRAFT"), status === "DRAFT", `delete ${status}`);
  assert.equal(canArchiveInvoice(status), ["ISSUED", "ACCEPTED", "REJECTED"].includes(status), `archive ${status}`);
}
assert.equal(canDeleteDraftInvoice("DRAFT", "ISSUING"), false);
assert.equal(canDeleteDraftInvoice("DRAFT", null), false);
assert.equal(getDeleteDraftError(null), "not_found");
assert.equal(getDeleteDraftError({ batchStatus: "DONE", status: "ACCEPTED" }), "issued");
assert.equal(getDeleteDraftError({ batchStatus: "DRAFT", status: "REJECTED" }), "issued");
assert.equal(getDeleteDraftError({ batchStatus: "DRAFT", status: "UNKNOWN" }), "issuing");
assert.equal(getDeleteDraftError({ batchStatus: "ISSUING", status: "DRAFT" }), "issuing");
assert.equal(getDeleteDraftError({ batchStatus: null, status: "DRAFT" }), "not_draft");
assert.equal(getDeleteDraftError({ batchStatus: "DRAFT", status: "DRAFT" }), null);
assert.equal(draftInvoiceDeleteSchema.safeParse({ invoiceId: "a", updatedAt: "ayer" }).success, false);
assert.equal(invoiceArchiveSchema.safeParse({ invoiceId: "a" }).success, false);

// --- Un Prisma de mentira: lo que el store lee y escribe en la transacción.
type Row = { batchStatus: InvoiceBatchStatus | null; status: InvoiceStatus; updatedAt: Date; archivedAt?: Date | null };
const fakeDb = (row: Row | null) => {
  const calls: string[] = [];
  const tx = {
    $executeRaw: () => (calls.push("lock"), Promise.resolve(1)),
    agentAuditEvent: { create: ({ data }: { data: { action: string } }) => (calls.push(`audit:${data.action}`), Promise.resolve({})) },
    invoice: {
      findUnique: () =>
        Promise.resolve(
          row && {
            ...row, archivedAt: row.archivedAt ?? null, billerId: 7, cfeType: 111, currency: "UYU", internalNumber: "BAMBU-x",
            number: 12, receiver: null, series: "A", sourceInvoiceId: null, total: { toString: () => "14640" },
            batch: row.batchStatus ? { id: "b1", period: new Date("2026-11-01T00:00:00Z"), status: row.batchStatus } : null,
          }
        ),
      deleteMany: ({ where }: { where: { status: string } }) => {
        calls.push(`delete:${where.status}`);
        return Promise.resolve({ count: row?.status === where.status ? 1 : 0 });
      },
      updateMany: ({ where }: { where: { archivedAt: unknown } }) => {
        calls.push("archive");
        const isArchived = Boolean(row?.archivedAt);
        return Promise.resolve({ count: (where.archivedAt === null) !== isArchived ? 1 : 0 });
      },
    },
    invoiceBatch: { update: () => (calls.push("batch-touch"), Promise.resolve({})) },
  };
  const db = { $transaction: (fn: (client: typeof tx) => unknown) => fn(tx) } as unknown as PrismaClient;
  return { calls, db };
};

const seen = new Date("2026-11-01T12:00:00.000Z");
export const billingRemoveChecks = (async () => {
  // Una emitida nunca se borra por la acción, aunque la pida quien sea.
  for (const status of ["ISSUED", "ACCEPTED", "REJECTED", "ISSUING", "UNKNOWN"] as const) {
    const { calls, db } = fakeDb({ batchStatus: "DRAFT", status, updatedAt: seen });
    const result = await deleteDraftInvoice(db, { invoiceId: "i1", updatedAt: seen.toISOString() }, "u1");
    assert.ok("error" in result && result.error !== "stale", `${status} is rejected`);
    assert.ok(!calls.some((call) => call.startsWith("delete") || call.startsWith("audit")), `${status} is not deleted`);
  }
  const issuing = fakeDb({ batchStatus: "ISSUING", status: "DRAFT", updatedAt: seen });
  assert.deepEqual(await deleteDraftInvoice(issuing.db, { invoiceId: "i1", updatedAt: seen.toISOString() }, "u1"), { error: "issuing" });

  // Compare-and-set: un updatedAt viejo no borra.
  const stale = fakeDb({ batchStatus: "DRAFT", status: "DRAFT", updatedAt: seen });
  assert.deepEqual(await deleteDraftInvoice(stale.db, { invoiceId: "i1", updatedAt: "2026-11-01T11:00:00.000Z" }, "u1"), { error: "stale" });
  assert.ok(!stale.calls.includes("delete:DRAFT"));

  // Un DRAFT: el lock del mes y del lote, borra solo DRAFT, mueve el lote y audita.
  const ok = fakeDb({ batchStatus: "DRAFT", status: "DRAFT", updatedAt: seen });
  const deleted = await deleteDraftInvoice(ok.db, { invoiceId: "i1", updatedAt: seen.toISOString() }, "u1");
  assert.ok("ok" in deleted);
  assert.deepEqual(ok.calls, ["lock", "lock", "delete:DRAFT", "batch-touch", "audit:invoice.delete"]);

  // Archivar: solo lo emitido; repetirlo no cambia ni audita de nuevo.
  const draft = fakeDb({ batchStatus: "DRAFT", status: "DRAFT", updatedAt: seen });
  assert.deepEqual(await setInvoiceArchived(draft.db, { archived: true, invoiceId: "i1" }, "u1"), { error: "not_archivable" });
  const rejected = fakeDb({ batchStatus: null, status: "REJECTED", updatedAt: seen });
  assert.deepEqual(await setInvoiceArchived(rejected.db, { archived: true, invoiceId: "i1" }, "u1"), { archived: true, changed: true, ok: true });
  assert.deepEqual(rejected.calls, ["archive", "audit:invoice.archive"]);
  const again = fakeDb({ archivedAt: seen, batchStatus: null, status: "ACCEPTED", updatedAt: seen });
  assert.deepEqual(await setInvoiceArchived(again.db, { archived: true, invoiceId: "i1" }, "u1"), { archived: true, changed: false, ok: true });
  assert.deepEqual(again.calls, ["archive"]);
  const restore = fakeDb({ archivedAt: seen, batchStatus: null, status: "ACCEPTED", updatedAt: seen });
  assert.deepEqual(await setInvoiceArchived(restore.db, { archived: false, invoiceId: "i1" }, "u1"), { archived: false, changed: true, ok: true });
  assert.deepEqual(restore.calls, ["archive", "audit:invoice.unarchive"]);

  // --- Fuente: la sincronización no toca archivedAt; lo archivado sale de
  // "Emitidas" y del borrador pero el resumen cuenta todo el mes.
  assert.doesNotMatch(read("lib/billing/invoice-store.ts"), /archived/);
  assert.doesNotMatch(read("lib/billing/invoice-sync-core.ts"), /archived/);
  const month = read("data/billing/month.ts");
  assert.match(month, /issued: current\.filter\(\(invoice\) => !invoice\.archivedAt\)/);
  assert.match(month, /current: summarizeBillingMonth\(current\)/);
  assert.match(month, /\.filter\(\(invoice\) => !invoice\.archivedAt\)\s+\.map\(\(invoice\) => \{/);
  // El borrado toma el lock del mes y el del lote antes de releer y compara updatedAt.
  assert.match(
    read("lib/billing/invoice-remove-store.ts"),
    /lockBillingPeriod\(tx, seen\.batch\.period\);\s+await lockBatch\(tx, seen\.batch\.id\);[\s\S]*deleteMany\(\{\s+where: \{ id: input\.invoiceId, status: "DRAFT", updatedAt: invoice\.updatedAt \}/
  );
})();
