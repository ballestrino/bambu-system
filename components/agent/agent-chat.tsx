"use client";

import type { Chat } from "@ai-sdk/react";

import { AgentChatProvider } from "@/components/agent/agent-chat-context";
import { AgentComposer } from "@/components/agent/agent-composer";
import { AgentBudgetSheet } from "@/components/agent/budget-editor/agent-budget-sheet";
import { useBudgetEditor } from "@/components/agent/hooks/use-budget-editor";
import { AgentEmptyState } from "@/components/agent/agent-empty-state";
import { AgentErrorBanner } from "@/components/agent/agent-error-banner";
import { AgentMessageList } from "@/components/agent/agent-message-list";
import { useAgentChat } from "@/components/agent/hooks/use-agent-chat";
import { useAgentProposalMutations } from "@/components/agent/hooks/use-agent-proposal-mutations";
import { useAgentProposals } from "@/components/agent/hooks/use-agent-queries";
import type { TurnNotice } from "@/components/agent/hooks/use-agent-session";
import type { AgentUIMessage } from "@/components/agent/types";
import { isSavableBudgetPartType } from "@/lib/agent/budget-draft";
import { readAgentError } from "@/lib/agent/chat-request";
import type { ProposalResult } from "@/lib/agent/proposals";
import { DEFAULT_AGENT_SKILL } from "@/lib/agent/skills";
import type { AgentMode } from "@/lib/ai/modes";
import type { AgentBudgetContextInput } from "@/schemas/agent";

// Propuestas o presupuestos que se pueden guardar desde el editor: sin
// ninguno no hace falta leer el estado vivo de las propuestas.
const hasProposalParts = (messages: AgentUIMessage[]) =>
  messages.some((message) =>
    message.parts.some((part) => part.type.startsWith("tool-propose") || isSavableBudgetPartType(part.type))
  );

// Una conversación: mensajes con sus tarjetas, aviso de error y composer. Los
// mensajes van con la habilidad general (todas las tools). No sabe en qué
// pantalla está: el contexto llega como función.
export function AgentChat({
  conversationId,
  chat,
  mode,
  notices,
  contextLabel,
  getContext,
  onProposalConfirmed,
}: {
  conversationId: string;
  chat: Chat<AgentUIMessage>;
  mode: AgentMode;
  notices: Record<string, TurnNotice>;
  contextLabel: string;
  getContext: () => AgentBudgetContextInput | undefined;
  onProposalConfirmed?: (result: ProposalResult | null) => void;
}) {
  const view = useAgentChat({ chat, mode, getContext });
  const proposals = useAgentProposals(conversationId, hasProposalParts(view.messages));
  const { confirm, reject } = useAgentProposalMutations({ conversationId, onConfirmed: onProposalConfirmed });
  const editor = useBudgetEditor();
  const errorMessage = readAgentError(view.error);
  const byCall = new Map((proposals.data ?? []).map((item) => [item.toolCallId, item]));

  return (
    <AgentChatProvider
      value={{
        proposals: proposals.data ? new Map(proposals.data.map((item) => [item.id, item])) : null,
        busyProposalId: confirm.isPending ? confirm.variables : reject.isPending ? reject.variables : null,
        confirmProposal: (proposalId) => confirm.mutate(proposalId),
        rejectProposal: (proposalId) => reject.mutate(proposalId),
        proposalForCall: (toolCallId) => byCall.get(toolCallId),
        openBudget: editor.openBudget,
        hasBudgetDraft: editor.hasDraft,
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
          className="border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] in-data-agent-page:app-tabs:pb-3"
        >
          <div className="mx-auto max-w-3xl">
            <AgentComposer
              busy={view.busy}
              onSend={(text) => view.send(text, DEFAULT_AGENT_SKILL)}
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
    </AgentChatProvider>
  );
}
