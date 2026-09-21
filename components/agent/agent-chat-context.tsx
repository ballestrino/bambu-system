"use client";

import { createContext, useContext } from "react";

import type { AgentProposalDto } from "@/lib/agent/proposals";

// Lo que las tarjetas necesitan de la conversación sin pasarlo por cada
// nivel: el estado vivo de las propuestas y cómo confirmarlas o rechazarlas.
export type AgentChatContextValue = {
  // null mientras se lee: la tarjeta no ofrece confirmar sin el estado vivo.
  proposals: Map<string, AgentProposalDto> | null;
  busyProposalId: string | null;
  confirmProposal: (proposalId: string) => void;
  rejectProposal: (proposalId: string) => void;
};

const AgentChatContext = createContext<AgentChatContextValue | null>(null);

export const AgentChatProvider = AgentChatContext.Provider;

export const useAgentChatContext = () => {
  const value = useContext(AgentChatContext);
  if (!value) throw new Error("useAgentChatContext se usa dentro de AgentChat");
  return value;
};
