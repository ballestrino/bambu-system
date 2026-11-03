"use server";

import { addManualDelivery, removeManualDelivery } from "@/lib/billing/invoice-delivery-store";
import { DELIVERY_CHANNEL_LABEL } from "@/lib/billing/invoice-delivery";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { invoiceDeliveryAddSchema, invoiceDeliveryRemoveSchema } from "@/schemas/billing-delivery";

const ERRORS = {
  duplicate: "Ya está anotada",
  not_found: "La factura ya no existe",
  not_sendable: "Solo se marca como enviada una factura emitida y no rechazada",
  system: "Lo que mandó Bambú queda en el registro: no se quita",
} as const;

// Marcar como enviada a mano (feature 53): un correo o un WhatsApp mandado por
// fuera. Solo admin; el agente no anota.
export const recordInvoiceDelivery = async (values: unknown): Promise<{ error?: string; success?: string }> => {
  try {
    const session = await requireAdminSession();
    const parsed = invoiceDeliveryAddSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const result = await addManualDelivery(db, parsed.data, session.user.id);
    if ("error" in result) return { error: result.error === "invalid" ? result.message ?? "Dato inválido" : ERRORS[result.error] };
    return { success: `Anotado: ${DELIVERY_CHANNEL_LABEL[parsed.data.channel]} - ${result.recipient}` };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error recording invoice delivery:", error);
    return { error: "No se pudo anotar el envío" };
  }
};

export const deleteInvoiceDelivery = async (values: unknown): Promise<{ error?: string; success?: string }> => {
  try {
    const session = await requireAdminSession();
    const parsed = invoiceDeliveryRemoveSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const result = await removeManualDelivery(db, parsed.data, session.user.id);
    if ("error" in result) return { error: result.error === "not_found" ? "Esa anotación ya no está" : ERRORS.system };
    return { success: `Se quitó ${result.recipient}` };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error removing invoice delivery:", error);
    return { error: "No se pudo quitar la anotación" };
  }
};
