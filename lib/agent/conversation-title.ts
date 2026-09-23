import "server-only";

import { generateText } from "ai";

import { TITLE_MAX_LENGTH } from "@/lib/agent/conversation-title-rules";
import { persistUsageEntries } from "@/lib/agent/usage-store";
import { buildAgentCallSettings } from "@/lib/ai/call-settings";
import type { AgentMode } from "@/lib/ai/modes";
import { resolveTitleModelSpec } from "@/lib/ai/model-spec";
import { normalizeUsage, readGatewayCost } from "@/lib/ai/usage";
import { db } from "@/lib/db";

const sanitizeTitle = (text: string) =>
  text
    .replace(/["“”«»*#]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.。]$/, "")
    .trim()
    .slice(0, TITLE_MAX_LENGTH);

// Corre con after() después de la respuesta: no suma tiempo al primer turno.
// Su consumo queda registrado como TITLE. Solo reemplaza el título que tenía
// la conversación al empezar el turno: un renombrado del usuario gana.
export const generateConversationTitle = async (input: {
  conversationId: string;
  actorId: string;
  mode: AgentMode;
  text: string;
  replaceTitle: string;
}) => {
  const spec = resolveTitleModelSpec();
  try {
    const result = await generateText({
      ...buildAgentCallSettings(spec, { actorId: input.actorId }),
      instructions:
        "Escribí un título de 3 a 6 palabras, en español, para una conversación que empieza con el mensaje del usuario. Solo el título, sin comillas ni punto final.",
      prompt: input.text.slice(0, 2000),
      maxOutputTokens: 60,
    });
    await persistUsageEntries({
      conversationId: input.conversationId,
      messageId: null,
      mode: input.mode,
      entries: [
        {
          kind: "TITLE",
          modelId: spec.modelId,
          usage: normalizeUsage(result.totalUsage),
          gatewayCostUsd: readGatewayCost(result.providerMetadata),
        },
      ],
    });
    const title = sanitizeTitle(result.text);
    if (title) {
      await db.agentConversation.updateMany({
        where: { id: input.conversationId, title: input.replaceTitle },
        data: { title },
      });
    }
  } catch (error) {
    console.error("Agent conversation title failed:", error);
  }
};
