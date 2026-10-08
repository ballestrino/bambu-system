import "server-only";

import { AGENT_MAX_RECORDING_SECONDS } from "@/lib/agent/attachment-rules";
import { AGENT_TRANSCRIPTION_HINTS } from "@/lib/agent/transcription-hints";
import { persistTranscriptionUsage } from "@/lib/agent/usage-store";
import type { AgentMode } from "@/lib/ai/modes";
import { estimateTranscriptionCost } from "@/lib/ai/pricing";
import { transcribeAudio } from "@/lib/ai/transcription";
import { db } from "@/lib/db";

// Un dictado del composer: transcribe, registra el consumo y devuelve el
// texto, que el usuario revisa antes de enviar. No toca la conversación.
export const transcribeAgentAudio = async (input: {
  actorId: string;
  audio: Blob;
  filename: string;
  mode: AgentMode;
  conversationId?: string;
  durationSeconds: number;
  signal?: AbortSignal;
}) => {
  const result = await transcribeAudio({
    audio: input.audio,
    filename: input.filename,
    hints: AGENT_TRANSCRIPTION_HINTS,
    signal: input.signal,
  });

  // La duración de OpenAI gana; si no la informa, la del navegador, acotada.
  const seconds = result.seconds ?? Math.min(input.durationSeconds, AGENT_MAX_RECORDING_SECONDS);
  const owned = input.conversationId
    ? await db.agentConversation.count({ where: { id: input.conversationId, userId: input.actorId } })
    : 0;
  try {
    await persistTranscriptionUsage({
      conversationId: owned ? input.conversationId! : null,
      mode: input.mode,
      modelId: result.modelId,
      seconds,
      ...estimateTranscriptionCost(result.modelId, seconds),
    });
  } catch (error) {
    console.error("Transcription usage persistence failed:", error);
  }
  return { text: result.text };
};
