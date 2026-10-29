import { createHash } from "node:crypto";

export type AiSafetyNamespace = "agent";

// Identificador seudónimo por usuario que OpenAI usa para detectar abuso sin
// recibir el id real. El namespace separa los usos (antes había "mail", del
// agente de correo que se quitó en la feature 32).
export const getAiSafetyIdentifier = (namespace: AiSafetyNamespace, actorId: string) =>
  createHash("sha256")
    .update(`bambu-${namespace}:${actorId}`)
    .digest("hex")
    .slice(0, 64);
