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

// Un dictado: se cobra por segundo de audio, sin tokens. Va a la conversación
// si ya existe; el primer mensaje de una nueva todavía no la tiene y queda
// solo en el gasto del mes.
export const persistTranscriptionUsage = async (input: {
  conversationId: string | null;
  mode: AgentMode;
  modelId: string;
  seconds: number;
  costUsd: number | null;
  priced: boolean;
}) => {
  await db.agentUsageEvent.create({
    data: {
      conversationId: input.conversationId,
      messageId: null,
      kind: "TRANSCRIPTION",
      mode: toDbAgentMode(input.mode),
      modelId: input.modelId,
      reasoning: null,
      audioSeconds: Math.ceil(input.seconds),
      costUsd: input.costUsd === null ? null : new Prisma.Decimal(input.costUsd),
      priced: input.priced,
    },
  });
};
