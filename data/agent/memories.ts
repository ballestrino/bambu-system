import "server-only";

import type { Prisma } from "@prisma/client";

import { MEMORY_PROMPT_CAP, type AgentMemoryKind } from "@/lib/agent/memory";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

// Lecturas de la memoria del agente. Es del equipo: cualquier admin la ve.
const activeWhere = (now: Date): Prisma.AgentMemoryWhereInput => ({
  OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
});

const promptSelect = { id: true, kind: true, text: true, expiresAt: true } as const;

// Las vigentes que entran al prompt, las más recientes primero, y cuántas hay
// en total: con más que el tope, el prompt avisa que searchMemory busca el
// resto.
export const getPromptMemories = async () => {
  await requireAdminSession();
  const where = activeWhere(new Date());
  const [memories, total] = await Promise.all([
    db.agentMemory.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: MEMORY_PROMPT_CAP,
      select: promptSelect,
    }),
    db.agentMemory.count({ where }),
  ]);
  return { memories, total };
};

export const MEMORY_SEARCH_LIMIT = 15;

// Cada palabra tiene que estar en el texto, sin importar mayúsculas.
export const searchAgentMemories = async (input: { query?: string; kind?: AgentMemoryKind }) => {
  await requireAdminSession();
  const words = (input.query ?? "").split(/\s+/).filter((word) => word.length > 1).slice(0, 6);
  return db.agentMemory.findMany({
    where: {
      AND: [
        activeWhere(new Date()),
        ...(input.kind ? [{ kind: input.kind }] : []),
        ...words.map((word) => ({ text: { contains: word, mode: "insensitive" as const } })),
      ],
    },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: MEMORY_SEARCH_LIMIT,
    select: promptSelect,
  });
};

// La que reemplaza una propuesta: su texto de ahora y su updatedAt.
export const getAgentMemoryState = async (id: string) => {
  await requireAdminSession();
  return db.agentMemory.findUnique({
    where: { id },
    select: { id: true, kind: true, text: true, updatedAt: true },
  });
};

// La pantalla de Memoria: todas, también las vencidas, con quién la propuso,
// quién la confirmó y de qué conversación salió.
export const listAgentMemories = async () => {
  await requireAdminSession();
  const rows = await db.agentMemory.findMany({
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: 500,
    select: {
      ...promptSelect,
      approvedAt: true,
      updatedAt: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      sourceConversation: { select: { id: true, title: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    text: row.text,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    approvedAt: row.approvedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy?.name ?? null,
    approvedBy: row.approvedBy?.name ?? null,
    conversation: row.sourceConversation,
  }));
};

export type AgentMemoryRow = Awaited<ReturnType<typeof listAgentMemories>>[number];
