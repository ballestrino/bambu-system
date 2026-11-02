"use server";

import { reviewBillingDraft } from "@/actions/billing/draft-review";
import { setInvoiceLabel } from "@/actions/billing/invoice-label";
import { deleteDraftInvoice, setInvoiceArchived } from "@/actions/billing/invoice-remove";
import { issueBillingBatch, resumeBillingIssue } from "@/actions/billing/issue-batch";
import { setReceiverJob } from "@/actions/billing/receiver-job";
import { repeatBillingMonth } from "@/actions/billing/repeat-month";
import { syncBillingMonth } from "@/actions/billing/sync-month";
import { updateDraftInvoice } from "@/actions/billing/update-draft-invoice";
import { getBillingMonthView } from "@/data/billing/month";
import ValidationError from "@/instances/validation-error";
import type { DraftInvoiceDelete, DraftInvoiceEdit, InvoiceArchive, InvoiceLabelEdit, IssueBatchRequest, ReceiverJobLink } from "@/schemas/billing";

// Envoltorios de la página Facturación: un { error } pasa a ValidationError
// para que TanStack Query lo trate como error.
const unwrap = <T extends object>(result: T) => {
  if ("error" in result && typeof result.error === "string") throw new ValidationError(result.error);
  return result as Exclude<T, { error: string }>;
};

export const getBillingMonthAction = async (periodKey: string) =>
  unwrap(await getBillingMonthView(periodKey));

export const syncBillingMonthAction = async (periodKey: string) => {
  const result = await syncBillingMonth(periodKey);
  if ("error" in result) throw new ValidationError(result.error ?? "No se pudo sincronizar con Biller");
  return result.result;
};

export const repeatBillingMonthAction = async (periodKey: string) => {
  const result = await repeatBillingMonth(periodKey);
  if ("error" in result) throw new ValidationError(result.error ?? "No se pudo repetir el mes");
  return result;
};

export const updateDraftInvoiceAction = async (edit: DraftInvoiceEdit) => {
  const result = await updateDraftInvoice(edit);
  if ("error" in result) throw new ValidationError(result.error ?? "No pudimos guardar el cambio");
  return result;
};

export const issueBillingBatchAction = async (request: IssueBatchRequest) => {
  const result = await issueBillingBatch(request);
  if ("error" in result) throw new ValidationError(result.error ?? "No se pudo emitir");
  return result;
};

export const resumeBillingIssueAction = async (batchId: string) => {
  const result = await resumeBillingIssue(batchId);
  if ("error" in result) throw new ValidationError(result.error ?? "No se pudo reintentar");
  return result;
};

// Devuelve el { error } (el hook lo tira en el cliente): en producción Next
// oculta el mensaje de un error tirado en una server action.
export const setReceiverJobAction = async (link: ReceiverJobLink): Promise<{ error?: string; success?: string }> =>
  setReceiverJob(link);

// Borrar del borrador y archivar (47): también devuelven el { error }.
export const deleteDraftInvoiceAction = async (values: DraftInvoiceDelete) => deleteDraftInvoice(values);

export const setInvoiceArchivedAction = async (values: InvoiceArchive) => setInvoiceArchived(values);

// El título de un consumidor final (51): devuelve el { error }, como los de arriba.
export const setInvoiceLabelAction = async (values: InvoiceLabelEdit) => setInvoiceLabel(values);

// "Revisar con IA" (52): devuelve las sugerencias o el { error }.
export const reviewBillingDraftAction = async (periodKey: string) => reviewBillingDraft(periodKey);
