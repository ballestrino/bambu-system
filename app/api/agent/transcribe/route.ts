import { AGENT_AUDIO_MAX_BYTES, AUDIO_TOO_LARGE_MESSAGE, getAudioExtension } from "@/lib/agent/attachment-rules";
import { transcribeAgentAudio } from "@/lib/agent/transcription";
import { TranscriptionError } from "@/lib/ai/transcription";
import { requireAdminSession } from "@/lib/require-admin-session";
import { agentTranscriptionFieldsSchema } from "@/schemas/agent";

// Ruta y no Server Action: recibe un archivo de audio (una acción acepta
// hasta 1 MB por defecto). Devuelve el texto; no escribe en la conversación.
export const runtime = "nodejs";
export const maxDuration = 60;

const jsonError = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return jsonError("Necesitás iniciar sesión como administrador", 403);
  }

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!form || !(audio instanceof Blob) || audio.size === 0) return jsonError("Falta el audio", 400);
  if (audio.size > AGENT_AUDIO_MAX_BYTES) return jsonError(AUDIO_TOO_LARGE_MESSAGE, 413);
  const extension = getAudioExtension(audio.type);
  if (!extension) return jsonError("Formato de audio no soportado", 415);
  const fields = agentTranscriptionFieldsSchema.safeParse({
    mode: form.get("mode"),
    conversationId: form.get("conversationId") ?? undefined,
    durationSeconds: form.get("durationSeconds"),
  });
  if (!fields.success) return jsonError("Pedido inválido", 400);

  try {
    const result = await transcribeAgentAudio({
      actorId: session.user.id,
      audio,
      filename: `dictado.${extension}`,
      ...fields.data,
      signal: request.signal,
    });
    if (!result.text) return jsonError("No se escuchó nada en el audio.", 422);
    return Response.json(result);
  } catch (error) {
    if (error instanceof TranscriptionError) return jsonError(error.message, 502);
    console.error("Agent transcription failed:", error);
    return jsonError("No se pudo transcribir el audio. Probá de nuevo.", 500);
  }
}
