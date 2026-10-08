"use client";

import { useConversationCost } from "@/components/agent/hooks/use-agent-queries";
import { formatUsd } from "@/lib/ai/pricing";

// Lo gastado en esta conversación (turnos, borradores y título), chico y en
// gris arriba a la derecha del chat. Abre el informe de costos de IA.
export function AgentCostBadge({
  conversationId,
  persisted,
  onClick,
}: {
  conversationId: string | null;
  persisted: boolean;
  onClick: () => void;
}) {
  const cost = useConversationCost(conversationId, persisted);
  const total = cost.data?.total.costUsd ?? 0;
  const unpriced = (cost.data?.unpricedEvents ?? 0) > 0;
  const label = `${formatUsd(total)}${unpriced ? " + sin precio" : ""}`;
  return (
    <button
      type="button"
      className="ml-auto shrink-0 rounded px-1 py-1 text-xs text-muted-foreground tabular-nums transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={onClick}
      title="Costo de esta conversación. Ver costos de IA"
      aria-label={`Costo de esta conversación: ${label}. Ver costos de IA`}
    >
      {label}
    </button>
  );
}
