import "server-only";

import { getCurrentMonthKey } from "@/lib/agent/month";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { describeBillerError } from "@/lib/billing/biller-errors";
import { syncBillingPeriod } from "@/lib/billing/biller-server";
import { parseBillingPeriod } from "@/lib/billing/billing-month";

// El mes de una tool de facturación: el pedido, el que se mira en Facturación
// o el actual.
export const resolveBillingMonth = (ctx: AgentToolContext, month: string | null) =>
  month ?? ctx.billingMonth ?? getCurrentMonthKey();

// Como la página: a lo sumo una copia de Biller por mes cada 2 minutos (por
// instancia). Si Biller no responde, se lee la copia local y se avisa.
const SYNC_TTL_MS = 2 * 60_000;
const lastSync = new Map<string, number>();

export const syncBillingMonthOnce = async (monthKey: string) => {
  const period = parseBillingPeriod(monthKey);
  if (!period) return "Mes inválido";
  const last = lastSync.get(monthKey);
  if (last && Date.now() - last < SYNC_TTL_MS) return null;
  try {
    await syncBillingPeriod(period);
    lastSync.set(monthKey, Date.now());
    return null;
  } catch (error) {
    return `No se pudo copiar de Biller (${describeBillerError(error)}): los datos son de la última copia.`;
  }
};
