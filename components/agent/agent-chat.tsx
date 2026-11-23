"use client";

import type { Chat } from "@ai-sdk/react";
import { useState } from "react";

import { AgentChatProvider } from "@/components/agent/agent-chat-context";
import { AgentComposer } from "@/components/agent/agent-composer";
import { AgentBudgetSheet } from "@/components/agent/budget-editor/agent-budget-sheet";
import { AgentOfficialBudgetSheet } from "@/components/agent/budget-editor/agent-official-budget-sheet";
import { AgentSavedBudgetSheet } from "@/components/agent/budget-editor/agent-saved-budget-sheet";
import { useBudgetEditor } from "@/components/agent/hooks/use-budget-editor";
import { AgentEmptyState } from "@/components/agent/agent-empty-state";
import { AgentErrorBanner } from "@/components/agent/agent-error-banner";
import { AgentMessageList } from "@/components/agent/agent-message-list";
import { AgentPendingBar } from "@/components/agent/agent-pending-bar";
import { useAgentChat } from "@/components/agent/hooks/use-agent-chat";
import { useAgentProposalMutations } from "@/components/agent/hooks/use-agent-proposal-mutations";
import { useAgentProposals } from "@/components/agent/hooks/use-agent-queries";
import { selectedVisitIndexes } from "@/components/agent/hooks/use-visit-selection";
import type { TurnNotice } from "@/components/agent/hooks/use-agent-session";
import type { AgentUIMessage } from "@/components/agent/types";
import { isSavableBudgetPartType } from "@/lib/agent/budget-draft";
import { readAgentError } from "@/lib/agent/chat-request";
import type { ProposalResult } from "@/lib/agent/proposals";
import { DEFAULT_AGENT_SKILL, type AgentSkillId } from "@/lib/agent/skills";
import type { AgentMode } from "@/lib/ai/modes";
import type { AgentBudgetContextInput } from "@/schemas/agent";

// Propuestas o presupuestos que se pueden guardar desde el editor: sin
// ninguno no hace falta leer el estado vivo de las propuestas.
const hasProposalParts = (messages: AgentUIMessage[]) =>
  messages.some((message) =>
    message.parts.some((part) => part.type.startsWith("tool-propose") || isSavableBudgetPartType(part.type))
  );

// Una conversación: mensajes con sus tarjetas, aviso de error y composer. Los
// mensajes van con la habilidad general (todas las tools), salvo que el host
// pida otra (Facturación). No sabe en qué pantalla está: el contexto llega
// como función.
export function AgentChat({
  conversationId,
  chat,
  mode,
  notices,
  contextLabel,
  getContext,
  onProposalConfirmed,
  composerTools,
  skill = DEFAULT_AGENT_SKILL,
}: {
  conversationId: string;
  chat: Chat<AgentUIMessage>;
  mode: AgentMode;
  notices: Record<string, TurnNotice>;
  contextLabel: string;
  getContext: () => AgentBudgetContextInput | undefined;
  onProposalConfirmed?: (result: ProposalResult | null) => void;
  // Lo que va junto al "+" del composer: el modo.
  composerTools?: React.ReactNode;
  skill?: AgentSkillId;
}) {
  const view = useAgentChat({ chat, mode, getContext });
  const proposals = useAgentProposals(conversationId, hasProposalParts(view.messages));
  const { confirm, reject, confirmAll, confirmingAll } = useAgentProposalMutations({
    conversationId,
    onConfirmed: onProposalConfirmed,
  });
  const editor = useBudgetEditor();
  const [savedBudgetSlug, setSavedBudgetSlug] = useState<string | null>(null);
  const [officialBudgetId, setOfficialBudgetId] = useState<string | null>(null);
  const [visitSelections, setVisitSelections] = useState<Record<string, number[]>>({});
  const errorMessage = readAgentError(view.error);
  const byCall = new Map((proposals.data ?? []).map((item) => [item.toolCallId, item]));
  const byId = proposals.data ? new Map(proposals.data.map((item) => [item.id, item])) : null;
  // Varias juntas (la barra y la tarjeta de confirmar todas): cada lote con
  // las visitas que quedaron marcadas en su tarjeta.
  const confirmProposals = (proposalIds: string[]) =>
    void confirmAll(
      proposalIds.map((proposalId) => ({
        proposalId,
        visitIndexes: selectedVisitIndexes(byId?.get(proposalId)?.summary.items?.length ?? 0, visitSelections[proposalId]),
      }))
    );

  return (
    <AgentChatProvider
      value={{
        proposals: byId,
        busyProposalId: confirm.isPending
          ? confirm.variables.proposalId
          : reject.isPending
            ? reject.variables
            : null,
        confirmProposal: (proposalId, visitIndexes) => confirm.mutate({ proposalId, visitIndexes }),
        rejectProposal: (proposalId) => reject.mutate(proposalId),
        confirmProposals,
        confirmingAll,
        proposalForCall: (toolCallId) => byCall.get(toolCallId),
        openBudget: editor.openBudget,
        openSavedBudget: setSavedBudgetSlug,
        openOfficialBudget: setOfficialBudgetId,
        hasBudgetDraft: editor.hasDraft,
        visitSelections,
        setVisitUnchecked: (proposalId, unchecked) =>
          setVisitSelections((current) => ({ ...current, [proposalId]: unchecked })),
        sendMessage: (text) => view.send(text, skill),
        busy: view.busy,
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <AgentMessageList
          messages={view.messages}
          status={view.status}
          notices={notices}
          onRetry={view.canRetry ? view.retry : undefined}
          emptyState={<AgentEmptyState contextLabel={contextLabel} />}
        />
        {errorMessage && (
          <AgentErrorBanner
            message={errorMessage}
            onRetry={view.canRetry ? view.retry : undefined}
            onDismiss={view.clearError}
          />
        )}
        <div
          data-agent-composer
          className="px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5 @2xl/chat:px-8"
        >
          <div className="mx-auto max-w-[720px] space-y-2">
            <AgentPendingBar messages={view.messages} />
            <AgentComposer
              busy={view.busy}
              tools={composerTools}
              voiceRequest={() => ({ mode, conversationId })}
              onSend={({ text, files }) => view.send(text, skill, files)}
              onStop={view.stop}
            />
          </div>
        </div>
      </div>
      <AgentBudgetSheet
        editor={editor}
        conversationId={conversationId}
        proposalFor={(toolCallId) => byCall.get(toolCallId)}
        waiting={view.busy}
      />
      <AgentSavedBudgetSheet slug={savedBudgetSlug} onClose={() => setSavedBudgetSlug(null)} />
      <AgentOfficialBudgetSheet id={officialBudgetId} onClose={() => setOfficialBudgetId(null)} />
    </AgentChatProvider>
  );
}
