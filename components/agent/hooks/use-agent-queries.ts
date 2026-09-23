"use client";

import { useQuery } from "@tanstack/react-query";

import {
  agentSettingsQuery,
  conversationCostQuery,
  conversationListQuery,
  monthlyCostQuery,
  proposalsQuery,
} from "@/components/agent/queries";
import type { AgentConversationScope } from "@/lib/agent/conversation-scope";
import { hasRunningProposal } from "@/lib/agent/proposal-outcome";

export const useAgentSettings = (enabled = true) => useQuery({ ...agentSettingsQuery(), enabled });

export const useAgentConversations = (scope: AgentConversationScope, enabled = true) =>
  useQuery({ ...conversationListQuery(scope), enabled });

const PROPOSAL_POLL_MS = 3000;

// El estado vivo de las propuestas: la salida guardada de la tool dice
// PENDING para siempre. Mientras una se ejecuta (quizás en otra pestaña) se
// relee; una EXECUTING vieja tiene resultado desconocido y ya no cambia sola
// (hasRunningProposal).
export const useAgentProposals = (conversationId: string, enabled: boolean) =>
  useQuery({
    ...proposalsQuery(conversationId),
    enabled,
    refetchInterval: (query) => (hasRunningProposal(query.state.data) ? PROPOSAL_POLL_MS : false),
  });

export const useConversationCost = (conversationId: string | null, enabled: boolean) =>
  useQuery({ ...conversationCostQuery(conversationId ?? ""), enabled: enabled && Boolean(conversationId) });

export const useMonthlyAgentCost = (month: string | null, enabled: boolean) =>
  useQuery({ ...monthlyCostQuery(month), enabled });
