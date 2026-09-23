import { createHash } from "node:crypto";

export type AiSafetyNamespace = "agent" | "mail";

// Identificador seudónimo por usuario que OpenAI usa para detectar abuso sin
// recibir el id real. Con "mail" da el mismo hash que getMailSafetyIdentifier
// (lib/mail-agent/openai-client.ts), que no cambia; check:ai-gateway lo asserta.
export const getAiSafetyIdentifier = (namespace: AiSafetyNamespace, actorId: string) =>
  createHash("sha256")
    .update(`bambu-${namespace}:${actorId}`)
    .digest("hex")
    .slice(0, 64);
