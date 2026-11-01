"use server";

import { ARCHIVE_ERRORS, DELETE_DRAFT_ERRORS } from "@/lib/billing/invoice-remove";
import { deleteDraftInvoice as deleteFromDraft, setInvoiceArchived as applyArchive } from "@/lib/billing/invoice-remove-store";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { draftInvoiceDeleteSchema, invoiceArchiveSchema } from "@/schemas/billing";

type DeleteResult = { error: string; conflict?: boolean } | { success: string; batchUpdatedAt: string };
type ArchiveResult = { error: string } | { success: string; archived: boolean };

// Borra una factura del borrador (feature 47). El servidor decide: una
// emitida, en curso o sin confirmar nunca se borra, la mande quien la mande.
export const deleteDraftInvoice = async (values: unknown): Promise<DeleteResult> => {
  try {
    const session = await requireAdminSession();

    const parsed = draftInvoiceDeleteSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const result = await deleteFromDraft(db, parsed.data, session.user.id);
    if ("error" in result) return { error: DELETE_DRAFT_ERRORS[result.error], conflict: result.error === "stale" };
    return { success: "Factura borrada del borrador", batchUpdatedAt: result.batchUpdatedAt.toISOString() };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error deleting draft invoice:", error);
    return { error: "No pudimos borrar la factura" };
  }
};

// Archiva o desarchiva una factura emitida (feature 47): sale de las listas
// y sigue en Biller y en el resumen del mes.
export const setInvoiceArchived = async (values: unknown): Promise<ArchiveResult> => {
  try {
    const session = await requireAdminSession();

    const parsed = invoiceArchiveSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const result = await applyArchive(db, parsed.data, session.user.id);
    if ("error" in result) return { error: ARCHIVE_ERRORS[result.error] };
    return { success: result.archived ? "Factura archivada" : "Factura desarchivada", archived: result.archived };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error archiving invoice:", error);
    return { error: "No pudimos cambiar la factura" };
  }
};
