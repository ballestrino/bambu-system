import "server-only";

import { addBillingMonths, getBillingPeriodKey, parseBillingPeriod } from "@/lib/billing/billing-month";
import { compareBillingMonths, summarizeBillingMonth } from "@/lib/billing/billing-summary";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import { billingPeriodSchema } from "@/schemas/billing";

// Resumen de un mes contra el anterior, desde la copia local (sincronizar
// primero con syncBillingMonth). Cuenta por fecha de emisión.
export const getBillingMonthSummary = async (periodKey: unknown) => {
  await requireAdminSession();

  const parsedKey = billingPeriodSchema.safeParse(periodKey);
  const period = parsedKey.success ? parseBillingPeriod(parsedKey.data) : null;
  if (!period) return { error: "Mes inválido" };

  const previous = addBillingMonths(period, -1);
  const invoices = await db.invoice.findMany({
    where: { issueDate: { gte: previous, lt: addBillingMonths(period, 1) } },
    select: { cfeType: true, currency: true, issueDate: true, status: true, total: true },
  });
  const inPeriod = (start: Date) =>
    invoices.filter((invoice) => invoice.issueDate && invoice.issueDate >= start && invoice.issueDate < addBillingMonths(start, 1));

  return {
    period: getBillingPeriodKey(period),
    summary: compareBillingMonths(
      summarizeBillingMonth(inPeriod(period)),
      summarizeBillingMonth(inPeriod(previous))
    ),
  };
};
