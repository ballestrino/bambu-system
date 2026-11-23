import { AgentInstructionDetails } from "@/components/agent/cards/agent-instruction-details";
import { AgentMemoryDetails } from "@/components/agent/cards/agent-memory-details";
import { AgentProposalItems, type ProposalItemsSelection } from "@/components/agent/cards/agent-proposal-items";
import { AgentProposalPrices } from "@/components/agent/cards/agent-proposal-prices";
import type { ProposalSummary } from "@/lib/agent/proposals";

// El cuerpo de una propuesta: la memoria o la regla que se guarda, las
// visitas de un lote y los precios (agent-proposal-prices.tsx).
export function AgentProposalDetails({
  summary,
  selection,
}: {
  summary: ProposalSummary;
  selection?: ProposalItemsSelection;
}) {
  return (
    <>
      {summary.memory && <AgentMemoryDetails memory={summary.memory} />}
      {summary.instruction && <AgentInstructionDetails instruction={summary.instruction} />}
      {summary.items && summary.items.length > 0 && <AgentProposalItems items={summary.items} selection={selection} />}
      <AgentProposalPrices summary={summary} />
    </>
  );
}
