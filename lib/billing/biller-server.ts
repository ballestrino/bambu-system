import "server-only";

import { isBillerIssueEnabled, resolveBillerConfig } from "@/lib/billing/biller-config";
import { BillerError, describeBillerError } from "@/lib/billing/biller-errors";
import { createBillerGet, createBillerGetText } from "@/lib/billing/biller-http";
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
    BILLER_CAE_CAUSAL: process.env.BILLER_CAE_CAUSAL,
    BILLER_CAE_ESPECIAL: process.env.BILLER_CAE_ESPECIAL,
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

// El PDF de un comprobante: Biller lo devuelve en base64 (a veces como string JSON).
export const getBillerInvoicePdf = async (billerId: number) => {
  const text = (await createBillerGetText(getBillerConfig())("/v2/comprobantes/pdf", { id: billerId })).trim();
  const base64 = text.startsWith('"') ? String(JSON.parse(text)) : text;
  const pdf = Buffer.from(base64, "base64");
  if (pdf.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new BillerError("invalid_response", "Biller no devolvió un PDF");
  }
  return pdf;
};

export const isIssueEnabled = () => isBillerIssueEnabled({ BILLER_ISSUE_ENABLED: process.env.BILLER_ISSUE_ENABLED });

// Para la página: si Biller está configurado, si es test o producción y si
// se puede emitir (BILLER_ISSUE_ENABLED).
export const getBillerStatus = () => {
  try {
    return { configured: true, environment: getBillerConfig().environment, issueEnabled: isIssueEnabled(), message: null };
  } catch (error) {
    return { configured: false, environment: null, issueEnabled: false, message: describeBillerError(error) };
  }
};
