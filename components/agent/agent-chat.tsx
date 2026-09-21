"use client";

import type { Chat } from "@ai-sdk/react";

import { AgentChatProvider } from "@/components/agent/agent-chat-context";
import { AgentComposer } from "@/components/agent/agent-composer";
import { AgentEmptyState } from "@/components/agent/agent-empty-state";
import { AgentErrorBanner } from "@/components/agent/agent-error-banner";
import { AgentMessageList } from "@/components/agent/agent-message-list";
import { AgentSkillChips } from "@/components/agent/agent-skill-chips";
import { useAgentChat } from "@/components/agent/hooks/use-agent-chat";
import { useAgentProposalMutations } from "@/components/agent/hooks/use-agent-proposal-mutations";
import { useAgentProposals } from "@/components/agent/hooks/use-agent-queries";
import type { TurnNotice } from "@/components/agent/hooks/use-agent-session";
import type { AgentUIMessage } from "@/components/agent/types";
import { readAgentError } from "@/lib/agent/chat-request";
import type { ProposalResult } from "@/lib/agent/proposals";
import type { AgentSkillId } from "@/lib/agent/skills";
import type { AgentMode } from "@/lib/ai/modes";
import type { AgentBudgetContextInput } from "@/schemas/agent";

const hasProposalParts = (messages: AgentUIMessage[]) =>
  messages.some((message) => message.parts.some((part) => part.type.startsWith("tool-propose")));

// Una conversación: mensajes con sus tarjetas, aviso de error, habilidades y
// composer. No sabe en qué pantalla está: el contexto llega como función.
export function AgentChat({
  conversationId,
  chat,
  mode,
  skill,
  onSkillChange,
  notices,
  contextLabel,
  getContext,
  onProposalConfirmed,
}: {
  conversationId: string;
  chat: Chat<AgentUIMessage>;
  mode: AgentMode;
  skill: AgentSkillId;
  onSkillChange: (skill: AgentSkillId) => void;
  notices: Record<string, TurnNotice>;
  contextLabel: string;
  getContext: () => AgentBudgetContextInput | undefined;
  onProposalConfirmed?: (result: ProposalResult | null) => void;
}) {
  const view = useAgentChat({ chat, mode, getContext });
  const proposals = useAgentProposals(conversationId, hasProposalParts(view.messages));
  const { confirm, reject } = useAgentProposalMutations({ conversationId, onConfirmed: onProposalConfirmed });
  const errorMessage = readAgentError(view.error);

  return (
    <AgentChatProvider
      value={{
        proposals: proposals.data ? new Map(proposals.data.map((item) => [item.id, item])) : null,
        busyProposalId: confirm.isPending ? confirm.variables : reject.isPending ? reject.variables : null,
        confirmProposal: (proposalId) => confirm.mutate(proposalId),
        rejectProposal: (proposalId) => reject.mutate(proposalId),
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <AgentMessageList
          messages={view.messages}
          status={view.status}
          notices={notices}
          onRetry={view.canRetry ? view.retry : undefined}
          emptyState={
            <AgentEmptyState
              skill={skill}
              contextLabel={contextLabel}
              onSuggestion={(text) => view.send(text, skill)}
            />
          }
        />
        {errorMessage && (
          <AgentErrorBanner
            message={errorMessage}
            onRetry={view.canRetry ? view.retry : undefined}
            onDismiss={view.clearError}
          />
        )}
        <div className="space-y-2 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <AgentSkillChips value={skill} onChange={onSkillChange} />
          <AgentComposer busy={view.busy} onSend={(text) => view.send(text, skill)} onStop={view.stop} />
        </div>
      </div>
    </AgentChatProvider>
  );
}
