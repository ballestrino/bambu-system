-- Versioned conversational editing and exact draft outcome attribution.
ALTER TYPE "MailFeedbackOutcome" ADD VALUE IF NOT EXISTS 'USEFUL';
ALTER TYPE "MailFeedbackOutcome" ADD VALUE IF NOT EXISTS 'NOT_USEFUL';
ALTER TYPE "MailFeedbackOutcome" ADD VALUE IF NOT EXISTS 'COPIED';
ALTER TYPE "MailFeedbackOutcome" ADD VALUE IF NOT EXISTS 'SAVED';
ALTER TYPE "MailFeedbackOutcome" ADD VALUE IF NOT EXISTS 'EXTERNAL_SENT';
ALTER TYPE "MailFeedbackOutcome" ADD VALUE IF NOT EXISTS 'BAMBU_SENT';

ALTER TABLE "MailDraftRevision"
ADD COLUMN "instruction" TEXT,
ADD COLUMN "actorId" TEXT,
ADD COLUMN "restoredFromRevision" INTEGER;

ALTER TABLE "MailDraftFeedback"
ADD COLUMN "revisionId" TEXT,
ADD COLUMN "reason" TEXT,
ADD COLUMN "comment" TEXT;

CREATE INDEX "MailDraftRevision_actorId_createdAt_idx"
ON "MailDraftRevision"("actorId", "createdAt");
CREATE INDEX "MailDraftFeedback_revisionId_createdAt_idx"
ON "MailDraftFeedback"("revisionId", "createdAt");

ALTER TABLE "MailDraftRevision" ADD CONSTRAINT "MailDraftRevision_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MailDraftFeedback" ADD CONSTRAINT "MailDraftFeedback_revisionId_fkey"
FOREIGN KEY ("revisionId") REFERENCES "MailDraftRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION validate_mail_draft_feedback_revision()
RETURNS trigger AS $$
BEGIN
  IF NEW."revisionId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "MailDraftRevision"
    WHERE "id" = NEW."revisionId"
      AND (NEW."suggestionId" IS NULL OR "suggestionId" = NEW."suggestionId")
  ) THEN
    RAISE EXCEPTION 'mail feedback revision does not belong to suggestion';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MailDraftFeedback_revision_guard"
BEFORE INSERT OR UPDATE ON "MailDraftFeedback"
FOR EACH ROW EXECUTE FUNCTION validate_mail_draft_feedback_revision();
