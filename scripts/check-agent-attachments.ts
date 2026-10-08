import assert from "node:assert/strict";

import {
  AGENT_AUDIO_MAX_BYTES,
  AGENT_IMAGE_MAX_BYTES,
  AGENT_MAX_IMAGES,
  agentAttachmentUrl,
  getAttachmentIds,
  getAudioExtension,
  parseAgentAttachmentId,
  TOO_MANY_IMAGES_MESSAGE,
} from "../lib/agent/attachment-rules";
import { buildAgentChatBody } from "../lib/agent/chat-request";
import { needsModelTitle, titleSourceText } from "../lib/agent/conversation-title-rules";
import {
  MISSING_IMAGE_TEXT,
  OLDER_IMAGE_TEXT,
  selectHistoryImageIds,
  withInlineImages,
} from "../lib/agent/history-images";
import { fitWithin } from "../lib/agent/image-compress";
import { detectImageMediaType } from "../lib/agent/image-signature";
import type { AgentUIMessage } from "../lib/agent/messages";
import { estimateTranscriptionCost } from "../lib/ai/pricing";
import { agentChatRequestSchema, agentTranscriptionFieldsSchema, agentUserMessageSchema } from "../schemas/agent";
import "./agent-attachment-source-checks";
import "./agent-transcription-checks";

// Imágenes del composer (feature 23): límites, partes del mensaje, títulos e
// historial que ve el modelo. Sin base ni red.

const id = (n: number) => `c${String(n).padStart(24, "0")}`;
const image = (n: number) => ({ type: "file" as const, mediaType: "image/jpeg" as const, url: agentAttachmentUrl(id(n)) });
const text = (value: string) => ({ type: "text" as const, text: value });
const userMessage = (parts: unknown[]) => ({ id: "msg_user_0001", role: "user", parts });

// --- Up to 7 images per message, with or without text; never 8, repeated,
// foreign URLs, data URLs or GIF.
const sevenImages = Array.from({ length: AGENT_MAX_IMAGES }, (_, n) => image(n));
assert.equal(AGENT_MAX_IMAGES, 7);
assert.ok(agentUserMessageSchema.safeParse(userMessage([...sevenImages, text("¿Cuánto sale?")])).success);
assert.ok(agentUserMessageSchema.safeParse(userMessage([image(1)])).success);
const eight = agentUserMessageSchema.safeParse(userMessage([...sevenImages, image(8)]));
assert.ok(!eight.success && eight.error.issues.some((issue) => issue.message === TOO_MANY_IMAGES_MESSAGE));
assert.ok(!agentUserMessageSchema.safeParse(userMessage([image(1), image(1)])).success);
assert.ok(!agentUserMessageSchema.safeParse(userMessage([{ ...image(1), url: "https://evil.example/x.jpg" }])).success);
assert.ok(!agentUserMessageSchema.safeParse(userMessage([{ ...image(1), url: "data:image/jpeg;base64,AAAA" }])).success);
assert.ok(!agentUserMessageSchema.safeParse(userMessage([{ ...image(1), mediaType: "image/gif" }])).success);
assert.ok(!agentUserMessageSchema.safeParse(userMessage([])).success);
assert.ok(!agentUserMessageSchema.safeParse(userMessage([text("   ")])).success);

// --- Attachment URLs and ids.
assert.equal(parseAgentAttachmentId(agentAttachmentUrl(id(3))), id(3));
assert.equal(parseAgentAttachmentId("/api/agent/attachments/../secret"), null);
assert.deepEqual(getAttachmentIds([image(2), text("hola"), image(1), image(2)]), [id(2), id(1)]);

// --- The request body: text and uploaded images travel; empty text, blob or
// data URLs do not. It passes the route schema.
const sent: AgentUIMessage = {
  id: "msg_user_0001",
  role: "user",
  parts: [image(1), { type: "file", mediaType: "image/png", url: "blob:http://localhost/x" }, text("")],
};
const body = buildAgentChatBody({ id: "conv_0001", messages: [sent], trigger: "submit-message", messageId: undefined, options: { mode: "bajo", skill: "general" } });
assert.deepEqual(body.message.parts, [image(1)]);
assert.ok(agentChatRequestSchema.safeParse(body).success);

// --- Titles: an image-only first message is "Imagen adjunta" and does not ask
// the model for a title (it writes it from the text).
assert.equal(titleSourceText({ parts: [image(1)] }), "Imagen adjunta");
assert.equal(titleSourceText({ parts: [image(1), image(2), image(3)] }), "3 imágenes adjuntas");
assert.equal(titleSourceText({ parts: [image(1), text("Pedido de Ana")] }), "Pedido de Ana");
const first = (parts: AgentUIMessage["parts"]): AgentUIMessage[] => [{ id: "m1", role: "user", parts }];
assert.equal(needsModelTitle(first([image(1)]), "Imagen adjunta"), false);
assert.equal(needsModelTitle(first([image(1), text("Pedido de Ana")]), "Pedido de Ana"), true);

// --- History: the 14 most recent images go with their bytes; older ones and
// deleted ones become a text notice; assistant messages are untouched.
const history: AgentUIMessage[] = [
  { id: "u1", role: "user", parts: sevenImages.map((_, n) => image(100 + n)) },
  { id: "a1", role: "assistant", parts: [text("Listo")] },
  { id: "u2", role: "user", parts: sevenImages.map((_, n) => image(200 + n)) },
  { id: "u3", role: "user", parts: [image(300), text("y esta")] },
];
const selected = selectHistoryImageIds(history);
assert.equal(selected.length, 14);
assert.equal(selected[0], id(300));
assert.ok(!selected.includes(id(100)) && selected.includes(id(101)));
const bytes = new Map(selected.filter((value) => value !== id(200)).map((value) => [value, { mediaType: "image/jpeg", data: new Uint8Array([0xff, 0xd8, 0xff]) }]));
const inlined = withInlineImages(history, selected, bytes);
assert.deepEqual(inlined[0].parts[0], text(OLDER_IMAGE_TEXT));
assert.deepEqual(inlined[0].parts[1], { ...image(101), url: "data:image/jpeg;base64,/9j/" });
assert.deepEqual(inlined[2].parts[0], text(MISSING_IMAGE_TEXT));
assert.equal(inlined[1], history[1]);
assert.deepEqual(inlined[3].parts[1], text("y esta"));

// --- Every request stays under Vercel's 4.5 MB body limit.
const VERCEL_BODY_LIMIT = 4.5 * 1024 * 1024;
assert.ok(AGENT_IMAGE_MAX_BYTES < VERCEL_BODY_LIMIT && AGENT_AUDIO_MAX_BYTES < VERCEL_BODY_LIMIT);

// --- Browser resize: the longest side goes to 1600 px, smaller images stay.
assert.deepEqual(fitWithin(4032, 3024), { width: 1600, height: 1200 });
assert.deepEqual(fitWithin(1170, 2532), { width: 739, height: 1600 });
assert.deepEqual(fitWithin(800, 600), { width: 800, height: 600 });

// --- Real image type by its bytes, not by what the browser says.
assert.equal(detectImageMediaType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
assert.equal(detectImageMediaType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
assert.equal(detectImageMediaType(new Uint8Array([...Buffer.from("RIFF"), 1, 2, 3, 4, ...Buffer.from("WEBP")])), "image/webp");
assert.equal(detectImageMediaType(new Uint8Array([...Buffer.from("GIF89a")])), null);
assert.equal(detectImageMediaType(new Uint8Array([...Buffer.from("<svg>")])), null);

// --- Audio formats OpenAI accepts (Chrome webm, Safari mp4); not ogg.
assert.equal(getAudioExtension("audio/webm;codecs=opus"), "webm");
assert.equal(getAudioExtension("audio/mp4"), "mp4");
assert.equal(getAudioExtension("audio/ogg;codecs=opus"), null);

// --- Dictation fields and price per minute (gpt-transcribe US$ 0,0045).
assert.ok(agentTranscriptionFieldsSchema.safeParse({ mode: "bajo", durationSeconds: "31.5" }).success);
assert.ok(!agentTranscriptionFieldsSchema.safeParse({ mode: "bajo", durationSeconds: "400" }).success);
assert.deepEqual(estimateTranscriptionCost("gpt-transcribe", 30), { costUsd: 0.00225, priced: true });
assert.deepEqual(estimateTranscriptionCost("openai/gpt-4o-mini-transcribe", 60), { costUsd: 0.003, priced: true });
assert.deepEqual(estimateTranscriptionCost("otro-modelo", 60), { costUsd: null, priced: false });

console.log("Agent attachment checks passed");
