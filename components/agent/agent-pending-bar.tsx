"use client";

import { CheckCheck } from "lucide-react";
import { useState } from "react";

import { useAgentChatContext } from "@/components/agent/agent-chat-context";
import { selectedVisitIndexes } from "@/components/agent/hooks/use-visit-selection";
import { pendingProposalsOf } from "@/components/agent/confirm-all";
import type { AgentUIMessage } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import type { AgentProposalDto } from "@/lib/agent/proposals";

// El id de la tarjeta de una propuesta: la barra salta hasta ella.
export const proposalCardId = (proposalId: string) => `propuesta-${proposalId}`;

const jumpTo = (proposalId: string) => {
  const card = document.getElementById(proposalCardId(proposalId));
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.focus({ preventScroll: true });
};

const visitLabel = (count: number) => (count === 1 ? "1 visita" : `${count} visitas`);

// Lo que dice el atajo a cada una: el presupuesto por su nombre, un lote por
// sus visitas marcadas.
const chipLabel = (live: AgentProposalDto | undefined, title: string, unchecked: number[] | undefined) => {
  const items = live?.summary.items?.length ?? 0;
  if (items > 1) return visitLabel(items - (unchecked?.length ?? 0));
  if (live?.kind === "SAVE_MEMORY") return "Memoria";
  if (live?.kind === "CHANGE_INSTRUCTIONS") return "Instrucciones";
  return live?.summary.name || title;
};

// Arriba del composer: cuántas propuestas de la conversación esperan
// confirmación (solo las PENDING vivas), un atajo a cada tarjeta y confirmar
// todas con el flujo de confirmar todas (de a una, cada lote con sus visitas
// marcadas). En el teléfono y en el Sheet, "Ver" va pasando de una a otra.
export function AgentPendingBar({ messages }: { messages: AgentUIMessage[] }) {
  const { proposals, busyProposalId, confirmingAll, confirmProposals, visitSelections } = useAgentChatContext();
  const [next, setNext] = useState(0);
  const pending = messages.flatMap((message) => pendingProposalsOf(message, proposals));
  if (!pending.length) return null;

  // Un lote sin ninguna visita marcada no se puede confirmar.
  const confirmable = pending.filter((item) => {
    const count = proposals?.get(item.id)?.summary.items?.length ?? 0;
    const indexes = selectedVisitIndexes(count, visitSelections[item.id]);
    return !indexes || indexes.length > 0;
  });
  const busy = Boolean(busyProposalId) || confirmingAll;
  const label =
    pending.length === 1 ? "1 propuesta espera tu confirmación" : `${pending.length} propuestas esperan tu confirmación`;
  const showNext = () => {
    const index = next % pending.length;
    jumpTo(pending[index].id);
    setNext(index + 1);
  };

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-[14px] border border-ops-border bg-ops-surface py-1.5 pr-1.5 pl-3.5 shadow-[0_1px_2px_rgb(24_37_29/0.04),0_6px_18px_rgb(24_37_29/0.06)]"
    >
      <span className="size-[7px] shrink-0 rounded-full bg-amber-600 dark:bg-amber-400" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-[13.5px] font-medium">
        <span className="@2xl/chat:hidden">{pending.length === 1 ? "1 pendiente" : `${pending.length} pendientes`}</span>
        <span className="hidden @2xl/chat:inline">{label}</span>
      </p>
      <div className="hidden min-w-0 flex-wrap justify-end gap-1.5 @2xl/chat:flex">
        {pending.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => jumpTo(item.id)}
            title={item.title}
            className="h-[30px] max-w-44 truncate rounded-full border border-ops-border bg-ops-surface px-3 text-xs font-medium hover:bg-ops-surface-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {chipLabel(proposals?.get(item.id), item.title, visitSelections[item.id])}
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        className="h-11 shrink-0 rounded-[10px] px-3 font-semibold text-ops-bamboo-strong @2xl/chat:hidden sm:h-9"
        onClick={showNext}
      >
        Ver
      </Button>
      <Button
        className="h-11 shrink-0 rounded-[10px] bg-ops-bamboo-strong px-3.5 font-semibold text-ops-surface hover:bg-ops-bamboo-strong/90 sm:h-9"
        disabled={!confirmable.length || busy}
        onClick={() => confirmProposals(confirmable.map((item) => item.id))}
      >
        <CheckCheck aria-hidden />
        {confirmingAll ? "Confirmando…" : confirmable.length > 1 ? `Confirmar las ${confirmable.length}` : "Confirmar"}
      </Button>
    </div>
  );
}
