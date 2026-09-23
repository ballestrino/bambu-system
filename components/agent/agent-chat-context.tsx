"use client";

import { createContext, useContext } from "react";

import type { BudgetEditorTab, BudgetEditorTarget } from "@/components/agent/hooks/use-budget-editor";
import type { AgentProposalDto } from "@/lib/agent/proposals";

// Lo que las tarjetas necesitan de la conversación sin pasarlo por cada
// nivel: el estado vivo de las propuestas, cómo confirmarlas o rechazarlas, y
// el editor de los presupuestos que armó el agente.
export type AgentChatContextValue = {
  // null mientras se lee: la tarjeta no ofrece confirmar sin el estado vivo.
  proposals: Map<string, AgentProposalDto> | null;
  busyProposalId: string | null;
  confirmProposal: (proposalId: string) => void;
  rejectProposal: (proposalId: string) => void;
  // La propuesta de una llamada a tool: la del agente, o la que dejó guardar
  // un cálculo desde el editor.
  proposalForCall: (toolCallId: string) => AgentProposalDto | undefined;
  openBudget: (target: BudgetEditorTarget, tab: BudgetEditorTab) => void;
  hasBudgetDraft: (toolCallId: string) => boolean;
};

const AgentChatContext = createContext<AgentChatContextValue | null>(null);

export const AgentChatProvider = AgentChatContext.Provider;

export const useAgentChatContext = () => {
  const value = useContext(AgentChatContext);
  if (!value) throw new Error("useAgentChatContext se usa dentro de AgentChat");
  return value;
};
