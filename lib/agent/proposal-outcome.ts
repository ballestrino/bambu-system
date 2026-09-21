import type { AgentProposalStatus, ProposalResult } from "@/lib/agent/proposals";

// Qué pasó con una propuesta después de confirmarla. Puro: lo usan las
// lecturas, el prompt, la tarjeta y los checks.

// Si el servidor se corta en plena escritura, la propuesta queda EXECUTING:
// no se sabe si la escritura llegó y no se reintenta sola. Pasado este tiempo
// (más que el máximo de una función en Vercel, 300 s) ya no puede estar
// corriendo, así que el resultado es desconocido.
export const EXECUTING_UNKNOWN_AFTER_MS = 6 * 60 * 1000;

export const hasUnknownOutcome = (
  proposal: { status: AgentProposalStatus; updatedAt: Date | string },
  now = new Date()
) =>
  proposal.status === "EXECUTING" &&
  now.getTime() - new Date(proposal.updatedAt).getTime() >= EXECUTING_UNKNOWN_AFTER_MS;

type ConfirmResponse = {
  success?: string;
  error?: string;
  proposal?: { result: ProposalResult | null } | null;
  result?: ProposalResult | null;
};

export type ConfirmOutcome =
  | { ok: true; message: string; result: ProposalResult | null }
  | { ok: false; error: string };

// confirmAgentProposal responde { success, proposal } o { error, proposal }.
// Si borraron la conversación mientras se ejecutaba, la propuesta ya no
// existe y responde { success, result } o { error }: las dos formas valen.
export const readConfirmResponse = (response: ConfirmResponse): ConfirmOutcome => {
  if (response.error) return { ok: false, error: response.error };
  return {
    ok: true,
    message: response.success ?? "Propuesta confirmada",
    result: response.proposal?.result ?? response.result ?? null,
  };
};
