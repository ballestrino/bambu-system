"use server";

import { loadDraftInvoiceEditor, saveDraftInvoiceForm } from "@/actions/billing/draft-editor";
import { updateDraftInvoice } from "@/actions/billing/update-draft-invoice";
import type { DraftInvoiceEdit } from "@/schemas/billing";
import type { DraftInvoiceFormRequest } from "@/schemas/billing-new-invoice";

// Editor lateral del borrador (feature 49). Devuelven el { error } y lo tira
// el hook en el cliente (en producción Next oculta el mensaje de un error
// tirado dentro de una server action).
export const loadDraftInvoiceEditorAction = async (invoiceId: string) => loadDraftInvoiceEditor(invoiceId);

export const saveDraftInvoiceFormAction = async (values: DraftInvoiceFormRequest) => saveDraftInvoiceForm(values);

// "Quitar del borrador" y "Volver a marcar" desde el editor, con su updatedAt.
export const setDraftInvoiceSelectedAction = async (values: DraftInvoiceEdit) => updateDraftInvoice(values);
