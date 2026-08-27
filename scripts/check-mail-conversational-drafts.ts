import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  mailDraftContentSchema,
  mailDraftFeedbackSchema,
  mailDraftRestoreSchema,
  mailDraftRevisionRequestSchema,
} from "../schemas/mail";

const content = mailDraftContentSchema.parse({
  suggestionId: "suggestion-1",
  subject: "  Re: Consulta  ",
  body: "  Respuesta revisada  ",
});
assert.equal(content.subject, "Re: Consulta");
assert.equal(content.body, "Respuesta revisada");

assert.equal(
  mailDraftRevisionRequestSchema.parse({
    suggestionId: "suggestion-1",
    instruction: "Hacelo más breve",
  }).instruction,
  "Hacelo más breve"
);
assert.equal(
  mailDraftRestoreSchema.parse({
    suggestionId: "suggestion-1",
    revisionId: "revision-2",
  }).revisionId,
  "revision-2"
);
assert(mailDraftFeedbackSchema.safeParse({
  suggestionId: "suggestion-1",
  revisionId: "revision-2",
  outcome: "USEFUL",
}).success);
assert(!mailDraftFeedbackSchema.safeParse({
  suggestionId: "suggestion-1",
  revisionId: "revision-2",
  outcome: "NOT_USEFUL",
}).success, "No sirve requires a reason");
assert(mailDraftFeedbackSchema.safeParse({
  suggestionId: "suggestion-1",
  revisionId: "revision-2",
  outcome: "NOT_USEFUL",
  reason: "tono",
  comment: "Demasiado formal",
}).success);

const migration = readFileSync(join(
  process.cwd(),
  "prisma/migrations/20260825170000_mail_conversational_draft_editor/migration.sql"
), "utf8");
for (const outcome of [
  "USEFUL", "NOT_USEFUL", "COPIED", "SAVED", "EXTERNAL_SENT", "BAMBU_SENT",
]) {
  assert(migration.includes(`'${outcome}'`));
}
assert(migration.includes('"revisionId" TEXT'));
assert(migration.includes('CREATE TRIGGER "MailDraftFeedback_revision_guard"'));

const revisionHelper = readFileSync(
  join(process.cwd(), "lib/mail-agent/draft-revisions.ts"),
  "utf8"
);
assert(revisionHelper.includes('origin: "AI" | "MANUAL" | "RESTORED"'));
assert(revisionHelper.includes("revision: latest.revision + 1"));
assert(revisionHelper.includes('cancelReason: "draft_revised"'));
assert(revisionHelper.includes('outcome: "SAVED"'));

const model = readFileSync(join(process.cwd(), "lib/mail-agent/draft-model.ts"), "utf8");
assert(model.includes("store: false"));
assert(model.includes("MAIL_DRAFT_REVISION_INSTRUCTIONS"));
const conversation = readFileSync(
  join(process.cwd(), "lib/mail-agent/conversational-draft.ts"),
  "utf8"
);
assert(conversation.includes("take: 4"), "only bounded revision history reaches Luna");
assert(conversation.includes("currentOfficialSources"));
assert(conversation.includes("preservedSources"), "sources survive conversational edits");

const editor = readFileSync(
  join(process.cwd(), "components/mail/mail-draft-editor.tsx"),
  "utf8"
);
const feedbackUi = readFileSync(
  join(process.cwd(), "components/mail/mail-draft-feedback.tsx"),
  "utf8"
);
for (const label of [
  "Guardar",
  "Sirve",
  "No sirve",
  "Copiar",
  "Envié por mi cuenta",
  "Responder desde Bambú",
  "Perfecta: automatizar similares",
]) {
  assert(`${editor}\n${feedbackUi}`.includes(label), `missing UI label: ${label}`);
}

console.log("Mail conversational draft checks passed");
