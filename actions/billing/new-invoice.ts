"use server";

import { describeBillerError } from "@/lib/billing/biller-errors";
import { assertCanIssue, runBillingNewInvoice } from "@/lib/billing/biller-issue-server";
import { getIssueDay } from "@/lib/billing/issue-payload";
import { claimNewInvoiceIssue, saveNewInvoiceDraft } from "@/lib/billing/new-invoice-store";
import type { NewInvoiceRunResult } from "@/lib/billing/new-invoice-run";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { newInvoiceRequestSchema } from "@/schemas/billing-new-invoice";

const today = () => getIssueDay(new Date()).toISOString().slice(0, 10);

const describeResult = (invoiceId: string, result: NewInvoiceRunResult) => {
  if (result.kind === "failed") return { error: result.message };
  if (result.kind === "unknown") return { error: result.message, invoiceId, unknown: true };
  const number = [result.series, result.number].filter(Boolean).join(" ");
  return { invoiceId, success: `Factura ${number} emitida` };
};

// "Emitir ahora" desde Nueva factura (feature 45, reglas 2 y 3). Solo admin y
// nunca desde el agente (check:billing). El mismo pedido (requestId) emitido
// dos veces encuentra la misma factura: no duplica.
export const issueNewInvoice = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = newInvoiceRequestSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    const disabled = assertCanIssue();
    if (disabled) return { error: disabled };

    const claim = await claimNewInvoiceIssue(db, parsed.data, session.user.id, new Date(), today());
    if (claim.kind === "error") return { error: claim.error };
    if (claim.kind === "done") return { invoiceId: claim.invoiceId, success: "Esta factura ya está emitida" };
    return describeResult(claim.invoiceId, await runBillingNewInvoice(claim.invoiceId));
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error issuing new invoice:", error);
    return { error: describeBillerError(error) };
  }
};

// "Guardar en el borrador de <mes>": no emite; se emite con el lote.
export const saveNewInvoiceToDraft = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = newInvoiceRequestSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    const saved = await saveNewInvoiceDraft(db, parsed.data, session.user.id, today());
    if (!saved.ok) return { error: saved.error };
    return { batchId: saved.batchId, success: `Guardada en el borrador de ${saved.month}` };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error saving new invoice to draft:", error);
    return { error: "No se pudo guardar en el borrador" };
  }
};
