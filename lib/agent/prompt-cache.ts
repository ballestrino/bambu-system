import type { ModelMessage, SystemModelMessage } from "ai";

import type { AgentInstructionParts } from "@/lib/agent/system-prompt";

// Puntos de caché de Claude (OpenAI cachea solo y las ignora). Un turno usa
// tres de los cuatro que permite la API:
// 1. el final de las instrucciones fijas: tools y reglas se leen de caché
//    aunque cambien las propuestas o el contexto, que van después;
// 2. el mensaje anterior del usuario: el historial hasta ahí se lee de caché
//    aunque la última respuesta cambie (sin razonamiento, propuestas vivas);
// 3. el final del pedido, que pone `cacheControl` en call-settings.ts y lee
//    entre pasos del mismo turno.
// Puro: lo prueba check:agent-tools.
const CACHE_MARK = { type: "ephemeral" } as const;

export const buildCachedInstructions = ({ fixed, live }: AgentInstructionParts): SystemModelMessage[] => [
  { role: "system", content: fixed, providerOptions: { anthropic: { cacheControl: CACHE_MARK } } },
  ...(live ? [{ role: "system" as const, content: live }] : []),
];

export const markPreviousUserMessage = (messages: ModelMessage[]): ModelMessage[] => {
  const userIndexes = messages.flatMap((message, index) => (message.role === "user" ? [index] : []));
  const previous = userIndexes.at(-2);
  if (previous === undefined) return messages;
  return messages.map((message, index) =>
    index === previous
      ? {
          ...message,
          providerOptions: {
            ...message.providerOptions,
            anthropic: { ...message.providerOptions?.anthropic, cacheControl: CACHE_MARK },
          },
        }
      : message
  );
};
