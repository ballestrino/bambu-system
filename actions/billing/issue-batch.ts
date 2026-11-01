"use server";

import { after } from "next/server";

import { describeBillerError } from "@/lib/billing/biller-errors";
import { assertCanIssue, runBillingBatchIssue } from "@/lib/billing/biller-issue-server";
import { claimBatchIssue, claimBatchResume } from "@/lib/billing/issue-claim";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { issueBatchSchema } from "@/schemas/billing";

const CLAIM_ERRORS = {
  empty: "No hay facturas marcadas para emitir",
  issuing: "Este borrador ya se está emitiendo",
  not_draft: "Este borrador ya se emitió",
  not_found: "El borrador ya no existe",
  stale: "El borrador cambió desde que abriste el diálogo: revisalo antes de emitir",
} as const;

const RESUME_ERRORS = {
  not_found: "El borrador ya no existe",
  nothing: "No quedan facturas por emitir",
  running: "La emisión sigue en curso",
} as const;

// La emisión sigue después de responder (after): la página muestra el avance
// releyendo el borrador. Si la función se corta, el lote queda en ISSUING y
// la página ofrece continuar.
const issueInBackground = (batchId: string) =>
  after(async () => {
    try {
      await runBillingBatchIssue(batchId);
    } catch (error) {
      console.error("Error issuing billing batch:", error);
    }
  });

// "Emitir N" desde Facturación (docs/billing.md, reglas 2 y 3). Solo admin y
// nunca desde el agente (check:billing).
export const issueBillingBatch = async (values: unknown) => {
  try {
    await requireAdminSession();
    const parsed = issueBatchSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    const disabled = assertCanIssue();
    if (disabled) return { error: disabled };

    const claim = await claimBatchIssue(db, parsed.data, new Date());
    if ("error" in claim) {
      return { error: CLAIM_ERRORS[claim.error], conflict: claim.error === "stale" || claim.error === "issuing" };
    }
    issueInBackground(parsed.data.batchId);
    return { success: `Emitiendo ${claim.count} ${claim.count === 1 ? "factura" : "facturas"}`, count: claim.count };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error starting billing issue:", error);
    return { error: describeBillerError(error) };
  }
};

// "Continuar" una emisión cortada o "Reintentar" las que quedaron sin confirmar.
export const resumeBillingIssue = async (batchId: unknown) => {
  try {
    await requireAdminSession();
    if (typeof batchId !== "string" || !batchId.trim()) return { error: "Borrador inválido" };
    const disabled = assertCanIssue();
    if (disabled) return { error: disabled };

    const claim = await claimBatchResume(db, batchId, new Date());
    if ("error" in claim) return { error: RESUME_ERRORS[claim.error] };
    issueInBackground(batchId);
    return { success: `Reintentando ${claim.count} ${claim.count === 1 ? "factura" : "facturas"}`, count: claim.count };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error resuming billing issue:", error);
    return { error: describeBillerError(error) };
  }
};
