"use server";

import { describeBillerError } from "@/lib/billing/biller-errors";
import { assertCanIssue, runBillingCreditNote } from "@/lib/billing/biller-issue-server";
import { claimCreditNote, claimCreditNoteRetry } from "@/lib/billing/credit-note-store";
import type { CreditNoteRunResult } from "@/lib/billing/credit-note-run";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { creditNoteSchema } from "@/schemas/billing";

const describeResult = (noteId: string, result: CreditNoteRunResult) => {
  if (result.kind === "failed") return { error: result.message };
  if (result.kind === "unknown") return { error: result.message, noteId, unknown: true };
  const number = [result.series, result.number].filter(Boolean).join(" ");
  return { success: `Nota de crédito ${number} emitida`, noteId };
};

// "Emitir nota de crédito" desde Facturación (docs/billing.md, reglas 2 y 3).
// Solo admin y nunca desde el agente (check:billing): el agente solo la
// prepara y la abre en esta página. Se emite en el momento, no queda en
// borrador.
export const issueCreditNote = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = creditNoteSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    const disabled = assertCanIssue();
    if (disabled) return { error: disabled };

    const claim = await claimCreditNote(db, parsed.data, session.user.id, new Date());
    if ("error" in claim) return { error: claim.error, conflict: claim.conflict };
    return describeResult(claim.noteId, await runBillingCreditNote(claim.noteId));
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error issuing credit note:", error);
    return { error: describeBillerError(error) };
  }
};

// "Reintentar" una nota que quedó sin confirmar: mismo numero_interno, no duplica.
export const retryCreditNote = async (noteId: unknown) => {
  try {
    await requireAdminSession();
    if (typeof noteId !== "string" || !noteId.trim()) return { error: "Nota inválida" };
    const disabled = assertCanIssue();
    if (disabled) return { error: disabled };

    const claim = await claimCreditNoteRetry(db, noteId);
    if ("error" in claim) return { error: claim.error };
    return describeResult(noteId, await runBillingCreditNote(noteId));
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error retrying credit note:", error);
    return { error: describeBillerError(error) };
  }
};
