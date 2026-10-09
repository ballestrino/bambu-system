import type { AgentUIMessage } from "@/lib/agent/messages";
import { getModelVendor } from "@/lib/ai/model-spec";

// El razonamiento de los turnos anteriores que se le manda al modelo. Puro:
// lo prueba check:ai-gateway.
//
// Claude ata cada bloque de pensamiento al modelo y a la conversación exacta
// que lo produjo (system, tools y mensajes previos). El agente no manda un
// historial append-only: el prompt lleva el estado vivo de las propuestas, las
// salidas propose* se reescriben (withLiveProposals), las imágenes viejas
// pasan a ser un aviso y la ventana es de 24 mensajes. Un bloque reenviado
// sobre un historial cambiado da 400 en las cuentas nuevas, así que a Claude
// no se le reenvía el pensamiento de turnos anteriores (el texto y las tools
// sí). Dentro del turno el SDK sí lo reenvía entre pasos: ahí el historial no
// cambia. Con drop_block (lib/ai/call-settings.ts) un bloque que igual no
// corresponda se descarta en vez de fallar.
//
// OpenAI saltea el razonamiento de Claude con un aviso: se saca antes.
const isClaudeReasoning = (part: AgentUIMessage["parts"][number]) =>
  part.type === "reasoning" && Boolean(part.providerMetadata?.anthropic);

export const prepareHistoryForModel = (messages: AgentUIMessage[], modelId: string) => {
  const dropPart =
    getModelVendor(modelId) === "anthropic"
      ? (part: AgentUIMessage["parts"][number]) => part.type === "reasoning"
      : isClaudeReasoning;
  return messages.map((message) =>
    message.role === "assistant" && message.parts.some(dropPart)
      ? { ...message, parts: message.parts.filter((part) => !dropPart(part)) }
      : message
  );
};
