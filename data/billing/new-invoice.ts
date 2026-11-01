import "server-only";

import { getBillerStatus } from "@/lib/billing/biller-server";
import { getBillingMonthName } from "@/lib/billing/billing-month-text";
import { getBillingPeriodKey, getCurrentBillingPeriod, parseBillingPeriod } from "@/lib/billing/billing-month";
import { getLastIndicator } from "@/lib/billing/invoice-defaults";
import { getIssueDay } from "@/lib/billing/issue-payload";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

// Tasa básica: el indicador si todavía no hay ninguna factura emitida.
const FALLBACK_INDICATOR = 3;

// La página "Nueva factura" (feature 45): el mes del borrador donde se puede
// guardar (el del selector), si ese borrador se está emitiendo, el día de
// hoy, el indicador de IVA por defecto y el ambiente de Biller.
export const getNewInvoiceView = async (monthKey: string | undefined) => {
  await requireAdminSession();
  const now = new Date();
  const period = (monthKey ? parseBillingPeriod(monthKey) : null) ?? getCurrentBillingPeriod(now);
  const [indicator, draft] = await Promise.all([
    getLastIndicator(db),
    db.invoiceBatch.findFirst({ where: { period }, orderBy: { createdAt: "desc" }, select: { status: true } }),
  ]);
  const monthName = getBillingMonthName(period);
  return {
    biller: getBillerStatus(),
    draftIssuing: draft?.status === "ISSUING",
    hasDraft: draft?.status === "DRAFT",
    indicator: indicator ?? FALLBACK_INDICATOR,
    issueDay: getIssueDay(now).toISOString().slice(0, 10),
    month: getBillingPeriodKey(period),
    monthLabel: `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${period.getUTCFullYear()}`,
    monthName,
  };
};

export type NewInvoiceView = Awaited<ReturnType<typeof getNewInvoiceView>>;
