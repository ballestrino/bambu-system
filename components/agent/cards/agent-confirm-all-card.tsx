"use client";

import { CheckCheck } from "lucide-react";
import { useState } from "react";

import { useAgentChatContext } from "@/components/agent/agent-chat-context";
import { AgentCard } from "@/components/agent/cards/agent-card";
import { ProposalStatusBadge } from "@/components/agent/cards/agent-proposal-status";
import { pendingProposalsOf, type PendingProposalItem } from "@/components/agent/confirm-all";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { AgentUIMessage } from "@/lib/agent/messages";
import { getDisplayStatus } from "@/lib/agent/proposal-outcome";

const countLabel = (count: number) => (count === 1 ? "1 cambio" : `${count} cambios`);

// Con dos o más propuestas pendientes en una respuesta: todas juntas, con una
// casilla cada una. Confirma las marcadas de a una (cada una con su acción y
// sus controles); si una falla, sigue con las demás. Las desmarcadas quedan
// pendientes en su tarjeta.
export function AgentConfirmAllCard({ message }: { message: AgentUIMessage }) {
  const { proposals, busyProposalId, confirmingAll, confirmProposals } = useAgentChatContext();
  const pending = pendingProposalsOf(message, proposals);
  const [unchecked, setUnchecked] = useState<Set<string>>(() => new Set());
  // Lo que se mandó a confirmar: la lista sigue a la vista mientras cambia el
  // estado de cada una.
  const [sent, setSent] = useState<PendingProposalItem[] | null>(null);

  const items = sent ?? pending;
  if (!sent && pending.length < 2) return null;

  const selected = pending.filter((item) => !unchecked.has(item.id));
  const running = confirmingAll && sent !== null;
  const toggle = (id: string) =>
    setUnchecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const confirmSelected = () => {
    setSent(selected);
    confirmProposals(selected.map((item) => item.id));
  };

  const footer = sent ? (
    <p className="text-xs leading-snug text-ops-text-muted">
      {running ? `Confirmando ${countLabel(sent.length)}, de a uno…` : `Se mandaron a confirmar ${countLabel(sent.length)}.`}
    </p>
  ) : (
    <>
      <p className="min-w-0 flex-[1_1_220px] text-xs leading-snug text-ops-text-muted">
        Confirma los marcados de a uno, cada uno como en su tarjeta. Los desmarcados quedan pendientes.
      </p>
      <Button
        className="h-11 w-full rounded-[10px] bg-ops-bamboo-strong font-semibold text-ops-surface hover:bg-ops-bamboo-strong/90 sm:h-[34px] sm:w-auto"
        disabled={!selected.length || Boolean(busyProposalId) || confirmingAll}
        onClick={confirmSelected}
      >
        <CheckCheck aria-hidden />
        Confirmar {countLabel(selected.length)}
      </Button>
    </>
  );

  return (
    <AgentCard
      icon={CheckCheck}
      title="Confirmar los cambios propuestos"
      subtitle={sent ? null : `${selected.length} de ${pending.length} marcados`}
      footer={footer}
    >
      <ul className="divide-y divide-ops-border rounded-[10px] border border-ops-border">
        {items.map((item) => {
          const live = proposals?.get(item.id);
          const status = busyProposalId === item.id ? "EXECUTING" : getDisplayStatus(live, "PENDING");
          return (
            <li key={item.id} className="flex min-h-11 items-center gap-3 px-3 py-2">
              {sent ? null : (
                <Checkbox
                  checked={!unchecked.has(item.id)}
                  onCheckedChange={() => toggle(item.id)}
                  aria-label={`Incluir ${item.title}`}
                />
              )}
              <span className="min-w-0 flex-1 text-[13px] leading-snug">
                <span className="block break-words font-medium text-ops-text">{item.title}</span>
                {item.allVisits && (
                  <span className="block text-xs text-ops-text-muted">Con las visitas marcadas en su tarjeta.</span>
                )}
              </span>
              {sent ? <ProposalStatusBadge status={status} /> : null}
            </li>
          );
        })}
      </ul>
    </AgentCard>
  );
}
