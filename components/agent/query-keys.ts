import { conversationScopeKey, type AgentConversationScope } from "@/lib/agent/conversation-scope";

export const agentKeys = {
  all: ["agent"] as const,
  settings: () => [...agentKeys.all, "settings"] as const,
  conversations: () => [...agentKeys.all, "conversations"] as const,
  conversationList: (scope: AgentConversationScope) =>
    [...agentKeys.conversations(), conversationScopeKey(scope)] as const,
  conversation: (id: string) => [...agentKeys.all, "conversation", id] as const,
  proposals: (conversationId: string) => [...agentKeys.all, "proposals", conversationId] as const,
  usage: (conversationId: string) => [...agentKeys.all, "usage", conversationId] as const,
  monthlyUsages: () => [...agentKeys.all, "monthly-usage"] as const,
  monthlyUsage: (month: string | null) => [...agentKeys.monthlyUsages(), month ?? "actual"] as const,
};
