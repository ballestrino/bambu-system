"use server";

import { parseBillingPeriod } from "@/lib/billing/billing-month";
import { reviewDraftWithAi } from "@/lib/billing/draft-review-server";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { billingPeriodSchema } from "@/schemas/billing";

// "Revisar con IA" (feature 52): sugerencias sobre las adendas, los detalles
// y los servicios puntuales del borrador. No cambia nada: cada sugerencia la
// aplica una persona desde el panel, con las acciones del borrador.
export const reviewBillingDraft = async (periodKey: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = billingPeriodSchema.safeParse(periodKey);
    const period = parsed.success ? parseBillingPeriod(parsed.data) : null;
    if (!period) return { error: "Mes inválido" };
    return await reviewDraftWithAi(period, session.user.id);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error reviewing billing draft:", error);
    const message = error instanceof Error && /Falta configurar/.test(error.message) ? error.message : null;
    return { error: message ?? "La revisión con IA no respondió: probá de nuevo en un rato" };
  }
};
