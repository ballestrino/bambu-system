"use server";

import { listInstructionVersions } from "@/data/agent/instructions";
import { restoreInstructionVersion } from "@/lib/agent/instruction-store";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { restoreInstructionVersionSchema } from "@/schemas/agent-instructions";

// La pantalla de instrucciones del equipo: ver las versiones y restaurar una.
// Restaurar guarda una versión nueva (auditada) con las reglas de la elegida.
const toError = (error: unknown, fallback: string) => {
  if (error instanceof AdminAuthorizationError) return { error: error.message };
  console.error(`${fallback}:`, error);
  return { error: fallback };
};

export const getAgentInstructionVersions = async () => {
  try {
    return { versions: await listInstructionVersions() };
  } catch (error) {
    return toError(error, "No se pudieron leer las instrucciones");
  }
};

export const restoreAgentInstructions = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = restoreInstructionVersionSchema.safeParse(input);
    if (!parsed.success) return { error: "Versión inválida" };
    const outcome = await restoreInstructionVersion({ ...parsed.data, actorId: session.user.id });
    if (!outcome.ok) return { error: outcome.error };
    return { success: `Se restauró la versión ${parsed.data.version} como versión ${outcome.result.instructionVersion}` };
  } catch (error) {
    return toError(error, "No se pudo restaurar la versión");
  }
};
