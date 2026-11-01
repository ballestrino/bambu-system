"use server";

import { describeBillerError } from "@/lib/billing/biller-errors";
import { syncBillingPeriod } from "@/lib/billing/biller-server";
import { parseBillingPeriod } from "@/lib/billing/billing-month";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { billingPeriodSchema } from "@/schemas/billing";

// Copia de Biller los comprobantes alrededor de un mes. Solo lee de Biller;
// escribe la copia local.
export const syncBillingMonth = async (periodKey: unknown) => {
  try {
    await requireAdminSession();

    const parsedKey = billingPeriodSchema.safeParse(periodKey);
    const period = parsedKey.success ? parseBillingPeriod(parsedKey.data) : null;
    if (!period) return { error: "Mes inválido" };

    const result = await syncBillingPeriod(period);
    return { success: "Facturas sincronizadas con Biller", result };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error syncing Biller invoices:", error);
    return { error: describeBillerError(error) };
  }
};
