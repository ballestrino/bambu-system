import { isStaticToolUIPart } from "ai";

import type { AgentUIMessage } from "@/lib/agent/messages";
import type { AgentProposalDto, AgentProposalKind } from "@/lib/agent/proposals";
import { isVisitBatchKind } from "@/lib/agent/visit-proposals";

export type PendingProposalItem = {
  id: string;
  title: string;
  kind: AgentProposalKind;
  // Un lote de visitas se confirma con las marcadas en su tarjeta.
  allVisits: boolean;
};

// Las propuestas de una respuesta que siguen pendientes según el estado vivo
// (no el de la salida guardada de la tool, que dice PENDING para siempre).
// Con dos o más, la respuesta lleva la tarjeta de confirmar todas.
export const pendingProposalsOf = (
  message: AgentUIMessage,
  proposals: Map<string, AgentProposalDto> | null
): PendingProposalItem[] =>
  message.parts.flatMap((part) => {
    if (!isStaticToolUIPart(part) || part.state !== "output-available" || !part.output.ok) return [];
    const data = part.output.data;
    if (data.card !== "proposal") return [];
    const live = proposals?.get(data.proposalId);
    if (!live || live.unknownOutcome || live.status !== "PENDING") return [];
    return [
      {
        id: data.proposalId,
        title: live.summary.title,
        kind: data.kind,
        allVisits: isVisitBatchKind(data.kind),
      },
    ];
  });
