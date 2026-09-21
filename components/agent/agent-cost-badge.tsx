"use client";

import { CircleDollarSign } from "lucide-react";

import { useConversationCost } from "@/components/agent/hooks/use-agent-queries";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/ai/pricing";

// Lo gastado en esta conversación (turnos, borradores y título). Abre el
// informe de costos de IA.
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
    <Button
      variant="outline"
      size="sm"
      className="h-11 gap-1.5 tabular-nums sm:h-8"
      onClick={onClick}
      title="Costo estimado de esta conversación. Ver costos de IA"
      aria-label={`Costo de esta conversación: ${label}. Ver costos de IA`}
    >
      <CircleDollarSign aria-hidden />
      {label}
    </Button>
  );
}
