import "server-only";

import { createBillerIssuer } from "@/lib/billing/biller-issue";
import { getBillerConfig, getBillerReader } from "@/lib/billing/biller-server";
import { getLookupCreationWindow } from "@/lib/billing/billing-month";
import { runBatchIssue } from "@/lib/billing/issue-run";
import { createIssueRunStore } from "@/lib/billing/issue-store";
import { db } from "@/lib/db";

// El cableado de la emisión con el entorno y la base. Aparte de
// biller-server para que leer de Biller nunca arrastre la emisión: el agente
// no puede importar este módulo (check:billing).
export const runBillingBatchIssue = (batchId: string) => {
  const reader = getBillerReader();
  return runBatchIssue(batchId, {
    findByInternalNumber: (internalNumber) =>
      reader.findByInternalNumber(internalNumber, getLookupCreationWindow(new Date())),
    issuer: createBillerIssuer(getBillerConfig()),
    now: () => new Date(),
    sleep: (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
    store: createIssueRunStore(db),
  });
};
