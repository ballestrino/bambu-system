import "server-only";

import { isSavableBudgetPartType } from "@/lib/agent/budget-draft";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

type StoredToolPart = { type?: unknown; toolCallId?: unknown; state?: unknown; output?: unknown };

// La llamada a tool que armó un presupuesto, buscada en las respuestas
// guardadas de una conversación del usuario. null si no existe (por ejemplo,
// se descartó al regenerar), no es de un presupuesto o falló.
export const findSavableBudgetCall = async (input: {
  conversationId: string;
  toolCallId: string;
  userId: string;
}) => {
  await requireAdminSession();
  const messages = await db.agentMessage.findMany({
    where: {
      conversationId: input.conversationId,
      role: "ASSISTANT",
      conversation: { userId: input.userId },
    },
    select: { parts: true },
  });
  for (const message of messages) {
    const parts = Array.isArray(message.parts) ? (message.parts as StoredToolPart[]) : [];
    const part = parts.find((item) => item?.toolCallId === input.toolCallId);
    if (!part) continue;
    const output = part.output as { ok?: unknown } | undefined;
    const savable =
      typeof part.type === "string" &&
      isSavableBudgetPartType(part.type) &&
      part.state === "output-available" &&
      output?.ok === true;
    return savable ? { type: part.type as string } : null;
  }
  return null;
};
