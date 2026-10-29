import "server-only";

import { executeInstructionsProposal } from "@/lib/agent/instruction-store";
import { executeMemoryProposal } from "@/lib/agent/memory-proposal-execute";
import { isMemoryProposal, type ParsedTeamProposal } from "@/schemas/agent-proposals";

// Las propuestas que cambian al agente mismo (su memoria y las reglas del
// equipo), desde confirmAgentProposal.
export const executeTeamProposal = (
  proposal: ParsedTeamProposal,
  context: { actorId: string; conversationId: string }
) => {
  if (isMemoryProposal(proposal)) return executeMemoryProposal(proposal, context);
  return executeInstructionsProposal(proposal, context);
};
