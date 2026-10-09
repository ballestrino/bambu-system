import assert from "node:assert/strict";

import { measureLevel, pushLevel } from "../lib/agent/audio-level";
import { AGENT_TRANSCRIPTION_HINTS } from "../lib/agent/transcription-hints";
import {
  buildTranscriptionForm,
  readTranscriptionError,
  readTranscriptionResponse,
  supportsHintFields,
} from "../lib/ai/transcription-request";

// Lo importa check-agent-attachments.ts. El pedido a
// /v1/audio/transcriptions: gpt-transcribe con keywords[] y languages[]; los
// modelos anteriores, con language y las palabras en el prompt.

const audio = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
const hints = {
  prompt: "Mensaje de voz.",
  keywords: ["Literal E", "IVA", "Literal E", "a<b>\nc", "  "],
  languages: ["es"],
};

// --- gpt-transcribe: dedicated fields, no singular language, keywords
// cleaned (OpenAI rejects the request on <, > or a line break) and deduplicated.
assert.ok(supportsHintFields("gpt-transcribe"));
assert.ok(!supportsHintFields("gpt-4o-transcribe") && !supportsHintFields("whisper-1"));
const form = buildTranscriptionForm({ modelId: "gpt-transcribe", audio, filename: "dictado.webm", hints });
assert.equal(form.get("model"), "gpt-transcribe");
assert.equal((form.get("file") as File).name, "dictado.webm");
assert.equal(form.get("prompt"), "Mensaje de voz.");
assert.deepEqual(form.getAll("keywords[]"), ["Literal E", "IVA", "a b c"]);
assert.deepEqual(form.getAll("languages[]"), ["es"]);
assert.equal(form.get("language"), null);

// --- Older models: language and the words inside the prompt.
const older = buildTranscriptionForm({ modelId: "whisper-1", audio, filename: "dictado.webm", hints });
assert.equal(older.get("language"), "es");
assert.equal(older.get("prompt"), "Mensaje de voz. Palabras: Literal E, IVA, a b c.");
assert.deepEqual(older.getAll("keywords[]"), []);

// --- Response: text and, when OpenAI reports it, the audio duration.
assert.deepEqual(readTranscriptionResponse({ text: " Hola ", usage: { type: "duration", seconds: 12.4 } }), {
  text: "Hola",
  seconds: 12.4,
});
assert.deepEqual(readTranscriptionResponse({ text: "Hola", usage: { type: "tokens", input_tokens: 10 } }), {
  text: "Hola",
  seconds: null,
});
assert.equal(readTranscriptionResponse({ error: { message: "x" } }), null);
assert.equal(readTranscriptionError({ error: { message: "Invalid file format." } }), "Invalid file format.");

// --- Waveform level: silence and background noise are a dot, a normal voice
// is a medium bar, a shout fills it; the newest level enters on the right.
const samplesAt = (amplitude: number) => Array.from({ length: 64 }, (_, index) => 128 + (index % 2 ? amplitude : -amplitude));
assert.equal(measureLevel(samplesAt(0)), 0);
assert.equal(measureLevel(samplesAt(1)), 0);
assert.equal(measureLevel([]), 0);
const voice = measureLevel(samplesAt(13));
assert.ok(voice > 0.3 && voice < 0.8, String(voice));
assert.equal(measureLevel(samplesAt(127)), 1);
assert.ok(measureLevel(samplesAt(25)) > voice);
assert.deepEqual(pushLevel([0.1, 0.2, 0.3], 0.9), [0.2, 0.3, 0.9]);

// --- The business hints: Spanish and valid keywords.
assert.deepEqual(AGENT_TRANSCRIPTION_HINTS.languages, ["es"]);
assert.ok(AGENT_TRANSCRIPTION_HINTS.keywords.includes("Literal E"));
assert.ok(AGENT_TRANSCRIPTION_HINTS.keywords.every((keyword) => keyword.trim() && !/[<>\r\n]/.test(keyword)));
