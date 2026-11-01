import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { resolveBillerConfig } from "../lib/billing/biller-config";
import { createBillerGet } from "../lib/billing/biller-http";
import { createBillerIssuer } from "../lib/billing/biller-issue";
import { createBillerReader } from "../lib/billing/biller-read";
import { addBillingMonths, getBillingPeriodKey, getCurrentBillingPeriod, getLookupCreationWindow } from "../lib/billing/billing-month";
import { createRepeatDraft } from "../lib/billing/draft-store";
import { updateDraftInvoice } from "../lib/billing/draft-update";
import { readStoredReceiver } from "../lib/billing/invoice-json";
import { createInvoiceSyncStore } from "../lib/billing/invoice-store";
import { syncBillerPeriod } from "../lib/billing/invoice-sync-core";
import { claimBatchIssue } from "../lib/billing/issue-claim";
import { getIssueDay } from "../lib/billing/issue-payload";
import { runBatchIssue } from "../lib/billing/issue-run";
import { createIssueRunStore } from "../lib/billing/issue-store";
import { emptyNewInvoiceItem, newInvoiceDefaults, type NewInvoiceForm } from "../lib/billing/new-invoice";
import { createNewInvoiceRunStore, runNewInvoiceIssue } from "../lib/billing/new-invoice-run";
import { claimNewInvoiceIssue, saveNewInvoiceDraft } from "../lib/billing/new-invoice-store";

// Smoke de la 45 contra Biller test y la base de DATABASE_URL: una e-Factura a
// crédito con orden de compra y email (doble clic y reintento sin duplicar),
// un e-Ticket a consumidor final y otro con CI, y una factura guardada en el
// borrador del mes siguiente (que no tiene borrador), repetir que lo completa
// y emitir solo esa con el lote. Emite en Biller test.
// Uso: pnpm exec tsx scripts/smoke-billing-new-invoice.ts
const db = new PrismaClient();
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const config = resolveBillerConfig({ BILLER_BASE_URL: process.env.BILLER_BASE_URL, BILLER_SUCURSAL: process.env.BILLER_SUCURSAL, BILLER_TOKEN: process.env.BILLER_TOKEN });
if (config.environment !== "test") throw new Error("El smoke corre solo contra Biller test");
const reader = createBillerReader(createBillerGet(config));
const deps = {
  findByInternalNumber: (internalNumber: string) => reader.findByInternalNumber(internalNumber, getLookupCreationWindow(new Date())),
  issuer: createBillerIssuer(config), now: () => new Date(), sleep,
};
const today = getIssueDay(new Date()).toISOString().slice(0, 10);
const requestId = () => crypto.randomUUID().replace(/-/g, "");
const sync = (period: Date) => syncBillerPeriod(period, { now: new Date(), reader, store: createInvoiceSyncStore(db) });
const item = (concepto: string, precio: string) => ({ ...emptyNewInvoiceItem(3), concepto, precio });

const issueNow = async (userId: string, id: string, form: NewInvoiceForm) => {
  const claim = await claimNewInvoiceIssue(db, { form, month: today.slice(0, 7), requestId: id }, userId, new Date(), today);
  if (claim.kind !== "claimed") return claim;
  return runNewInvoiceIssue(claim.invoiceId, { ...deps, store: createNewInvoiceRunStore(db) });
};

const main = async () => {
  console.log(`Base: ${new URL(process.env.DATABASE_URL ?? "postgres://sin-base").hostname} · hoy ${today}`);
  const current = getCurrentBillingPeriod(new Date());
  await sync(addBillingMonths(current, -1));
  await sync(current);
  const admin = await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) throw new Error("No hay un admin en la base");
  const last = await db.invoice.findFirst({ where: { cfeType: 111, receiver: { not: undefined }, status: { not: "DRAFT" } }, orderBy: { issueDate: "desc" }, select: { receiver: true } });
  const receiver = readStoredReceiver(last?.receiver);
  if (!receiver?.documento) throw new Error("No hay una e-Factura con RUT para tomar el cliente");
  const base = newInvoiceDefaults(today, 3);
  const company = { ...base, address: receiver.sucursal.direccion ?? "", city: receiver.sucursal.ciudad ?? "", department: receiver.sucursal.departamento ?? "Montevideo",
    document: receiver.documento, name: receiver.razon_social ?? "", tradeName: receiver.nombre_fantasia ?? "" };

  // e-Factura a crédito: dos clics a la vez y un tercero después.
  const efac = requestId();
  const efacForm = { ...company, dueDate: new Date(Date.parse(`${today}T00:00:00Z`) + 30 * 864e5).toISOString().slice(0, 10), emails: ["smoke-bambu@example.com"],
    items: [item("Limpieza de oficina noviembre 2026", "10.000"), { ...item("Productos", "1500"), cantidad: "2", unidad: "u" }], paymentForm: 2, purchaseOrder: "OC-SMOKE-45" };
  console.log("Doble clic:", await Promise.all([1, 2].map(() => issueNow(admin.id, efac, efacForm))));
  console.log("Emitir de nuevo el mismo pedido:", await issueNow(admin.id, efac, efacForm));
  console.log("e-Ticket a consumidor final:", await issueNow(admin.id, requestId(), { ...base, cfeType: 101, consumer: true, document: "", items: [item("Limpieza puntual", "2.500")] }));
  console.log("e-Ticket con CI:", await issueNow(admin.id, requestId(), { ...base, cfeType: 101, documentType: 3, document: "1.234.567-2", name: "Ana Pérez", items: [item("Limpieza de casa", "3000")] }));

  // Guardar en el borrador del mes siguiente, que no tiene borrador.
  const next = addBillingMonths(current, 1);
  const month = getBillingPeriodKey(next);
  const draftId = requestId();
  const draftForm = { ...company, dueDate: new Date(Date.parse(`${today}T00:00:00Z`) + 15 * 864e5).toISOString().slice(0, 10), items: [item("Limpieza extra", "4000")], paymentForm: 2, purchaseOrder: "OC-DRAFT-45" };
  console.log("Guardar en el borrador:", await saveNewInvoiceDraft(db, { form: draftForm, month, requestId: draftId }, admin.id, today));
  console.log("Guardar otra vez:", await saveNewInvoiceDraft(db, { form: draftForm, month, requestId: draftId }, admin.id, today));
  const batch = await db.invoiceBatch.findFirstOrThrow({ where: { period: next }, orderBy: { createdAt: "desc" }, select: { id: true, origin: true } });
  console.log("Lote:", batch.origin, "· filas:", await db.invoice.count({ where: { batchId: batch.id } }));
  console.log("Repetir el mes:", await createRepeatDraft(db, { period: next, userId: admin.id }), "· filas:", await db.invoice.count({ where: { batchId: batch.id } }));
  console.log("Repetir otra vez:", await createRepeatDraft(db, { period: next, userId: admin.id }), "· filas:", await db.invoice.count({ where: { batchId: batch.id } }));
  for (const row of await db.invoice.findMany({ where: { batchId: batch.id, id: { not: draftId }, selected: true }, select: { id: true, updatedAt: true } })) {
    await updateDraftInvoice(db, { invoiceId: row.id, selected: false, updatedAt: row.updatedAt.toISOString() });
  }
  const [fresh, mine] = await Promise.all([
    db.invoiceBatch.findUniqueOrThrow({ where: { id: batch.id }, select: { updatedAt: true } }),
    db.invoice.findUniqueOrThrow({ where: { id: draftId }, select: { total: true } }),
  ]);
  console.log("Emitir el lote:", await claimBatchIssue(db, { batchId: batch.id, count: 1, total: Number(mine.total), updatedAt: fresh.updatedAt.toISOString() }, new Date()));
  console.log("Emisión:", await runBatchIssue(batch.id, { ...deps, store: createIssueRunStore(db) }));

  const ours = await db.invoice.findMany({ where: { internalNumber: { startsWith: "BAMBU-" }, createdAt: { gte: new Date(Date.now() - 30 * 60_000) }, billerId: { not: null } }, select: { billerId: true } });
  let details = await Promise.all(ours.map((row) => reader.getInvoiceDetail(row.billerId!)));
  for (let round = 0; round < 24 && details.some((d) => /pendiente/i.test(d.estado ?? "")); round += 1) {
    await sleep(20_000);
    details = await Promise.all(ours.map((row) => reader.getInvoiceDetail(row.billerId!)));
  }
  console.table(details.map((d) => ({ cfe: `${d.tipo_comprobante} ${d.serie} ${d.numero}`, total: d.total, estado: d.estado, vence: d.fecha_vencimiento, compra: d.numero_compra, cliente: d.cliente?.razon_social ?? d.cliente?.nombre_fantasia ?? "-" })));
  console.log("Con ese número interno en Biller:", (await reader.listInvoices(getLookupCreationWindow(new Date()))).filter((row) => row.numero_interno === `BAMBU-${efac}`).length);
};

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
