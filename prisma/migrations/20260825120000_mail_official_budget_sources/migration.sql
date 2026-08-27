-- Durable, immutable bibliography for official prices used in mail drafts.
CREATE TABLE "MailDraftRevision" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'AI',
    "manualReviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MailDraftRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailDraftSource" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "officialBudgetVersionId" TEXT NOT NULL,
    "officialBudgetOptionId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MailDraftSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MailDraftRevision_suggestionId_revision_key"
ON "MailDraftRevision"("suggestionId", "revision");
CREATE INDEX "MailDraftRevision_suggestionId_createdAt_idx"
ON "MailDraftRevision"("suggestionId", "createdAt");
CREATE UNIQUE INDEX "MailDraftSource_revisionId_officialBudgetOptionId_key"
ON "MailDraftSource"("revisionId", "officialBudgetOptionId");
CREATE INDEX "MailDraftSource_officialBudgetVersionId_idx"
ON "MailDraftSource"("officialBudgetVersionId");
CREATE INDEX "MailDraftSource_officialBudgetOptionId_idx"
ON "MailDraftSource"("officialBudgetOptionId");

ALTER TABLE "MailDraftRevision" ADD CONSTRAINT "MailDraftRevision_suggestionId_fkey"
FOREIGN KEY ("suggestionId") REFERENCES "MailSuggestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MailDraftSource" ADD CONSTRAINT "MailDraftSource_revisionId_fkey"
FOREIGN KEY ("revisionId") REFERENCES "MailDraftRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MailDraftSource" ADD CONSTRAINT "MailDraftSource_officialBudgetVersionId_fkey"
FOREIGN KEY ("officialBudgetVersionId") REFERENCES "OfficialBudgetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MailDraftSource" ADD CONSTRAINT "MailDraftSource_officialBudgetOptionId_fkey"
FOREIGN KEY ("officialBudgetOptionId") REFERENCES "OfficialBudgetVersionOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION reject_mail_draft_revision_change()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'mail draft revisions are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MailDraftRevision_immutable"
BEFORE UPDATE OR DELETE ON "MailDraftRevision"
FOR EACH ROW EXECUTE FUNCTION reject_mail_draft_revision_change();

CREATE OR REPLACE FUNCTION protect_mail_draft_source()
RETURNS trigger AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'mail draft sources are immutable';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "OfficialBudgetVersionOption"
    WHERE "id" = NEW."officialBudgetOptionId"
      AND "versionId" = NEW."officialBudgetVersionId"
  ) THEN
    RAISE EXCEPTION 'mail draft source option does not belong to version';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MailDraftSource_guard"
BEFORE INSERT OR UPDATE OR DELETE ON "MailDraftSource"
FOR EACH ROW EXECUTE FUNCTION protect_mail_draft_source();
