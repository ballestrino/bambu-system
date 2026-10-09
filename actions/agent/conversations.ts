"use server";

import { z } from "zod";

import { getAgentConversation, getAgentConversations } from "@/data/agent/conversations";
import { getConversationCostTotals } from "@/data/agent/usage";
import { recordAgentAudit } from "@/lib/agent/audit";
import { toDbAgentMode } from "@/lib/agent/conversation-mode";
import { db } from "@/lib/db";
import {
  AdminAuthorizationError,
  requireAdminSession,
} from "@/lib/require-admin-session";
import {
  agentClientIdSchema,
  agentConversationListSchema,
  agentConversationTitleSchema,
  agentModeSchema,
} from "@/schemas/agent";

const actionError = (error: unknown, fallback: string) =>
  error instanceof AdminAuthorizationError ? error.message : fallback;

// El historial del Sheet y de la página: conversaciones del usuario con su
// costo acumulado y cuántos registros de uso no tenían precio.
export const listAgentConversations = async (values: unknown) => {
  try {
    await requireAdminSession();
    const parsed = agentConversationListSchema.safeParse(values ?? {});
    if (!parsed.success) return { error: "Filtros inválidos" };
    const conversations = await getAgentConversations(parsed.data);
    const costs = await getConversationCostTotals(conversations.map(({ id }) => id));
    return {
      conversations: conversations.map((conversation) => ({
        ...conversation,
        costUsd: costs[conversation.id]?.costUsd ?? 0,
        unpricedEvents: costs[conversation.id]?.unpricedEvents ?? 0,
      })),
    };
  } catch (error) {
    console.error("Error listing agent conversations:", error);
    return { error: actionError(error, "Error al obtener las conversaciones") };
  }
};

export const getAgentConversationAction = async (conversationId: unknown) => {
  try {
    await requireAdminSession();
    const parsed = agentClientIdSchema.safeParse(conversationId);
    if (!parsed.success) return { error: "Conversación inválida" };
    const conversation = await getAgentConversation(parsed.data);
    return conversation ?? { error: "Conversación no encontrada" };
  } catch (error) {
    console.error("Error getting agent conversation:", error);
    return { error: actionError(error, "Error al abrir la conversación") };
  }
};

const renameSchema = z.object({ id: agentClientIdSchema, title: agentConversationTitleSchema });

// Todas las escrituras filtran por userId: una conversación ajena no existe.
export const renameAgentConversation = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = renameSchema.safeParse(values);
    if (!parsed.success) return { error: "Título inválido" };
    const { count } = await db.agentConversation.updateMany({
      where: { id: parsed.data.id, userId: session.user.id },
      data: { title: parsed.data.title },
    });
    if (!count) return { error: "Conversación no encontrada" };
    await recordAgentAudit({
      actorId: session.user.id,
      action: "conversation.rename",
      entityType: "AgentConversation",
      entityId: parsed.data.id,
    });
    return { success: "Conversación renombrada" };
  } catch (error) {
    console.error("Error renaming agent conversation:", error);
    return { error: actionError(error, "Error al renombrar la conversación") };
  }
};

// Borra la conversación y sus mensajes. El consumo queda (SET NULL) para que
// el gasto del mes no cambie.
export const deleteAgentConversation = async (conversationId: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = agentClientIdSchema.safeParse(conversationId);
    if (!parsed.success) return { error: "Conversación inválida" };
    const { count } = await db.agentConversation.deleteMany({
      where: { id: parsed.data, userId: session.user.id },
    });
    if (!count) return { error: "Conversación no encontrada" };
    await recordAgentAudit({
      actorId: session.user.id,
      action: "conversation.delete",
      entityType: "AgentConversation",
      entityId: parsed.data,
    });
    return { success: "Conversación borrada" };
  } catch (error) {
    console.error("Error deleting agent conversation:", error);
    return { error: actionError(error, "Error al borrar la conversación") };
  }
};

const modeSchema = z.object({ id: agentClientIdSchema, mode: agentModeSchema });

export const setAgentConversationMode = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = modeSchema.safeParse(values);
    if (!parsed.success) return { error: "Modo inválido" };
    const { count } = await db.agentConversation.updateMany({
      where: { id: parsed.data.id, userId: session.user.id },
      data: { mode: toDbAgentMode(parsed.data.mode) },
    });
    if (!count) return { error: "Conversación no encontrada" };
    await recordAgentAudit({
      actorId: session.user.id,
      action: "conversation.mode",
      entityType: "AgentConversation",
      entityId: parsed.data.id,
      metadata: { mode: parsed.data.mode },
    });
    return { success: "Modo actualizado", mode: parsed.data.mode };
  } catch (error) {
    console.error("Error setting agent conversation mode:", error);
    return { error: actionError(error, "Error al cambiar el modo") };
  }
};

const pinSchema = z.object({ id: agentClientIdSchema, pinned: z.boolean() });

// Fijar deja la conversación arriba del historial, en "Fijados".
export const setAgentConversationPinned = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = pinSchema.safeParse(values);
    if (!parsed.success) return { error: "Conversación inválida" };
    const { count } = await db.agentConversation.updateMany({
      where: { id: parsed.data.id, userId: session.user.id },
      data: { pinnedAt: parsed.data.pinned ? new Date() : null },
    });
    if (!count) return { error: "Conversación no encontrada" };
    await recordAgentAudit({
      actorId: session.user.id,
      action: parsed.data.pinned ? "conversation.pin" : "conversation.unpin",
      entityType: "AgentConversation",
      entityId: parsed.data.id,
    });
    return { success: parsed.data.pinned ? "Conversación fijada" : "Conversación desfijada" };
  } catch (error) {
    console.error("Error pinning agent conversation:", error);
    return { error: actionError(error, "Error al fijar la conversación") };
  }
};
