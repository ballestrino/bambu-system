"use server";

import { getConversationProposals } from "@/data/agent/proposals";
import { AdminAuthorizationError } from "@/lib/require-admin-session";
import { agentClientIdSchema } from "@/schemas/agent";

// Las propuestas de una conversación con su estado vivo. La tarjeta lee de
// acá: la salida guardada de la tool queda siempre en PENDING.
export const listAgentProposals = async (conversationId: unknown) => {
  try {
    const parsed = agentClientIdSchema.safeParse(conversationId);
    if (!parsed.success) return { error: "Conversación inválida" };
    return { proposals: await getConversationProposals(parsed.data) };
  } catch (error) {
    console.error("Error listing agent proposals:", error);
    return {
      error: error instanceof AdminAuthorizationError ? error.message : "Error al obtener las propuestas",
    };
  }
};
