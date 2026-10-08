import "server-only";

import type { MessageUsageSample } from "@/lib/agent/message-cost-estimate";
import { db } from "@/lib/db";

const SAMPLE_WINDOW_DAYS = 60;

// Uso de cada mensaje del equipo en los últimos 60 días, para estimar cuánto
// cuesta un mensaje en cada modo. Los títulos no cuentan: no dependen del modo.
export const getRecentMessageUsage = async (): Promise<MessageUsageSample[]> => {
  const since = new Date(Date.now() - SAMPLE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const groups = await db.agentUsageEvent.groupBy({
    by: ["messageId", "kind", "modelId", "reasoning"],
    where: { createdAt: { gte: since }, messageId: { not: null }, kind: { in: ["TURN", "SKILL"] } },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      cachedInputTokens: true,
      cacheWriteTokens: true,
      reasoningTokens: true,
      costUsd: true,
    },
  });

  const byMessage = new Map<string, MessageUsageSample & { hasTurn: boolean }>();
  for (const group of groups) {
    if (!group.messageId) continue;
    const sample = byMessage.get(group.messageId) ?? {
      modelId: group.modelId,
      reasoning: group.reasoning,
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
      cacheWriteTokens: 0,
      reasoningTokens: 0,
      hasTurn: false,
    };
    // El modelo del mensaje es el del turno; una habilidad puede usar otro.
    if (group.kind === "TURN" && !sample.hasTurn) {
      sample.modelId = group.modelId;
      sample.reasoning = group.reasoning;
      sample.hasTurn = true;
    }
    sample.inputTokens += group._sum.inputTokens ?? 0;
    sample.outputTokens += group._sum.outputTokens ?? 0;
    sample.cachedInputTokens += group._sum.cachedInputTokens ?? 0;
    sample.cacheWriteTokens += group._sum.cacheWriteTokens ?? 0;
    sample.reasoningTokens += group._sum.reasoningTokens ?? 0;
    // Un consumo sin precio deja el mensaje sin costo real.
    sample.costUsd =
      sample.costUsd === null || group._sum.costUsd === null
        ? null
        : sample.costUsd + Number(group._sum.costUsd);
    byMessage.set(group.messageId, sample);
  }

  return [...byMessage.values()]
    .filter((sample) => sample.hasTurn)
    .map((sample) => ({
      modelId: sample.modelId,
      reasoning: sample.reasoning,
      costUsd: sample.costUsd,
      inputTokens: sample.inputTokens,
      outputTokens: sample.outputTokens,
      cachedInputTokens: sample.cachedInputTokens,
      cacheWriteTokens: sample.cacheWriteTokens,
      reasoningTokens: sample.reasoningTokens,
    }));
};
