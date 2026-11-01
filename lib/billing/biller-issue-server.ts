import "server-only";

import { createBillerIssuer } from "@/lib/billing/biller-issue";
import { getBillerConfig, getBillerReader, isIssueEnabled } from "@/lib/billing/biller-server";
import { getLookupCreationWindow } from "@/lib/billing/billing-month";
import { runCreditNoteIssue } from "@/lib/billing/credit-note-run";
import { createCreditNoteStore } from "@/lib/billing/credit-note-store";
import { runBatchIssue } from "@/lib/billing/issue-run";
import { createIssueRunStore } from "@/lib/billing/issue-store";
import { createNewInvoiceRunStore, runNewInvoiceIssue } from "@/lib/billing/new-invoice-run";
import { db } from "@/lib/db";

// El cableado de la emisión con el entorno y la base. Aparte de
// biller-server para que leer de Biller nunca arrastre la emisión: el agente
// no puede importar este módulo (check:billing).
const getSendDeps = () => {
  const reader = getBillerReader();
  return {
    findByInternalNumber: (internalNumber: string) =>
      reader.findByInternalNumber(internalNumber, getLookupCreationWindow(new Date())),
    issuer: createBillerIssuer(getBillerConfig()),
    now: () => new Date(),
    sleep: (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  };
};

export const runBillingBatchIssue = (batchId: string) =>
  runBatchIssue(batchId, { ...getSendDeps(), store: createIssueRunStore(db) });

export const runBillingCreditNote = (noteId: string) =>
  runCreditNoteIssue(noteId, { ...getSendDeps(), store: createCreditNoteStore(db) });

export const runBillingNewInvoice = (invoiceId: string) =>
  runNewInvoiceIssue(invoiceId, { ...getSendDeps(), store: createNewInvoiceRunStore(db) });

// Antes de tomar un lote o una nota: emitir prendido y Biller configurado
// (getBillerConfig tira si falta algo o si producción no corre acá).
export const assertCanIssue = () => {
  if (!isIssueEnabled()) return "Emitir está apagado (BILLER_ISSUE_ENABLED=false)";
  getBillerConfig();
  return null;
};
