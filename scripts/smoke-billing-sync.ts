import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { resolveBillerConfig } from "../lib/billing/biller-config";
import { createBillerGet } from "../lib/billing/biller-http";
import { createBillerReader } from "../lib/billing/biller-read";
import { addBillingMonths, getIssueDateRange, parseBillingPeriod } from "../lib/billing/billing-month";
import { summarizeBillingMonth } from "../lib/billing/billing-summary";
import { createInvoiceSyncStore } from "../lib/billing/invoice-store";
import { syncBillerPeriod } from "../lib/billing/invoice-sync-core";

// Smoke de la 39 contra Biller test y la base de .env: sincroniza un mes dos
// veces y muestra el resumen. Solo lee de Biller; escribe la copia local.
// Uso: pnpm exec tsx scripts/smoke-billing-sync.ts 2026-10
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
  for (const run of [1, 2]) {
    const result = await syncBillerPeriod(period, { ...deps, now: new Date() });
    console.log(`Sincronización ${run}:`, result);
  }

  const invoices = await db.invoice.findMany({
    where: { issueDate: { gte: addBillingMonths(period, -1), lt: addBillingMonths(period, 1) } },
    select: { billerId: true, cfeType: true, currency: true, issueDate: true, status: true, total: true, billerStatus: true, referenceIds: true, items: true },
    orderBy: { billerId: "asc" },
  });
  const { gte } = getIssueDateRange(period);
  const current = invoices.filter((invoice) => invoice.issueDate && invoice.issueDate >= gte);
  console.table(current.map(({ items, ...invoice }) => ({ ...invoice, total: invoice.total.toString(), items: Array.isArray(items) ? items.length : null })));
  console.log("Resumen del mes:", summarizeBillingMonth(current));
  console.log("Filas por billerId repetidas:", current.length - new Set(current.map((invoice) => invoice.billerId)).size);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
