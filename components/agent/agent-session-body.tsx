"use client";

import { AlertCircle } from "lucide-react";

import { AgentChat } from "@/components/agent/agent-chat";
import type { AgentSession } from "@/components/agent/hooks/use-agent-session";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProposalResult } from "@/lib/agent/proposals";
import type { AgentBudgetContextInput } from "@/schemas/agent";

function LoadingConversation() {
  return (
    <div className="flex-1 space-y-4 px-4 py-4" aria-busy="true" aria-label="Cargando la conversación">
      <Skeleton className="ml-auto h-10 w-2/3 rounded-2xl" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
    </div>
  );
}

// Lo que se ve según el estado de la sesión: cargando, error al abrir o la
// conversación (con su instancia Chat, que vive en el host). Igual en el Sheet
// y en la página.
export function AgentSessionBody({
  session,
  contextLabel,
  getContext,
  onProposalConfirmed,
}: {
  session: AgentSession;
  contextLabel: string;
  getContext: () => AgentBudgetContextInput | undefined;
  onProposalConfirmed: (result: ProposalResult | null) => void;
}) {
  const { state } = session;
  if (state.status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center" role="alert">
        <AlertCircle className="size-8 text-destructive" aria-hidden />
        <p className="text-sm">{state.message}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="h-11 sm:h-9" onClick={() => void session.openConversation(state.id)}>
            Reintentar
          </Button>
          <Button className="h-11 sm:h-9" onClick={session.startNew}>
            Nueva conversación
          </Button>
        </div>
      </div>
    );
  }
  if (state.status !== "ready") return <LoadingConversation />;
  return (
    <AgentChat
      key={state.id}
      conversationId={state.id}
      chat={state.chat}
      mode={session.mode}
      notices={session.notices}
      contextLabel={contextLabel}
      getContext={getContext}
      onProposalConfirmed={onProposalConfirmed}
    />
  );
}
