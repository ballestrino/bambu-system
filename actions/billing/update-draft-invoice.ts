"use server";

import { updateDraftInvoice as applyDraftUpdate } from "@/lib/billing/draft-update";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { draftInvoiceEditSchema } from "@/schemas/billing";

const ERRORS = {
  invalid_lines: "La factura cambió: recargá para ver sus líneas",
  not_editable: "Esta factura ya no es un borrador",
  not_found: "La factura ya no está en el borrador",
  stale: "Alguien cambió esta factura: se recargó la última versión",
} as const;

// Marca o desmarca una factura del borrador, o cambia el detalle y el precio
// de sus líneas. Rechaza el cambio si la factura cambió desde que se vio.
export const updateDraftInvoice = async (values: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsed = draftInvoiceEditSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const result = await applyDraftUpdate(db, parsed.data, session.user.id);
    if ("error" in result) return { error: ERRORS[result.error], conflict: result.error === "stale" };
    return { success: "Borrador guardado", updatedAt: result.updatedAt.toISOString() };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error updating draft invoice:", error);
    return { error: "No pudimos guardar el cambio" };
  }
};
