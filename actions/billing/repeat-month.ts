"use server";

import { describeBillerError } from "@/lib/billing/biller-errors";
import { syncBillingPeriod } from "@/lib/billing/biller-server";
import { addBillingMonths, parseBillingPeriod } from "@/lib/billing/billing-month";
import { createRepeatDraft } from "@/lib/billing/draft-store";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { billingPeriodSchema } from "@/schemas/billing";

// "Repetir <mes anterior>": crea el borrador del mes, o abre el que ya está.
// Primero copia de Biller el mes, para que lo ya facturado (también desde el
// panel) arranque desmarcado. No emite nada.
export const repeatBillingMonth = async (periodKey: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedKey = billingPeriodSchema.safeParse(periodKey);
    const period = parsedKey.success ? parseBillingPeriod(parsedKey.data) : null;
    if (!period) return { error: "Mes inválido" };

    await syncBillingPeriod(period);
    await syncBillingPeriod(addBillingMonths(period, -1));

    const result = await createRepeatDraft(db, { period, userId: session.user.id });
    if ("error" in result) return { error: "El mes anterior no tiene facturas emitidas para repetir" };
    return {
      success: result.created ? "Borrador creado" : "Ya había un borrador: se abrió ese",
      batchId: result.batchId,
      created: result.created,
    };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error repeating billing month:", error);
    return { error: describeBillerError(error) };
  }
};
