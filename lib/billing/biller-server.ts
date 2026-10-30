import "server-only";

import { resolveBillerConfig } from "@/lib/billing/biller-config";
import { createBillerGet } from "@/lib/billing/biller-http";
import { createBillerReader } from "@/lib/billing/biller-read";
import { createInvoiceSyncStore } from "@/lib/billing/invoice-store";
import { syncBillerPeriod } from "@/lib/billing/invoice-sync-core";
import { db } from "@/lib/db";

// El cableado con el entorno y la base. Lo demás de lib/billing es puro (o
// recibe sus dependencias) y se prueba con check:billing.
export const getBillerConfig = () =>
  resolveBillerConfig({
    BILLER_ALLOW_LOCAL_PRODUCTION: process.env.BILLER_ALLOW_LOCAL_PRODUCTION,
    BILLER_BASE_URL: process.env.BILLER_BASE_URL,
    BILLER_SUCURSAL: process.env.BILLER_SUCURSAL,
    BILLER_TOKEN: process.env.BILLER_TOKEN,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });

export const getBillerReader = () => createBillerReader(createBillerGet(getBillerConfig()));

export const syncBillingPeriod = (period: Date) =>
  syncBillerPeriod(period, {
    now: new Date(),
    reader: getBillerReader(),
    store: createInvoiceSyncStore(db),
  });
