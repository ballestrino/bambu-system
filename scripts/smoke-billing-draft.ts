import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { resolveBillerConfig } from "../lib/billing/biller-config";
import { createBillerGet } from "../lib/billing/biller-http";
import { createBillerReader } from "../lib/billing/biller-read";
import { addBillingMonths, parseBillingPeriod } from "../lib/billing/billing-month";
import { createRepeatDraft } from "../lib/billing/draft-store";
import { updateDraftInvoice } from "../lib/billing/draft-update";
import { readStoredItems } from "../lib/billing/invoice-json";
import { createInvoiceSyncStore } from "../lib/billing/invoice-store";
import { syncBillerPeriod } from "../lib/billing/invoice-sync-core";

// Smoke de la 40 contra Biller test y la base de .env: sincroniza, repite el
// mes anterior dos veces a la vez (un solo borrador), edita una factura y
// prueba que un updatedAt viejo se rechace. Solo lee de Biller.
// Uso: pnpm exec tsx scripts/smoke-billing-draft.ts 2026-11 [--keep]
const db = new PrismaClient();

const main = async () => {
  const period = parseBillingPeriod(process.argv[2] ?? "");
  if (!period) throw new Error("Pasá el mes como AAAA-MM");
  const config = resolveBillerConfig({
    BILLER_BASE_URL: process.env.BILLER_BASE_URL,
    BILLER_SUCURSAL: process.env.BILLER_SUCURSAL,
    BILLER_TOKEN: process.env.BILLER_TOKEN,
  });
  if (config.environment !== "test") throw new Error("El smoke corre solo contra Biller test");
  console.log(`Base: ${new URL(process.env.DATABASE_URL ?? "postgres://sin-base").hostname}`);

  const deps = { reader: createBillerReader(createBillerGet(config)), store: createInvoiceSyncStore(db) };
  for (const month of [addBillingMonths(period, -1), period]) {
    console.log("Sincronización:", await syncBillerPeriod(month, { ...deps, now: new Date() }));
  }

  const admin = await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) throw new Error("No hay un admin en la base");

  const results = await Promise.all([1, 2, 3].map(() => createRepeatDraft(db, { period, userId: admin.id })));
  console.log("Tres repeticiones a la vez:", results);
  const batchIds = new Set(results.flatMap((result) => ("batchId" in result ? [result.batchId] : [])));
  if (batchIds.size !== 1) throw new Error("Se esperaba un único borrador");
  const [batchId] = batchIds;
  const openBatches = await db.invoiceBatch.count({ where: { period, status: { in: ["DRAFT", "ISSUING"] } } });
  console.log("Borradores abiertos del mes:", openBatches);

  const rows = await db.invoice.findMany({
    where: { batchId },
    select: { id: true, cfeType: true, internalNumber: true, items: true, selected: true, total: true, updatedAt: true, adenda: true, paymentForm: true },
  });
  console.table(rows.map((row) => ({
    cfeType: row.cfeType, internalNumber: row.internalNumber, selected: row.selected, total: row.total.toString(),
    paymentForm: row.paymentForm, adenda: row.adenda, concepto: readStoredItems(row.items)?.[0]?.concepto ?? null,
  })));

  const target = rows.find((row) => row.selected && readStoredItems(row.items)?.length);
  if (target) {
    const edit = { invoiceId: target.id, updatedAt: target.updatedAt.toISOString() };
    const first = await updateDraftInvoice(db, { ...edit, lines: [{ index: 0, precio: 12500, concepto: "Limpieza de oficina - noviembre 2026 (ajuste)" }] });
    console.log("Cambio de precio y detalle:", first);
    console.log("El mismo cambio con el updatedAt viejo:", await updateDraftInvoice(db, { ...edit, selected: false }));
    const after = await db.invoice.findUnique({ where: { id: target.id }, select: { items: true, total: true } });
    console.log("Releída:", { total: after?.total.toString(), items: readStoredItems(after?.items) });
  }

  if (!process.argv.includes("--keep")) {
    await db.invoiceBatch.delete({ where: { id: batchId } });
    console.log("Borrador de prueba borrado (con --keep queda)");
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
