import "server-only";

import type { Prisma } from "@prisma/client";

import { fromDbRecordedMode } from "@/lib/agent/conversation-mode";
import { getZonedMonthRange } from "@/lib/agent/month";
import { buildMonthlyCostRows } from "@/lib/agent/usage-rows";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

const sumFields = {
  inputTokens: true,
  outputTokens: true,
  cachedInputTokens: true,
  cacheWriteTokens: true,
  reasoningTokens: true,
  costUsd: true,
} as const;

type UsageSums = {
  _sum: {
    inputTokens: number | null;
    outputTokens: number | null;
    cachedInputTokens: number | null;
    cacheWriteTokens: number | null;
    reasoningTokens: number | null;
    costUsd: Prisma.Decimal | null;
  };
  _count: { _all: number };
};

const toCostRow = ({ _sum, _count }: UsageSums) => ({
  inputTokens: _sum.inputTokens ?? 0,
  outputTokens: _sum.outputTokens ?? 0,
  cachedInputTokens: _sum.cachedInputTokens ?? 0,
  cacheWriteTokens: _sum.cacheWriteTokens ?? 0,
  reasoningTokens: _sum.reasoningTokens ?? 0,
  costUsd: _sum.costUsd === null ? 0 : Number(_sum.costUsd),
  // Postgres suma NULL como NULL: ningún registro del grupo tenía precio. La
  // UI dice "sin precio" en vez de mostrar US$ 0,00.
  priced: _sum.costUsd !== null,
  events: _count._all,
});

type CostRow = ReturnType<typeof toCostRow>;

const totalOf = (rows: CostRow[]) =>
  rows.reduce(
    (total, row) => ({
      inputTokens: total.inputTokens + row.inputTokens,
      outputTokens: total.outputTokens + row.outputTokens,
      costUsd: Math.round((total.costUsd + row.costUsd) * 1_000_000) / 1_000_000,
      events: total.events + row.events,
    }),
    { inputTokens: 0, outputTokens: 0, costUsd: 0, events: 0 }
  );

// Costo de una conversación del usuario, por tipo (turno, habilidad, título),
// modelo y razonamiento. unpricedEvents cuenta el uso sin precio configurado.
export const getConversationCost = async (conversationId: string) => {
  const session = await requireAdminSession();
  const owned = await db.agentConversation.count({
    where: { id: conversationId, userId: session.user.id },
  });
  if (!owned) return null;

  const where = { conversationId };
  const [groups, unpricedEvents] = await Promise.all([
    db.agentUsageEvent.groupBy({
      by: ["kind", "modelId", "reasoning"],
      where,
      _sum: sumFields,
      _count: { _all: true },
    }),
    db.agentUsageEvent.count({ where: { ...where, priced: false } }),
  ]);
  const rows = groups.map((group) => ({
    kind: group.kind,
    modelId: group.modelId,
    reasoning: group.reasoning,
    ...toCostRow(group),
  }));
  return { conversationId, rows, total: totalOf(rows), unpricedEvents };
};

// Total por conversación, para mostrarlo en cada fila del historial.
export const getConversationCostTotals = async (conversationIds: string[]) => {
  await requireAdminSession();
  if (!conversationIds.length) return {};
  const groups = await db.agentUsageEvent.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: conversationIds } },
    _sum: sumFields,
    // _count.costUsd cuenta los registros con precio: el resto no lo tenía.
    _count: { _all: true, costUsd: true },
  });
  return Object.fromEntries(
    groups.flatMap((group) =>
      group.conversationId
        ? [[group.conversationId, { ...toCostRow(group), unpricedEvents: group._count._all - group._count.costUsd }]]
        : []
    )
  ) as Record<string, CostRow & { unpricedEvents: number }>;
};

// Gasto del mes (en Montevideo) de todo el equipo, por modelo, razonamiento y
// modo, con los títulos aparte (buildMonthlyCostRows). Incluye
// el uso de conversaciones borradas. El top 10 ordena por costo con precio y
// muestra el título solo de las conversaciones propias.
export const getMonthlyAgentCost = async (monthKey: string) => {
  const session = await requireAdminSession();
  const range = getZonedMonthRange(monthKey);
  const where = { createdAt: { gte: range.start, lte: range.end } };

  const [byModel, byConversation, unpricedEvents] = await Promise.all([
    db.agentUsageEvent.groupBy({
      by: ["modelId", "mode", "reasoning", "kind"],
      where,
      _sum: sumFields,
      _count: { _all: true },
    }),
    // Solo uso con precio: en DESC Postgres pone primero las sumas NULL, y una
    // conversación sin precio desplazaría a las que más gastaron. El uso sin
    // precio lo cuenta unpricedEvents.
    db.agentUsageEvent.groupBy({
      by: ["conversationId"],
      where: { ...where, conversationId: { not: null }, costUsd: { not: null } },
      _sum: { costUsd: true },
      orderBy: { _sum: { costUsd: "desc" } },
      take: 10,
    }),
    db.agentUsageEvent.count({ where: { ...where, priced: false } }),
  ]);

  const conversationIds = byConversation.flatMap((group) =>
    group.conversationId ? [group.conversationId] : []
  );
  const conversations = await db.agentConversation.findMany({
    where: { id: { in: conversationIds } },
    select: { id: true, title: true, userId: true },
  });
  const byId = new Map(conversations.map((conversation) => [conversation.id, conversation]));
  const rows = buildMonthlyCostRows(
    byModel.map((group) => ({
      kind: group.kind,
      modelId: group.modelId,
      mode: fromDbRecordedMode(group.mode),
      reasoning: group.reasoning,
      ...toCostRow(group),
    }))
  );

  return {
    month: monthKey,
    rows,
    total: totalOf(rows),
    unpricedEvents,
    topConversations: byConversation.map((group) => {
      const conversation = group.conversationId ? byId.get(group.conversationId) : undefined;
      const owned = conversation?.userId === session.user.id;
      return {
        conversationId: group.conversationId,
        title: owned ? conversation?.title ?? null : null,
        ownedByViewer: owned,
        costUsd: group._sum.costUsd === null ? 0 : Number(group._sum.costUsd),
      };
    }),
  };
};
