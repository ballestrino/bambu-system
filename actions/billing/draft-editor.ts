"use server";

import { getDraftInvoiceEditor } from "@/data/billing/draft-invoice";
import { saveDraftInvoiceForm as applyDraftForm } from "@/lib/billing/draft-editor-store";
import { getIssueDay } from "@/lib/billing/issue-payload";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { draftInvoiceFormSchema } from "@/schemas/billing-new-invoice";

const ERRORS = {
  not_editable: "Esta factura ya no es un borrador",
  not_found: "La factura ya no está en el borrador",
  stale: "Alguien cambió esta factura mientras la editabas: se cargó la última versión",
} as const;

type SaveResult =
  | { conflict?: boolean; error: string }
  | { changes: string[]; success: string; total: number; updatedAt: string };

// El editor lateral de una factura del borrador (feature 49): leerla y
// guardarla. Devuelven el { error }: en producción Next oculta el mensaje de
// un error tirado en una server action.
export const loadDraftInvoiceEditor = async (invoiceId: string) => {
  try {
    return await getDraftInvoiceEditor(invoiceId);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error loading draft invoice:", error);
    return { error: "No pudimos abrir la factura" };
  }
};

export const saveDraftInvoiceForm = async (values: unknown): Promise<SaveResult> => {
  try {
    const session = await requireAdminSession();
    const parsed = draftInvoiceFormSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const result = await applyDraftForm(db, parsed.data, session.user.id, getIssueDay(new Date()));
    if ("error" in result) {
      return result.error === "invalid" ? { error: result.message } : { conflict: result.error === "stale", error: ERRORS[result.error] };
    }
    return {
      changes: result.changes,
      success: result.changes.length ? "Factura guardada" : "Sin cambios para guardar",
      total: result.total,
      updatedAt: result.updatedAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error saving draft invoice:", error);
    return { error: "No pudimos guardar la factura" };
  }
};
