import "server-only";

import { Prisma } from "@prisma/client";

import { groupUsageEntries, type UsageEntry } from "@/lib/agent/usage-collector";
import { toDbAgentMode } from "@/lib/agent/conversation-mode";
import type { AgentMode } from "@/lib/ai/modes";
import { db } from "@/lib/db";

// Un AgentUsageEvent por tipo, modelo y razonamiento. El costo se fija ahora:
// si después cambian los precios, el histórico no se mueve.
export const persistUsageEntries = async ({
  conversationId,
  messageId,
  mode,
  entries,
}: {
  conversationId: string;
  messageId: string | null;
  mode: AgentMode;
  entries: UsageEntry[];
}) => {
  const groups = groupUsageEntries(entries);
  if (!groups.length) return;

  await db.agentUsageEvent.createMany({
    data: groups.map((group) => ({
      conversationId,
      messageId,
      kind: group.kind,
      mode: toDbAgentMode(mode),
      modelId: group.modelId,
      reasoning: group.reasoning,
      inputTokens: group.usage.inputTokens,
      outputTokens: group.usage.outputTokens,
      cachedInputTokens: group.usage.cachedInputTokens,
      cacheWriteTokens: group.usage.cacheWriteTokens,
      reasoningTokens: group.usage.reasoningTokens,
      costUsd: group.costUsd === null ? null : new Prisma.Decimal(group.costUsd),
      priced: group.priced,
    })),
  });
};
