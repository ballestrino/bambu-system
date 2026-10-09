import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Lo importa check-agent-attachments.ts. Invariantes que se ven en el código:
// sesión de admin, dueño de cada imagen, orden de los chequeos, migración
// aditiva y tamaño de los archivos. CRLF se normaliza.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

// --- The three routes require an admin session before reading the body.
["app/api/agent/attachments/route.ts", "app/api/agent/attachments/[id]/route.ts", "app/api/agent/transcribe/route.ts"].forEach(
  (path) => {
    const route = read(path);
    assert.match(route, /requireAdminSession\(\)/, path);
    assert.ok(route.indexOf("requireAdminSession()") < route.search(/formData\(\)|await params/), path);
  }
);

// --- Uploads check size before reading and the real type by bytes; the
// image is served only to its owner, privately cached and without sniffing.
const upload = read("app/api/agent/attachments/route.ts");
assert.ok(upload.indexOf("AGENT_IMAGE_MAX_BYTES") < upload.indexOf("arrayBuffer()"));
assert.match(upload, /detectImageMediaType\(data\)/);
const serve = read("app/api/agent/attachments/[id]/route.ts");
assert.match(serve, /getOwnedAttachment\(id, session\.user\.id\)/);
assert.match(serve, /"Cache-Control": "private, max-age=31536000, immutable"/);
assert.match(serve, /"X-Content-Type-Options": "nosniff"/);

// --- Every attachment query filters by its owner (create stores it).
const store = read("lib/agent/attachment-store.ts");
const calls = store.split("db.agentAttachment.").slice(1).map((chunk) => chunk.slice(0, chunk.indexOf(");")));
assert.equal(calls.length, 6);
calls.forEach((call) => assert.match(call, call.startsWith("create(") ? /\.\.\.input,/ : /userId/, call));

// --- The turn checks the images before touching the conversation and links
// them after saving the message; a resend with other images is rejected.
const turn = read("lib/agent/turn.ts");
assert.ok(turn.indexOf("checkMessageAttachments(") < turn.indexOf("claimAgentConversation("));
assert.ok(turn.indexOf("saveUserMessage(") < turn.indexOf("linkMessageAttachments("));
assert.match(read("lib/agent/conversation-store.ts"), /existing\.text !== text \|\| !sameImages/);

// --- Dictation: OpenAI directly with the agent key, recorded as TRANSCRIPTION.
assert.match(read("lib/ai/transcription.ts"), /process\.env\.OPENAI_API_KEY/);
assert.match(read("lib/agent/usage-store.ts"), /kind: "TRANSCRIPTION",/);
assert.match(read("lib/agent/system-prompt.ts"), /Un importe de una imagen no es una fuente de precios\./);

// --- Recording like ChatGPT: the "+" disappears, ■ leaves the text to review
// and ➤ sends it; the meter starts in the tap (before any await), because iOS
// only starts an AudioContext from a user gesture.
const composer = read("components/agent/agent-composer.tsx");
assert.match(composer, /\{!voiceActive && <AgentAttachMenu /);
assert.match(composer, /onStop=\{\(\) => voice\.stop\("review"\)\}/);
assert.match(composer, /onSend=\{\(\) => voice\.stop\("send"\)\}/);
const recorder = read("components/agent/hooks/use-voice-recorder.ts");
assert.ok(recorder.indexOf("createAudioMeter()") < recorder.indexOf("await navigator.mediaDevices.getUserMedia"));
assert.doesNotMatch(read("components/agent/agent-voice-controls.tsx"), /Descartar/);

// --- The migration only adds: an enum value, a defaulted column and a table.
const migration = read("prisma/migrations/20261008120000_agent_attachments_transcription/migration.sql");
assert.doesNotMatch(migration, /DROP |ALTER COLUMN|RENAME|DELETE FROM|^UPDATE /m);
assert.match(migration, /ALTER TYPE "AgentUsageKind" ADD VALUE 'TRANSCRIPTION';/);
assert.match(migration, /ADD COLUMN\s+"audioSeconds" INTEGER NOT NULL DEFAULT 0;/);
assert.match(migration, /REFERENCES "AgentMessage"\("id"\) ON DELETE CASCADE/);

// --- Authored files stay at 200 lines or less.
[
  "components/agent/agent-composer.tsx",
  "components/agent/agent-attach-menu.tsx",
  "components/agent/agent-composer-images.tsx",
  "components/agent/agent-voice-controls.tsx",
  "components/agent/agent-voice-waveform.tsx",
  "components/agent/audio-meter.ts",
  "lib/agent/audio-level.ts",
  "components/agent/agent-message-images.tsx",
  "components/agent/agent-uploads.ts",
  "components/agent/hooks/use-composer-images.ts",
  "components/agent/hooks/use-voice-recorder.ts",
  "lib/agent/attachment-rules.ts",
  "lib/agent/attachment-store.ts",
  "lib/agent/history-images.ts",
  "lib/agent/image-compress.ts",
  "lib/ai/transcription.ts",
  "lib/ai/transcription-request.ts",
  "lib/ai/pricing.ts",
].forEach((path) => assert.ok(read(path).split("\n").length <= 200, path));
