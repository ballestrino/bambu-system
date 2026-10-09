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
      className="shrink-0 rounded-md px-1.5 py-1 text-xs text-ops-text-muted tabular-nums transition-colors hover:bg-ops-surface-muted hover:text-ops-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={onClick}
      title="Costo de esta conversación. Ver costos de IA"
      aria-label={`Costo de esta conversación: ${label}. Ver costos de IA`}
    >
      {label}
    </button>
  );
}

// "Esta conversación US$ 0,01", al pie del menú del modo: en el teléfono la
// cabecera no tiene lugar para el badge. Una conversación sin guardar todavía
// no gastó nada y no lo muestra.
export function AgentConversationCost({ conversationId, persisted }: { conversationId: string | null; persisted: boolean }) {
  const cost = useConversationCost(conversationId, persisted);
  if (!persisted || !cost.data) return null;
  const unpriced = cost.data.unpricedEvents > 0;
  return (
    <div className="mt-1 flex justify-between gap-3 border-t border-ops-surface-muted px-2.5 pt-2 pb-1 text-xs text-ops-text-muted sm:hidden">
      <span>Esta conversación</span>
      <span className="tabular-nums">
        {formatUsd(cost.data.total.costUsd)}
        {unpriced ? " + sin precio" : ""}
      </span>
    </div>
  );
}
