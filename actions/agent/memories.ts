"use server";

import { listAgentMemories } from "@/data/agent/memories";
import { recordAgentAudit } from "@/lib/agent/audit";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { agentMemoryIdSchema, updateAgentMemorySchema } from "@/schemas/agent-memory";

// La pantalla de Memoria: cualquier admin la lee y la edita (es del equipo).
// Toda escritura queda auditada con el texto de antes, por si hay que volver.
const toError = (error: unknown, fallback: string) => {
  if (error instanceof AdminAuthorizationError) return { error: error.message };
  console.error(`${fallback}:`, error);
  return { error: fallback };
};

const NOT_FOUND = { error: "Esa memoria ya no existe." };

const findMemory = (id: string) =>
  db.agentMemory.findUnique({ where: { id }, select: { kind: true, text: true, expiresAt: true } });

export const getAgentMemories = async () => {
  try {
    return { memories: await listAgentMemories() };
  } catch (error) {
    return toError(error, "No se pudo leer la memoria");
  }
};

export const updateAgentMemory = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = updateAgentMemorySchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Memoria inválida" };
    const { id, kind, text, expiresOn } = parsed.data;
    const before = await findMemory(id);
    if (!before) return NOT_FOUND;
    await db.agentMemory.update({
      where: { id },
      data: { kind, text, expiresAt: expiresOn ? new Date(`${expiresOn}T23:59:59.999Z`) : null },
    });
    await recordAgentAudit({
      actorId: session.user.id,
      action: "memory.update",
      entityType: "AgentMemory",
      entityId: id,
      metadata: { kind, previousKind: before.kind, previousText: before.text, via: "screen" },
    });
    return { success: "Memoria guardada" };
  } catch (error) {
    return toError(error, "No se pudo guardar la memoria");
  }
};

// Vencer es dejar de usarla sin borrarla: queda en la pantalla como vencida.
export const expireAgentMemory = async (memoryId: unknown) => {
  try {
    const session = await requireAdminSession();
    const id = agentMemoryIdSchema.safeParse(memoryId);
    if (!id.success) return { error: "Memoria inválida" };
    const now = new Date();
    const { count } = await db.agentMemory.updateMany({ where: { id: id.data }, data: { expiresAt: now } });
    if (!count) return NOT_FOUND;
    await recordAgentAudit({
      actorId: session.user.id,
      action: "memory.expire",
      entityType: "AgentMemory",
      entityId: id.data,
    });
    return { success: "La memoria venció: el agente ya no la usa" };
  } catch (error) {
    return toError(error, "No se pudo vencer la memoria");
  }
};

export const deleteAgentMemory = async (memoryId: unknown) => {
  try {
    const session = await requireAdminSession();
    const id = agentMemoryIdSchema.safeParse(memoryId);
    if (!id.success) return { error: "Memoria inválida" };
    const before = await findMemory(id.data);
    if (!before) return NOT_FOUND;
    await db.agentMemory.delete({ where: { id: id.data } });
    await recordAgentAudit({
      actorId: session.user.id,
      action: "memory.delete",
      entityType: "AgentMemory",
      entityId: id.data,
      metadata: { kind: before.kind, text: before.text, expiresAt: before.expiresAt?.toISOString() ?? null },
    });
    return { success: "Memoria eliminada" };
  } catch (error) {
    return toError(error, "No se pudo eliminar la memoria");
  }
};
