// El pedido a /v1/audio/transcriptions y la lectura de su respuesta. Puro:
// lo prueba el check; la llamada está en transcription.ts.
export const DEFAULT_TRANSCRIPTION_MODEL = "gpt-transcribe";

export const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";

export type TranscriptionHints = {
  // Contexto libre: de qué se habla.
  prompt: string;
  // Palabras que tiene que escribir bien (nombres, siglas, términos).
  keywords: string[];
  // Códigos ISO 639-1 ("es").
  languages: string[];
};

// gpt-transcribe recibe las palabras y los idiomas en campos propios
// (keywords[] y languages[], que reemplazan a language). Los modelos
// anteriores (gpt-4o-*-transcribe, whisper-1) solo aceptan language y prompt:
// ahí las palabras van dentro del prompt.
export const supportsHintFields = (modelId: string) => /^gpt-transcribe($|-)/.test(modelId);

// OpenAI rechaza el pedido entero si una palabra trae <, > o un salto de
// línea.
const cleanKeyword = (keyword: string) => keyword.replace(/[<>\r\n]+/g, " ").replace(/\s+/g, " ").trim();

export const buildTranscriptionForm = (input: {
  modelId: string;
  audio: Blob;
  filename: string;
  hints: TranscriptionHints;
}) => {
  const form = new FormData();
  form.append("model", input.modelId);
  form.append("file", input.audio, input.filename);
  const keywords = [...new Set(input.hints.keywords.map(cleanKeyword).filter(Boolean))];
  if (supportsHintFields(input.modelId)) {
    form.append("prompt", input.hints.prompt);
    keywords.forEach((keyword) => form.append("keywords[]", keyword));
    input.hints.languages.forEach((language) => form.append("languages[]", language));
  } else {
    form.append("prompt", keywords.length ? `${input.hints.prompt} Palabras: ${keywords.join(", ")}.` : input.hints.prompt);
    if (input.hints.languages.length === 1) form.append("language", input.hints.languages[0]);
  }
  return form;
};

// { text, usage?: { type: "duration", seconds } | { type: "tokens", ... } }.
// seconds es null si OpenAI no informa la duración (usage por tokens).
export const readTranscriptionResponse = (body: unknown) => {
  if (!body || typeof body !== "object") return null;
  const { text, usage } = body as { text?: unknown; usage?: { type?: unknown; seconds?: unknown } };
  if (typeof text !== "string") return null;
  const seconds =
    usage?.type === "duration" && typeof usage.seconds === "number" && usage.seconds >= 0
      ? usage.seconds
      : null;
  return { text: text.trim(), seconds };
};

// El mensaje de error de OpenAI ({ error: { message } }), para el log.
export const readTranscriptionError = (body: unknown) => {
  const message = (body as { error?: { message?: unknown } } | null)?.error?.message;
  return typeof message === "string" ? message : null;
};
