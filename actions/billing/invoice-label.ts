"use server";

import { saveInvoiceLabel } from "@/lib/billing/invoice-label-store";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { invoiceLabelSchema } from "@/schemas/billing";

const ERRORS = {
  not_consumer: "Solo una factura a consumidor final lleva título: las demás usan el nombre del cliente",
  not_found: "La factura ya no existe",
  stale: "Alguien cambió esta factura: se recargó la última versión",
} as const;

// El título interno de una factura a consumidor final (feature 51). Solo
// vive en Bambú: no va a Biller ni al PDF. Lo pone una persona; el agente no.
export const setInvoiceLabel = async (values: unknown): Promise<{ error?: string; success?: string }> => {
  try {
    const session = await requireAdminSession();
    const parsed = invoiceLabelSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const result = await saveInvoiceLabel(
      db,
      { invoiceId: parsed.data.invoiceId, label: parsed.data.label, updatedAt: new Date(parsed.data.updatedAt) },
      session.user.id
    );
    if ("error" in result) return { error: ERRORS[result.error] };
    if (!result.label) return { success: "Se quitó el título" };
    return { success: result.movedJob ? `Título guardado: ${result.label}. El trabajo sigue vinculado` : `Título guardado: ${result.label}` };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error saving invoice label:", error);
    return { error: "No se pudo guardar el título" };
  }
};
