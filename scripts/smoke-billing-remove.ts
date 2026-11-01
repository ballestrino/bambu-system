import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";

import { billerInvoiceSchema } from "../lib/billing/biller-schemas";
import { parseBillingPeriod } from "../lib/billing/billing-month";
import { summarizeBillingMonth } from "../lib/billing/billing-summary";
import { claimBatchIssue } from "../lib/billing/issue-claim";
import { deleteDraftInvoice, setInvoiceArchived } from "../lib/billing/invoice-remove-store";
import { toBillerInvoiceRecord } from "../lib/billing/invoice-mapping";
import { createInvoiceSyncStore } from "../lib/billing/invoice-store";
import { eFacturaRow } from "./billing-fixtures";

// Smoke de la 47 contra la base de .env (sin Biller): en un mes sin datos
// (enero 2031) crea un borrador con dos facturas y una emitida, borra una del
// borrador (el "Emitir" que la vio antes se rechaza), prueba que una emitida
// no se borra y un updatedAt viejo tampoco, archiva la emitida, la
// "sincroniza" otra vez (sigue archivada y en el resumen) y la desarchiva.
// Borra todo lo que creó, también su auditoría.
// Uso: pnpm exec tsx scripts/smoke-billing-remove.ts
const db = new PrismaClient();
const period = parseBillingPeriod("2031-01")!;
const BILLER_ID = 990_000_047;
const created: string[] = [];

const main = async () => {
  console.log(`Base: ${new URL(process.env.DATABASE_URL ?? "postgres://sin-base").hostname}`);
  const used = await db.invoice.count({ where: { OR: [{ period }, { billerId: BILLER_ID }] } });
  assert.equal(used, 0, "enero 2031 ya tiene facturas: el smoke no toca datos ajenos");
  const admin = await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  assert.ok(admin, "Hace falta un admin");

  const batch = await db.invoiceBatch.create({ data: { createdById: admin.id, origin: "MANUAL", period, status: "DRAFT" } });
  const draft = (name: string, total: number) => ({
    batchId: batch.id, cfeType: 111, createdById: admin.id, internalNumber: `SMOKE47-${name}`, origin: "APP" as const,
    period, receiver: { razon_social: name }, selected: true, status: "DRAFT" as const, total,
  });
  const a = await db.invoice.create({ data: draft("A", 100) });
  const b = await db.invoice.create({ data: draft("B", 200) });
  const issued = await db.invoice.create({
    data: { billerId: BILLER_ID, cfeType: 111, issueDate: new Date("2031-01-05T00:00:00Z"), origin: "BILLER", period, status: "ACCEPTED", total: 300 },
  });
  created.push(a.id, b.id, issued.id);
  const opened = await db.invoiceBatch.findUniqueOrThrow({ where: { id: batch.id } });

  // Borrar A: sale del borrador y el lote cambia.
  const deleted = await deleteDraftInvoice(db, { invoiceId: a.id, updatedAt: a.updatedAt.toISOString() }, admin.id);
  assert.ok("ok" in deleted, JSON.stringify(deleted));
  assert.equal(await db.invoice.count({ where: { batchId: batch.id } }), 1);
  const touched = await db.invoiceBatch.findUniqueOrThrow({ where: { id: batch.id } });
  assert.notEqual(touched.updatedAt.toISOString(), opened.updatedAt.toISOString());
  console.log("Borrar A: ok, el lote cambió");

  // El "Emitir 2 · $ 300" abierto antes se rechaza.
  const claim = await claimBatchIssue(db, { batchId: batch.id, count: 2, total: 300, updatedAt: opened.updatedAt.toISOString() }, new Date());
  assert.deepEqual(claim, { error: "stale" });
  console.log("Emitir con el borrador viejo: stale");

  // Una emitida no se borra; un updatedAt viejo tampoco borra.
  assert.deepEqual(await deleteDraftInvoice(db, { invoiceId: issued.id, updatedAt: issued.updatedAt.toISOString() }, admin.id), { error: "issued" });
  assert.deepEqual(await deleteDraftInvoice(db, { invoiceId: b.id, updatedAt: opened.updatedAt.toISOString() }, admin.id), { error: "stale" });
  assert.equal(await db.invoice.count({ where: { id: { in: [issued.id, b.id] } } }), 2);
  console.log("Borrar una emitida: issued · updatedAt viejo: stale");

  // Archivar, sincronizar de nuevo (la misma fila de Biller) y el resumen.
  assert.deepEqual(await setInvoiceArchived(db, { archived: true, invoiceId: issued.id }, admin.id), { archived: true, changed: true, ok: true });
  const row = billerInvoiceSchema.parse({ ...eFacturaRow, estado: "Aceptado DGI", fecha_emision: "2031-01-05", fecha_vencimiento: null, id: BILLER_ID, numero_interno: null });
  assert.equal(await createInvoiceSyncStore(db).upsertBillerInvoice(toBillerInvoiceRecord(row), new Date()), "updated");
  const synced = await db.invoice.findUniqueOrThrow({ where: { id: issued.id } });
  assert.ok(synced.archivedAt && synced.archivedById === admin.id, "sigue archivada después de sincronizar");
  const month = await db.invoice.findMany({ where: { issueDate: { gte: period }, period, status: { not: "DRAFT" } } });
  assert.equal(summarizeBillingMonth(month).invoiceCount, 1);
  console.log(`Archivada, sincronizada y en el resumen: ${summarizeBillingMonth(month).invoicesTotal}`);

  assert.deepEqual(await setInvoiceArchived(db, { archived: false, invoiceId: issued.id }, admin.id), { archived: false, changed: true, ok: true });
  assert.equal((await db.invoice.findUniqueOrThrow({ where: { id: issued.id } })).archivedAt, null);
  const audits = await db.agentAuditEvent.findMany({ where: { entityId: { in: [a.id, issued.id] } }, select: { action: true } });
  assert.deepEqual(audits.map((audit) => audit.action).sort(), ["invoice.archive", "invoice.delete", "invoice.unarchive"]);
  console.log("Desarchivar: ok · auditoría:", audits.map((audit) => audit.action).join(", "));
};

const cleanup = async () => {
  const rows = await db.invoice.findMany({ where: { OR: [{ period }, { billerId: BILLER_ID }] }, select: { id: true } });
  const audits = await db.agentAuditEvent.deleteMany({ where: { entityType: "Invoice", entityId: { in: created } } });
  const invoices = await db.invoice.deleteMany({ where: { id: { in: rows.map((row) => row.id) } } });
  const batches = await db.invoiceBatch.deleteMany({ where: { period } });
  return { audits: audits.count, batches: batches.count, invoices: invoices.count };
};

main()
  .then(async () => console.log("Limpieza:", await cleanup()))
  .catch(async (error) => {
    console.error(error);
    console.log("Limpieza:", await cleanup());
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
