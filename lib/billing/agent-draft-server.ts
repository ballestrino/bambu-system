import "server-only";

import { readDraftCardSummary } from "@/lib/billing/agent-draft-read";
import { applyAgentDraft, type AgentDraftInput } from "@/lib/billing/agent-draft-store";
import { db } from "@/lib/db";

// El cableado de draftInvoices con la base. Es la única escritura del agente
// en facturación: un borrador, nunca una emisión (docs/billing.md, regla 1).
export const writeAgentDraft = (input: AgentDraftInput) => applyAgentDraft(db, input);

export const getAgentDraftCard = (batchId: string) => readDraftCardSummary(db, batchId);
