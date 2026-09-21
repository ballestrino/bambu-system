"use server";

import { getConversationCost, getMonthlyAgentCost } from "@/data/agent/usage";
import { getCurrentMonthKey, isMonthKey } from "@/lib/agent/month";
import {
  AdminAuthorizationError,
  requireAdminSession,
} from "@/lib/require-admin-session";
import { agentClientIdSchema } from "@/schemas/agent";

const actionError = (error: unknown, fallback: string) =>
  error instanceof AdminAuthorizationError ? error.message : fallback;

// Costo de una conversación del usuario. Una conversación que todavía no
// tiene mensajes no existe en la base: cost es null.
export const getAgentConversationCost = async (conversationId: unknown) => {
  try {
    await requireAdminSession();
    const parsed = agentClientIdSchema.safeParse(conversationId);
    if (!parsed.success) return { error: "Conversación inválida" };
    return { cost: await getConversationCost(parsed.data) };
  } catch (error) {
    console.error("Error getting agent conversation cost:", error);
    return { error: actionError(error, "Error al obtener el costo de la conversación") };
  }
};

// Gasto del equipo en un mes ("AAAA-MM"; sin mes, el actual en Montevideo).
// Devuelve el mes que usó, así el cliente navega sin leer su propio reloj.
export const getAgentMonthlyCost = async (month: unknown) => {
  try {
    await requireAdminSession();
    if (month != null && (typeof month !== "string" || !isMonthKey(month))) {
      return { error: "Mes inválido" };
    }
    return { cost: await getMonthlyAgentCost(month ?? getCurrentMonthKey()) };
  } catch (error) {
    console.error("Error getting monthly agent cost:", error);
    return { error: actionError(error, "Error al obtener el gasto del mes") };
  }
};
