import "server-only";

import { readAiEnv, type AiEnv } from "@/lib/ai/model-spec";
import {
  buildTranscriptionForm,
  DEFAULT_TRANSCRIPTION_MODEL,
  OPENAI_TRANSCRIPTION_URL,
  readTranscriptionError,
  readTranscriptionResponse,
  type TranscriptionHints,
} from "@/lib/ai/transcription-request";

// Dictado con OpenAI directo, también con AI_PROVIDER=gateway: el AI SDK
// instalado (@ai-sdk/openai 4.0.69) no conoce gpt-transcribe ni sus campos
// keywords[] y languages[]. Usa la misma OPENAI_API_KEY que el agente.
const TRANSCRIPTION_TIMEOUT_MS = 60_000;

export const resolveTranscriptionModel = (env: AiEnv = process.env) =>
  readAiEnv(env, "AI_TRANSCRIPTION_MODEL") ?? DEFAULT_TRANSCRIPTION_MODEL;

export class TranscriptionError extends Error {
  constructor(message = "No se pudo transcribir el audio. Probá de nuevo.") {
    super(message);
    this.name = "TranscriptionError";
  }
}

export const transcribeAudio = async (input: {
  audio: Blob;
  filename: string;
  hints: TranscriptionHints;
  signal?: AbortSignal;
}) => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new TranscriptionError("Falta configurar OPENAI_API_KEY");
  const modelId = resolveTranscriptionModel();
  const timeout = AbortSignal.timeout(TRANSCRIPTION_TIMEOUT_MS);

  const response = await fetch(OPENAI_TRANSCRIPTION_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: buildTranscriptionForm({ modelId, ...input }),
    signal: input.signal ? AbortSignal.any([input.signal, timeout]) : timeout,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Transcription failed:", response.status, readTranscriptionError(body));
    throw new TranscriptionError();
  }
  const result = readTranscriptionResponse(body);
  if (!result) throw new TranscriptionError();
  return { modelId, ...result };
};
